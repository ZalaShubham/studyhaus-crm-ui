import { onAuthStateChanged } from "../services/authService.js";
import { getDocument } from "../services/firestoreService.js";
import { getRedirectUrlForRole } from "./login.js";
import { protectRoute } from "./middleware.js";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase.js";

/**
 * Initialize Authentication Guard
 * Listens to Firebase Auth state.
 * - Redirects to login if unauthenticated on a protected page.
 * - Redirects to dashboard if authenticated on login page.
 * - Runs middleware to check role permissions if authenticated.
 */
export const initAuthGuard = () => {
  // Show global loading state if a container exists
  const loader = document.getElementById("global-loader");
  if (loader) loader.style.display = "flex";

  const currentPath = window.location.pathname;
  const isPublicPage = currentPath.endsWith("login.html") || currentPath.endsWith("forgot-password.html") || currentPath.endsWith("register.html");

  onAuthStateChanged(async (user) => {
    if (user) {
      // User is logged in
      try {
        // Fetch role if not in localStorage or to ensure it's up to date
        let role = localStorage.getItem("userRole");
        if (!role) {
          let userDoc = await getDocument("users", user.uid);
          let docId = user.uid;
          
          if (!userDoc || !userDoc.role) {
            userDoc = await getDocument("students", user.uid);
            if (!userDoc) {
              const q = query(collection(db, "students"), where("email", "==", user.email));
              const snap = await getDocs(q);
              if (!snap.empty) {
                userDoc = snap.docs[0].data();
                docId = snap.docs[0].id;
              }
            }
            if (userDoc) {
              userDoc.role = userDoc.role || "Student"; // Default if missing
            }
          }
          
          if (userDoc && userDoc.role) {
            role = userDoc.role;
            localStorage.setItem("userRole", role);
            localStorage.setItem("userId", docId);
          } else {
            // No role found in DB, sign out
            throw new Error("User role not found.");
          }
        }

        if (isPublicPage) {
          // Redirect logged-in users away from login page to their dashboard
          window.location.href = getRedirectUrlForRole(role);
        } else {
          // ── Resolve display name ──────────────────────────────────────
          // Priority: Firestore name → email prefix → "User"
          let userDoc2 = null;
          try {
            userDoc2 = await getDocument("users", user.uid);
            if (!userDoc2) userDoc2 = await getDocument("students", user.uid);
          } catch (_) {}

          const displayName = (userDoc2 && userDoc2.name)
            ? userDoc2.name
            : (user.email ? user.email.split("@")[0] : "User");

          // Initials for avatar (e.g. "Admin User" → "AU")
          const initials = displayName
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map(w => w[0].toUpperCase())
            .join("") || "?";

          // Time-based greeting
          const hour = new Date().getHours();
          const timeGreeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

          // ── Update DOM ────────────────────────────────────────────────
          const nameEl    = document.getElementById("current-user-name");
          const roleEl    = document.getElementById("current-user-role");
          const avatarEl  = document.getElementById("current-user-avatar");
          const greetEl   = document.getElementById("dashboard-greeting");

          if (nameEl)   nameEl.textContent   = displayName;
          if (roleEl)   roleEl.textContent   = role;
          if (avatarEl) avatarEl.textContent = initials;
          if (greetEl)  greetEl.textContent  = `${timeGreeting}, ${displayName.split(" ")[0]}! 👋`;

          // If on a protected page, check permissions
          protectRoute(role, currentPath);
          if (loader) loader.style.display = "none";
        }
      } catch (error) {
        console.error("Auth Guard Error:", error);
        localStorage.removeItem("userRole");
        localStorage.removeItem("userId");
        if (!isPublicPage) {
          window.location.href = "/login.html";
        } else if (loader) {
          loader.style.display = "none";
        }
      }
    } else {
      // User is NOT logged in
      localStorage.removeItem("userRole");
      localStorage.removeItem("userId");
      
      if (!isPublicPage) {
        // Redirect to login if on a protected page
        window.location.href = "/login.html";
      } else {
        if (loader) loader.style.display = "none";
      }
    }
  });
};
