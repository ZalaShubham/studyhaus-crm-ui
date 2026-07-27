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
    
    let userDoc = null;
    let docId = user.uid;

    // 1. Check the canonical 'users' collection first (where register.js writes)
    userDoc = await getDocument("users", user.uid);

    // 2. Also check role-named collections (Manager, Employee, Owner/Admin)
    //    — handles documents created manually in Firestore by an admin
    if (!userDoc || !userDoc.role) {
      const roleCollections = ["Manager", "Employee", "Owner", "Admin", "students"];
      for (const col of roleCollections) {
        const doc = await getDocument(col, user.uid);
        if (doc) { userDoc = doc; break; }
      }
    }

    // 3. Email-based search across role collections for manually created users
    if (!userDoc || !userDoc.role) {
      const searchCollections = ["users", "Manager", "Employee", "students"];
      for (const col of searchCollections) {
        try {
          const q = query(collection(db, col), where("email", "==", user.email));
          const snap = await getDocs(q);
          if (!snap.empty) {
            userDoc = snap.docs[0].data();
            docId = snap.docs[0].id;
            break;
          }
        } catch (_) { /* collection may not exist, skip */ }
      }
    }

    // 4. Default role to Student if a doc was found but role field is missing
    if (userDoc && !userDoc.role) {
      userDoc.role = "Student";
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
