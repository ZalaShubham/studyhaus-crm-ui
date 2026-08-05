import { collection, doc, updateDoc, onSnapshot, getDocs, query, where, serverTimestamp, getDoc, addDoc } from "firebase/firestore";
import { db } from "../firebase/firebase.js";

/**
 * Validates updates to ensure no duplicates for Phone/Email/Student ID
 * (Except for the current student being edited)
 */
const validateStudentUpdate = async (id, updates) => {
  const studentsRef = collection(db, "students");
  
  if (updates.phone) {
    const q = query(studentsRef, where("phone", "==", updates.phone));
    const snap = await getDocs(q);
    const duplicate = snap.docs.find(d => d.id !== id);
    if (duplicate) throw new Error(`Phone number ${updates.phone} is already in use.`);
  }

  if (updates.email) {
    const q = query(studentsRef, where("email", "==", updates.email));
    const snap = await getDocs(q);
    const duplicate = snap.docs.find(d => d.id !== id);
    if (duplicate) throw new Error(`Email ${updates.email} is already in use.`);
  }

  if (updates.studentId) {
    const q = query(studentsRef, where("studentId", "==", updates.studentId));
    const snap = await getDocs(q);
    const duplicate = snap.docs.find(d => d.id !== id);
    if (duplicate) throw new Error(`Student ID ${updates.studentId} is already in use.`);
  }
};

/**
 * Listens to all active/pending/inactive students for the grid
 */
export const listenToAllStudents = (onUpdate, onError) => {
  const studentsRef = collection(db, "students");
  
  return onSnapshot(studentsRef, (snapshot) => {
    const students = [];
    snapshot.forEach(doc => {
      students.push({ id: doc.id, ...doc.data() });
    });
    onUpdate(students);
  }, onError);
};

/**
 * Soft Delete a student
 */
export const softDeleteStudent = async (studentId) => {
  try {
    const docRef = doc(db, "students", studentId);
    await updateDoc(docRef, {
      status: "Old",
      updatedAt: serverTimestamp()
    });
    try {
      const userDocRef = doc(db, "users", studentId);
      await updateDoc(userDocRef, { status: "Old", updatedAt: serverTimestamp() });
    } catch(e) {}
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Update a student's profile
 */
export const updateStudentProfile = async (studentId, updates) => {
  try {
    await validateStudentUpdate(studentId, updates);
    updates.updatedAt = serverTimestamp();
    const docRef = doc(db, "students", studentId);
    
    // Check if seatNumber is being updated
    if (updates.seatNumber !== undefined) {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const oldData = snap.data();
        if (oldData.seatNumber !== updates.seatNumber) {
          const seatsRef = collection(db, "seats");
          
          // 1. Release old seat
          if (oldData.seatNumber) {
            const qOld = query(seatsRef, where("seatNumber", "==", oldData.seatNumber));
            const oldSnap = await getDocs(qOld);
            if (!oldSnap.empty) {
              await updateDoc(doc(db, "seats", oldSnap.docs[0].id), {
                status: "Available",
                assignedStudentId: null,
                assignedStudentName: null,
                planType: null,
                lastUpdated: serverTimestamp()
              });
            }
          }
          
          // 2. Reserve new seat
          if (updates.seatNumber) {
            const qNew = query(seatsRef, where("seatNumber", "==", updates.seatNumber));
            const newSnap = await getDocs(qNew);
            if (!newSnap.empty) {
              await updateDoc(doc(db, "seats", newSnap.docs[0].id), {
                status: "Reserved",
                assignedStudentId: studentId,
                assignedStudentName: updates.name || oldData.name || "Unknown",
                planType: updates.planName || oldData.planName || "Unknown",
                lastUpdated: serverTimestamp()
              });
            } else {
              // Create the seat if it doesn't exist
              let floor = "Ground Floor";
              if (updates.seatNumber.startsWith("B")) floor = "First Floor";
              
              await addDoc(seatsRef, {
                seatNumber: updates.seatNumber,
                floor: floor,
                status: "Reserved",
                assignedStudentId: studentId,
                assignedStudentName: updates.name || oldData.name || "Unknown",
                planType: updates.planName || oldData.planName || "Unknown",
                lastUpdated: serverTimestamp()
              });
            }
          }
        }
      }
    }

    await updateDoc(docRef, updates);
    
    if (updates.status !== undefined) {
      try {
        const userDocRef = doc(db, "users", studentId);
        await updateDoc(userDocRef, { status: updates.status, updatedAt: serverTimestamp() });
      } catch (e) {}
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
