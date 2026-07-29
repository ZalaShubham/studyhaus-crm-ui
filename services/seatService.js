import { collection, query, onSnapshot, addDoc, getDocs, doc, updateDoc, getDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import { validateSeatAssignment } from "./seatValidation.js";

// ===============================================
// SEAT INITIALIZATION & LISTENERS
// ===============================================

export const seedInitialSeats = async () => {
  const seatsRef = collection(db, "seats");
  const snap = await getDocs(seatsRef);
  
  if (snap.empty) {
    console.log("Seeding initial 50 seats...");
    for (let i = 1; i <= 50; i++) {
      const numStr = i < 10 ? `0${i}` : `${i}`;
      await addDoc(seatsRef, {
        seatNumber: `A${numStr}`,
        status: "Available", // Available, Occupied, Reserved, Maintenance, Inactive
        assignedStudentId: null,
        assignedStudentName: null,
        planType: null,
        lastUpdated: serverTimestamp()
      });
    }
  }
};

export const addSingleSeat = async (seatNumber, floor = "Ground Floor") => {
  try {
    const seatsRef = collection(db, "seats");
    await addDoc(seatsRef, {
      seatNumber,
      floor,
      status: "Available",
      assignedStudentId: null,
      assignedStudentName: null,
      planType: null,
      lastUpdated: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const listenToAllSeats = (onUpdate) => {
  const q = query(collection(db, "seats"), orderBy("seatNumber"));
  return onSnapshot(q, (snapshot) => {
    const seats = [];
    snapshot.forEach(doc => seats.push({ id: doc.id, ...doc.data() }));
    onUpdate(seats);
  });
};

// ===============================================
// ADMIN ACTIONS
// ===============================================

export const assignSeat = async (seatId, student) => {
  try {
    const seatRef = doc(db, "seats", seatId);
    const snap = await getDoc(seatRef);
    if (!snap.exists()) throw new Error("Seat not found.");
    
    validateSeatAssignment(snap.data());

    // Update Seat
    await updateDoc(seatRef, {
      status: "Reserved", // It's assigned/reserved for this student
      assignedStudentId: student.id,
      assignedStudentName: student.name,
      planType: student.planName || "Unknown",
      lastUpdated: serverTimestamp()
    });

    // Also update Student profile so they know their seat
    const studentRef = doc(db, "students", student.id);
    await updateDoc(studentRef, {
      seatNumber: snap.data().seatNumber,
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const unassignSeat = async (seatId) => {
  try {
    const seatRef = doc(db, "seats", seatId);
    const snap = await getDoc(seatRef);
    if (!snap.exists()) throw new Error("Seat not found.");

    const data = snap.data();
    if (data.assignedStudentId) {
      // Clear from student profile
      const studentRef = doc(db, "students", data.assignedStudentId);
      await updateDoc(studentRef, { seatNumber: null });
    }

    // Reset Seat
    await updateDoc(seatRef, {
      status: "Available",
      assignedStudentId: null,
      assignedStudentName: null,
      planType: null,
      lastUpdated: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const changeSeatStatus = async (seatId, newStatus) => {
  try {
    const seatRef = doc(db, "seats", seatId);
    await updateDoc(seatRef, {
      status: newStatus,
      lastUpdated: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
