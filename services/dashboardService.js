import { listenToEarnings, listenToPendingPayments } from "./paymentService.js";
import { listenToDashboardExpenses } from "./expenseService.js";
import { listenToVisitors } from "./visitorService.js";
import { calculateVisitorAnalytics } from "./visitorAnalytics.js";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebase.js";

/**
 * Format currency in INR
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Update UI Helper
 */
const updateElement = (id, value) => {
  const el = document.getElementById(id);
  if (el) {
    el.innerHTML = value;
  }
};

/**
 * Initialize all dashboard real-time listeners
 */
export const initDashboardListeners = () => {
  // Only init if we're on a page with dashboard metrics
  if (!document.getElementById("metric-earnings-today")) return;

  console.log("Initializing live dashboard listeners...");

  // 1. Listen to Earnings (Today & Monthly)
  listenToEarnings((data) => {
    updateElement("metric-earnings-today", formatCurrency(data.todayEarnings));
    updateElement("metric-earnings-monthly", formatCurrency(data.monthlyEarnings));
  }, (err) => console.error("Earnings listener error:", err));

  // 2. Listen to Expenses (Today)
  listenToDashboardExpenses((data) => {
    updateElement("metric-expenses-today", formatCurrency(data.todayExpenses));
  }, (err) => console.error("Expenses listener error:", err));

  // 3. Listen to Visitors (Today)
  listenToVisitors((data) => {
    const stats = calculateVisitorAnalytics(data);
    updateElement("metric-visitors-today", stats.todayCount);
  }, (err) => console.error("Visitors listener error:", err));

  // 4. Listen to Students (Active & Old) and Occupancy
  const studentsQuery = query(collection(db, "students"));
  onSnapshot(studentsQuery, (snapshot) => {
    let activeStudents = 0;
    let oldStudents = 0;
    let occupiedSeats = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.status === "Active" || data.status === "Pending") activeStudents++;
      if (data.status === "Old") oldStudents++;
      if (data.seatNumber && data.status !== "Old") occupiedSeats++;
    });

    const totalSeats = snapshot.size; // Dynamic count from Firestore
    const occupancyPercentage = Math.round((occupiedSeats / totalSeats) * 100);

    updateElement("metric-active-students", `${activeStudents} <span style="font-size: 0.9rem; font-weight: normal; color: var(--text-muted); display: block; margin-top: 0.2rem;">${oldStudents} Old Students</span>`);
    updateElement("metric-occupancy-percent", `${occupancyPercentage}%`);
    updateElement("metric-occupancy-fraction", `${occupiedSeats} / ${totalSeats} seats taken`);
  }, (err) => console.error("Students listener error:", err));

  // 4. Listen to Pending Payments Panel (Only update the metric tile now)
  listenToPendingPayments((data) => {
    // Update footer total
    updateElement("pending-total-today", formatCurrency(data.totalPendingToday));
  }, (err) => console.error("Pending payments listener error:", err));

  // Note: Upcoming Renewals feed is now handled by dashboardReminderUI.js

};
