import { onAuthStateChanged, logout } from "../services/authService.js";
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
  const isPublicPage = currentPath.endsWith("login.html") || currentPath.endsWith("forgot-password.html") || currentPath.endsWith("register.html") || currentPath.endsWith("unauthorized.html");

  onAuthStateChanged(async (user) => {
    if (user) {
      // User is logged in
      try {
        // Fetch role if not in localStorage or to ensure it's up to date
        let role = localStorage.getItem("userRole");
        if (!role) {
          // Role not cached — fetch from Firestore
          let userDoc = null;
          let docId = user.uid;

          // 1. Canonical 'users' collection
          userDoc = await getDocument("users", user.uid);

          // 2. Role-named collections (Manager, Employee, etc.) by UID
          if (!userDoc || !userDoc.role) {
            const roleCollections = ["Manager", "Employee", "Owner", "Admin", "students"];
            for (const col of roleCollections) {
              const doc = await getDocument(col, user.uid);
              if (doc) { userDoc = doc; break; }
            }
          }

          // 3. Email-based search across all known collections
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
              } catch (_) { /* skip missing collections */ }
            }
          }

          // 4. Default to Student if role field is missing
          if (userDoc && !userDoc.role) {
            userDoc.role = "Student";
          }
          
          if (userDoc && userDoc.role) {
            role = userDoc.role;
            localStorage.setItem("userRole", role);
            localStorage.setItem("userId", docId);
          } else {
            // No role found in DB — sign out cleanly
            throw new Error("User role not found.");
          }
        } else {
          // Role was already in localStorage (e.g. set right after registration).
          // Ensure userId is also stored.
          if (!localStorage.getItem("userId")) {
            localStorage.setItem("userId", user.uid);
          }
        }

        if (isPublicPage) {
          // Redirect logged-in users away from login page to their dashboard
          window.location.href = getRedirectUrlForRole(role);
        } else {
          // ── Resolve display name ──────────────────────────────────────
          // Priority: Firestore name → email prefix → "User"
          let userDoc2 = null;
          const actualDocId = localStorage.getItem("userId") || user.uid;
          try {
            userDoc2 = await getDocument("students", actualDocId);
            if (!userDoc2) userDoc2 = await getDocument("users", actualDocId);
            if (!userDoc2) userDoc2 = await getDocument("users", user.uid);
          } catch (_) {}

          if (userDoc2 && (userDoc2.status === "disabled" || userDoc2.status === "Inactive" || userDoc2.status === "Old" || userDoc2.status === "Old Student")) {
            localStorage.setItem("forceUnauthorized", "true");
            await logout();
            return;
          }

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
          const topbarNameEl = document.getElementById("topbar-user-name");
          const roleEl    = document.getElementById("current-user-role");
          const topbarRoleEl = document.getElementById("topbar-user-role");
          const avatarEl  = document.getElementById("current-user-avatar");
          const topbarAvatarEl = document.getElementById("topbar-user-avatar");
          const greetEl   = document.getElementById("dashboard-greeting");

          if (nameEl)   nameEl.textContent   = displayName;
          if (topbarNameEl) topbarNameEl.textContent = displayName;
          if (roleEl)   roleEl.textContent   = role;
          if (topbarRoleEl) topbarRoleEl.textContent = role;
          if (avatarEl) avatarEl.textContent = initials;
          if (topbarAvatarEl) topbarAvatarEl.textContent = initials;
          if (greetEl)  greetEl.textContent  = `${timeGreeting}, ${displayName.split(" ")[0]}! 👋`;

          // If on a protected page, check permissions
          protectRoute(role, currentPath);
          if (loader) loader.style.display = "none";
        }
      } catch (error) {
        console.error("Auth Guard Error:", error);
        // Only clear localStorage if this is a genuine "no role" error,
        // not a transient Firestore permission/network error on a fresh doc.
        if (error.message === "User role not found.") {
          localStorage.removeItem("userRole");
          localStorage.removeItem("userId");
        }
        if (!isPublicPage) {
          window.location.href = "/unauthorized.html";
        } else if (loader) {
          loader.style.display = "none";
        }
      }
    } else {
      // User is NOT logged in
      localStorage.removeItem("userRole");
      localStorage.removeItem("userId");
      
      if (localStorage.getItem("forceUnauthorized") === "true") {
        localStorage.removeItem("forceUnauthorized");
        window.location.href = "/unauthorized.html";
        return;
      }

      if (!isPublicPage) {
        // Redirect to login if on a protected page
        if (currentPath.startsWith("/student/")) {
          window.location.href = "/student-login.html";
        } else {
          window.location.href = "/login.html";
        }
      } else {
        if (loader) loader.style.display = "none";
      }
    }
  });
};
