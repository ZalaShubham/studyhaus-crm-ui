import { register as authServiceRegister, setSessionPersistence } from "../services/authService.js";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebase.js";

/**
 * Convert Firebase registration errors into user-friendly messages
 */
const toUserFriendlyRegisterError = (error) => {
  const code = error?.code || "";
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try logging in instead.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password must be at least 6 characters long.";
    case "auth/network-request-failed":
      return "Network error. Check your internet connection and try again.";
    case "auth/operation-not-allowed":
      return "Email/Password sign-up is disabled. Contact your administrator.";
    default:
      return error?.message || "Registration failed. Please try again.";
  }
};

/**
 * Handle user registration flow
 * @param {string} fullName
 * @param {string} email
 * @param {string} password
 * @param {string} role - Selected role from the form
 */
export const handleRegister = async (fullName, email, password, role) => {
  try {
    await setSessionPersistence();

    // 1. Create Firebase Auth user
    const user = await authServiceRegister(email, password);

    // 2. Write user profile to Firestore users collection
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: email,
      name: fullName,
      role: role,
      status: "Active",
      createdAt: new Date().toISOString(),
    });

    // 3. Redirect to login with success message
    window.location.href = "/login.html?registered=1";
  } catch (error) {
    console.error("Registration Error:", error);
    throw new Error(toUserFriendlyRegisterError(error));
  }
};
