import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import { login as authServiceLogin, setSessionPersistence } from "../services/authService.js";
import { getDocument } from "../services/firestoreService.js";
import { ROLES } from "./roles.js";
import { toUserFriendlyAuthError } from "./errorMessages.js";

/**
 * Helper to retry an operation with exponential backoff
 */
const retryWithBackoff = async (fn, retries = 3, delay = 500) => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
};

/**
 * Get dashboard URL based on the user's role
 */
export const getRedirectUrlForRole = (rawRole) => {
  let role = rawRole;
  if (role === "Admin" || role === "owner" || role === "admin" || role === "Owner") {
    role = ROLES.OWNER;
  }

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
    try {
      userDoc = await retryWithBackoff(() => getDocument("users", user.uid));
    } catch (_) { /* ignore permission errors */ }

    // 2. Also check role-named collections (Manager, Employee, Owner/Admin)
    //    — handles documents created manually in Firestore by an admin
    if (!userDoc || !userDoc.role) {
      const roleCollections = ["Manager", "Employee", "Owner", "Admin", "students"];
      for (const col of roleCollections) {
        try {
          const doc = await retryWithBackoff(() => getDocument(col, user.uid));
          if (doc) { userDoc = doc; break; }
        } catch (_) { /* ignore permission errors for unauthorized collections */ }
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
      if (user.email === "admin@studyhaus.com") {
        // Auto-heal the admin account if it got stuck due to previous permission errors
        const docData = {
          uid: user.uid,
          email: user.email,
          name: "Admin User",
          role: "Owner/Admin",
          status: "Active",
          createdAt: new Date().toISOString(),
        };
        const { setDoc, doc } = await import("firebase/firestore");
        await setDoc(doc(db, "users", user.uid), docData);
        userDoc = docData;
        docId = user.uid;
      } else {
        throw new Error(
          "User profile not found. If you recently registered, please click 'Create account' again with the same credentials to complete your setup."
        );
      }
    }
    
    if (userDoc.status === "disabled" || userDoc.status === "Inactive" || userDoc.status === "Old" || userDoc.status === "Old Student") {
      throw new Error("Account Disabled, Inactive, or Moved to Old Students. Please contact administration.");
    }

    localStorage.setItem("userRole", userDoc.role);
    localStorage.setItem("userId", docId); // Store actual doc ID, whether UID or auto-id

    window.location.href = getRedirectUrlForRole(userDoc.role);
  } catch (error) {
    console.error("Login Error:", error);
    throw new Error(toUserFriendlyAuthError(error));
  }
};
