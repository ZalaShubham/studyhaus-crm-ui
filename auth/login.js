import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import { login as authServiceLogin, setSessionPersistence } from "../services/authService.js";
import { getDocument } from "../services/firestoreService.js";
import { ROLES } from "./roles.js";
import { toUserFriendlyAuthError } from "./errorMessages.js";

/**
 * Get dashboard URL based on the user's role
 */
export const getRedirectUrlForRole = (role) => {
  switch (role) {
    case ROLES.OWNER:
      return "/admin/dashboard.html";
    case ROLES.MANAGER:
      return "/manager/dashboard.html";
    case ROLES.EMPLOYEE:
      return "/employee/dashboard.html";
    case ROLES.STUDENT:
      return "/student/dashboard.html";
    default:
      return "/unauthorized.html";
  }
};

/**
 * Handle user login flow
 * @param {string} email 
 * @param {string} password 
 */
export const handleLogin = async (email, password) => {
  try {
    await setSessionPersistence();
    const user = await authServiceLogin(email, password);
    
    let userDoc = await getDocument("users", user.uid);
    let docId = user.uid;
    
    if (!userDoc || !userDoc.role) {
      userDoc = await getDocument("students", user.uid);
      if (!userDoc) {
        // Fallback: Search students by email (for users created manually in Firebase Auth)
        const q = query(collection(db, "students"), where("email", "==", user.email));
        const snap = await getDocs(q);
        if (!snap.empty) {
          userDoc = snap.docs[0].data();
          docId = snap.docs[0].id;
        }
      }
      if (userDoc) {
        userDoc.role = userDoc.role || "Student";
      }
    }
    
    if (!userDoc || !userDoc.role) {
      throw new Error(
        "User data or role not found in database. In Firebase Console, create a document at users/" +
        user.uid +
        " with fields: email, role (Owner/Admin, Manager, Employee, or Student), status (Active)."
      );
    }
    
    if (userDoc.status === "disabled" || userDoc.status === "Inactive") {
      throw new Error("Account Disabled or Inactive. Please contact administration.");
    }

    localStorage.setItem("userRole", userDoc.role);
    localStorage.setItem("userId", docId); // Store actual doc ID, whether UID or auto-id

    window.location.href = getRedirectUrlForRole(userDoc.role);
  } catch (error) {
    console.error("Login Error:", error);
    throw new Error(toUserFriendlyAuthError(error));
  }
};
