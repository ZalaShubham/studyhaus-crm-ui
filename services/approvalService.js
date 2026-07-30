import { doc, getDoc, deleteDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebase.js";

/**
 * Approve a pending admission
 * Moves the document from 'admissions' to 'students' collection
 */
export const approveAdmission = async (admissionId) => {
  try {
    const admissionRef = doc(db, "admissions", admissionId);
    const docSnap = await getDoc(admissionRef);
    
    if (!docSnap.exists()) {
      throw new Error("Admission record not found.");
    }
    
    const data = docSnap.data();
    data.approvalStatus = "Approved";
    data.status = "Active";
    data.updatedAt = new Date().toISOString();

    // Create in students collection
    const studentRef = doc(db, "students", admissionId);
    await setDoc(studentRef, data);

    // Update the corresponding user document to Active
    const userRef = doc(db, "users", admissionId);
    try {
      await updateDoc(userRef, { status: "Active" });
    } catch (e) {
      console.warn("Could not update users document (it may not exist if created via manual admin admission):", e);
    }

    // Remove from admissions collection
    await deleteDoc(admissionRef);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Reject an admission
 */
export const rejectAdmission = async (admissionId, reason) => {
  try {
    const admissionRef = doc(db, "admissions", admissionId);
    await updateDoc(admissionRef, {
      approvalStatus: "Rejected",
      rejectReason: reason || "",
      status: "Rejected",
      updatedAt: new Date().toISOString()
    });

    const userRef = doc(db, "users", admissionId);
    try {
      await updateDoc(userRef, { status: "Rejected" });
    } catch (e) {
      console.warn("Could not update users document:", e);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Request Changes for an admission
 */
export const requestChangesAdmission = async (admissionId, notes) => {
  try {
    const admissionRef = doc(db, "admissions", admissionId);
    await updateDoc(admissionRef, {
      approvalStatus: "Changes Requested",
      adminNotes: notes || "",
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
