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

      // 1. Try the students collection first (added by admin via Admissions)
      const q = query(collection(db, "students"), where("email", "==", user.email));

      onSnapshot(q, async (snapshot) => {
        if (!snapshot.empty) {
          // Found in students collection — full profile available
          const studentDoc = snapshot.docs[0];
          onDataUpdate({ id: studentDoc.id, ...studentDoc.data() });
          return;
        }

        // 2. Fallback: check the users collection (registered via register.html)
        try {
          const usersQ = query(collection(db, "users"), where("email", "==", user.email));
          const usersSnap = await getDocs(usersQ);

          if (!usersSnap.empty) {
            const userDoc = usersSnap.docs[0];
            const userData = userDoc.data();
            // Build a minimal student-like profile from the users doc
            onDataUpdate({
              id: userDoc.id,
              name: userData.name || user.email.split("@")[0],
              email: userData.email || user.email,
              role: userData.role || "Student",
              status: userData.status || "Active",
              planName: userData.planName || "Not Assigned",
              seatNumber: userData.seatNumber || null,
              paymentDueDate: userData.paymentDueDate || null,
              parentPhone: userData.parentPhone || "",
              address: userData.address || "",
              _fromUsersCollection: true   // flag so portal knows data is limited
            });
          } else {
            onError("No student profile found. Please contact your admin to complete your enrollment.");
          }
        } catch (fallbackErr) {
          onError("Failed to load your profile: " + fallbackErr.message);
        }
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
