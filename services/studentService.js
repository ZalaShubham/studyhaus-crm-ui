import { collection, doc, updateDoc, onSnapshot, getDocs, query, where, serverTimestamp } from "firebase/firestore";
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
    await updateDoc(docRef, updates);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
