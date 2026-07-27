import { testFirebaseConnection } from "./firebase/testConnection.js";
import { initAuthGuard } from "./auth/guard.js";
import { enforceModulePermissions } from "./auth/middleware.js";
import { handleLogout } from "./auth/logout.js";
import { initDashboardListeners } from "./services/dashboardService.js";
import { initMembershipPlans } from "./services/membershipService.js";
import { initAdmissionsUI } from "./services/admissionService.js";
import { initStudentManagementUI } from "./services/studentProfile.js";
import { initStudentPortalUI } from "./services/studentPortalUI.js";
import { initAttendanceAdminUI } from "./services/attendanceAdminUI.js";
import { initPaymentAdminUI } from "./services/paymentAdminUI.js";
import { initComplaintAdminUI } from "./services/complaintAdminUI.js";
import { initSeatMapUI } from "./services/seatMapUI.js";
import { initExpenseAdminUI } from "./services/expenseAdminUI.js";
import { initVisitorAdminUI } from "./services/visitorAdminUI.js";
import { initMessageLogAdminUI } from "./services/messageLogAdminUI.js";
import { initOldStudentAdminUI } from "./services/oldStudentAdminUI.js";
import { initDashboardReminders } from "./services/dashboardReminderUI.js";
import { initRenewalAdminUI, renderRenewalForm, renderRenewalHistory } from "./services/renewalAdminUI.js";
import { openReportViewer, closeReportViewer } from "./services/reportAdminUI.js";
import "./services/whatsappModalUI.js"; // Auto-injects modal styles and functions

// Expose the test function to the global window object
window.runFirebaseTest = testFirebaseConnection;

// Expose logout function globally so it can be called from onclick handlers in the UI
window.logout = handleLogout;

// Expose renewal form logic globally
window.renderRenewalForm = renderRenewalForm;
window.renderRenewalHistory = renderRenewalHistory;

// Expose Report Viewer logic globally
window.openReportViewer = openReportViewer;
window.closeReportViewer = closeReportViewer;

// Initialize Authentication Guard
initAuthGuard();

// When DOM is loaded, enforce module-level permissions and init live dashboard
document.addEventListener("DOMContentLoaded", () => {
  const role = localStorage.getItem("userRole");
  if (role) {
    enforceModulePermissions(role);
    // Initialize real-time dashboard listeners if we're on the dashboard
    initDashboardListeners();
    // Initialize the new unified Dashboard Reminders
    initDashboardReminders();
    // Initialize membership plans live feed
    initMembershipPlans();
    // Initialize admissions flow
    initAdmissionsUI();
    // Initialize student management flow
    initStudentManagementUI();
    // Initialize student portal
    initStudentPortalUI();
    // Initialize attendance admin viewer
    initAttendanceAdminUI();
    // Initialize payment admin viewer
    initPaymentAdminUI();
    // Initialize complaints admin viewer
    initComplaintAdminUI();
    // Initialize Seat Map viewer
    initSeatMapUI();
    // Initialize Expense viewer
    initExpenseAdminUI();
    // Initialize Visitor viewer
    initVisitorAdminUI();
    // Initialize Message Log viewer
    initMessageLogAdminUI();
    // Initialize Old Student viewer
    initOldStudentAdminUI();
    // Initialize Renewal Module
    initRenewalAdminUI();
  }
});

// console.log("Firebase setup complete. Guard active.");
