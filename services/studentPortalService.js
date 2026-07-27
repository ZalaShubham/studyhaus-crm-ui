import { collection, query, where, onSnapshot, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../firebase/firebase.js";

/**
 * Initializes the Student Portal listener based on the currently logged-in Firebase Auth user.
 * It maps the Auth user email to the students collection.
 */
export const listenToStudentPortalData = (onDataUpdate, onError) => {
  const auth = getAuth();
  
  onAuthStateChanged(auth, async (user) => {
    if (user && user.email) {
      // User is signed in, query students collection by email
      const q = query(collection(db, "students"), where("email", "==", user.email));
      
      onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
          onError("No student profile found for this email address.");
          return;
        }
        // Assuming one student per email
        const studentDoc = snapshot.docs[0];
        onDataUpdate({ id: studentDoc.id, ...studentDoc.data() });
      }, (err) => {
        onError("Failed to fetch student data: " + err.message);
      });
      
    } else {
      onError("No user signed in or missing email.");
    }
  });
};

/**
 * Updates the student's personal editable fields
 */
export const updateStudentOwnProfile = async (studentId, updates) => {
  try {
    const docRef = doc(db, "students", studentId);
    
    // Explicitly pick only allowed fields for safety
    const safeUpdates = {
      updatedAt: serverTimestamp()
    };
    if (updates.email !== undefined) safeUpdates.email = updates.email;
    if (updates.address !== undefined) safeUpdates.address = updates.address;
    if (updates.parentPhone !== undefined) safeUpdates.parentPhone = updates.parentPhone;

    await updateDoc(docRef, safeUpdates);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
