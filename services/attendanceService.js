import { collection, addDoc, updateDoc, doc, query, where, onSnapshot, serverTimestamp, getDocs, getDoc, orderBy } from "firebase/firestore";
import { db } from "../firebase/firebase.js";

// Helper to get today's date string YYYY-MM-DD
const getTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

/**
 * Validates Check-In rules:
 * 1. Checks if Membership is Active.
 * 2. Checks if Seat exists (has truthy value).
 * 3. Checks Night Study constraint.
 * 4. Checks if there is already an Active session today.
 */
const validateCheckIn = async (student, selectedSeatNumber) => {
  if (student.status !== "Active") throw new Error("Membership is not active.");
  
  const isRotational = (student.planName || "").toLowerCase().includes("rotational");
  const finalSeat = isRotational ? selectedSeatNumber : student.seatNumber;

  if (!finalSeat || finalSeat.trim() === "") throw new Error("No seat assigned or selected.");

  // Night Study check (7 PM to 7 AM)
  const isNightPlan = (student.planName || "").toLowerCase().includes("night");
  if (isNightPlan) {
    const hour = new Date().getHours();
    if (hour >= 7 && hour < 19) {
      throw new Error("Night study students can only check in between 7:00 PM and 7:00 AM.");
    }
  }

  const today = getTodayStr();

  // Check for existing Active session
  const q = query(
    collection(db, "attendance"),
    where("studentId", "==", student.id),
    where("status", "==", "Active")
  );
  const snap = await getDocs(q);

  if (!snap.empty) {
    for (const sessionDoc of snap.docs) {
      const sessionData = sessionDoc.data();

      if (sessionData.date === today) {
        // Already checked in TODAY — block the duplicate
        throw new Error("Student is already checked in for today.");
      } else {
        // Stale session from a previous day (student left without checking out).
        // Auto-close it so today's check-in can proceed.
        const checkOutTime = new Date().getTime();
        const checkInTime = sessionData.checkIn || checkOutTime;
        const durationHours = Math.max(0, Math.round((checkOutTime - checkInTime) / (1000 * 60 * 60) * 100) / 100);

        await updateDoc(sessionDoc.ref, {
          checkOut: checkOutTime,
          duration: durationHours,
          status: "Completed",
          autoClosedReason: "Stale session — student did not check out the previous day.",
          updatedAt: serverTimestamp()
        });

        // Free up the seat that was marked Occupied from the stale session
        if (sessionData.seatNumber) {
          const seatQ = query(collection(db, "seats"), where("seatNumber", "==", sessionData.seatNumber));
          const seatSnap = await getDocs(seatQ);
          if (!seatSnap.empty) {
            const seatDoc = seatSnap.docs[0];
            const sData = seatDoc.data();
            const newStatus = sData.assignedStudentId ? "Reserved" : "Available";
            await updateDoc(seatDoc.ref, { status: newStatus, lastUpdated: serverTimestamp() });
          }
        }
      }
    }
  }

  return finalSeat;
};

export const checkIn = async (student, selectedSeatNumber = null) => {
  try {
    const finalSeat = await validateCheckIn(student, selectedSeatNumber);

    // Verify seat is available (or reserved by this student)
    const seatQ = query(collection(db, "seats"), where("seatNumber", "==", finalSeat));
    const seatSnap = await getDocs(seatQ);
    if (seatSnap.empty) throw new Error("Seat not found in database.");
    
    const seatDoc = seatSnap.docs[0];
    const seatData = seatDoc.data();
    
    if (seatData.status === "Occupied") throw new Error("Seat is already occupied.");
    if (seatData.status === "Maintenance" || seatData.status === "Inactive") throw new Error("Seat is not usable.");
    
    // For fixed, check if it belongs to them (unless they are rotational choosing a general seat)
    if (seatData.status === "Reserved" && seatData.assignedStudentId !== student.id) {
      throw new Error("This seat is reserved for someone else.");
    }

    const now = new Date();
    await addDoc(collection(db, "attendance"), {
      studentId: student.id,
      studentName: student.name,
      seatNumber: finalSeat, // The actual seat they are taking
      planName: student.planName,
      date: getTodayStr(),
      checkIn: now.getTime(),
      checkOut: null,
      duration: 0,
      status: "Active",
      createdAt: serverTimestamp()
    });

    // Update Seat to Occupied
    await updateDoc(seatDoc.ref, {
      status: "Occupied",
      lastUpdated: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const checkOut = async (attendanceId, checkInTimestamp) => {
  try {
    // 1. Get attendance record to know which seat to free up
    const docRef = doc(db, "attendance", attendanceId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error("Attendance record not found.");
    const attData = snap.data();

    const now = new Date();
    const checkOutTime = now.getTime();
    const safeCheckIn = checkInTimestamp || attData.checkIn || checkOutTime;
    
    let durationHours = (checkOutTime - safeCheckIn) / (1000 * 60 * 60);
    if (durationHours < 0) durationHours = 0;
    durationHours = Math.round(durationHours * 100) / 100;

    await updateDoc(docRef, {
      checkOut: checkOutTime,
      duration: durationHours,
      status: "Completed",
      updatedAt: serverTimestamp()
    });

    // 2. Free up the seat
    if (attData.seatNumber) {
      const seatQ = query(collection(db, "seats"), where("seatNumber", "==", attData.seatNumber));
      const seatSnap = await getDocs(seatQ);
      if (!seatSnap.empty) {
        const seatDoc = seatSnap.docs[0];
        const sData = seatDoc.data();
        
        // If it's a fixed seat belonging to someone, revert to Reserved. Else Available.
        let newStatus = "Available";
        if (sData.assignedStudentId) newStatus = "Reserved";

        await updateDoc(seatDoc.ref, {
          status: newStatus,
          lastUpdated: serverTimestamp()
        });
      }
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const listenToMyAttendance = (studentId, onUpdate) => {
  if (!studentId) return () => {};
  const q = query(
    collection(db, "attendance"),
    where("studentId", "==", studentId)
  );
  return onSnapshot(q, (snapshot) => {
    const records = [];
    snapshot.forEach(doc => {
      records.push({ id: doc.id, ...doc.data() });
    });
    // Sort descending by checkIn locally since we didn't index it composite
    records.sort((a, b) => b.checkIn - a.checkIn);
    onUpdate(records);
  });
};

export const listenToAllAttendance = (onUpdate) => {
  const q = query(
    collection(db, "attendance")
  );
  return onSnapshot(q, (snapshot) => {
    const records = [];
    snapshot.forEach(doc => {
      records.push({ id: doc.id, ...doc.data() });
    });
    records.sort((a, b) => b.checkIn - a.checkIn);
    onUpdate(records);
  });
};
