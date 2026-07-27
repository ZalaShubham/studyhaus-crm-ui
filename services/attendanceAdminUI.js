import { listenToAllAttendance } from "./attendanceService.js";
import { calculateStudyHours } from "./studyHourCalculator.js";

let allRecords = [];
let unsubscribe = null;
let currentFilters = { status: "All", search: "" };

export const initAttendanceAdminUI = () => {
  const container = document.getElementById("page-attendance");
  if (!container) return; // Means we are not on the correct DOM or it's missing

  const role = localStorage.getItem("userRole");
  if (role === "Student") return; // Security guard

  // Initial UI Setup
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1>Attendance Log</h1>
        <p class="page-subtitle" id="attendance-subtitle">Loading records...</p>
      </div>
    </div>
    
    <div class="card">
      <div class="toolbar">
        <div class="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="attendance-search" placeholder="Search by student name or seat..." />
        </div>
        <div class="filter-tabs">
          <button class="filter-tab att-filter active" data-val="All">All</button>
          <button class="filter-tab att-filter" data-val="Active">Active Now</button>
          <button class="filter-tab att-filter" data-val="Completed">Completed</button>
        </div>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Student</th>
            <th>Seat</th>
            <th>Check In</th>
            <th>Check Out</th>
            <th>Duration</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody id="attendance-table-body">
          <tr><td colspan="7" style="text-align:center;">Loading...</td></tr>
        </tbody>
      </table>
    </div>
  `;

  // Attach event listeners for filtering
  document.getElementById("attendance-search").addEventListener("input", (e) => {
    currentFilters.search = e.target.value.toLowerCase();
    renderAdminTable();
  });

  document.querySelectorAll(".att-filter").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".att-filter").forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      currentFilters.status = e.target.getAttribute("data-val");
      renderAdminTable();
    });
  });

  // Start Listener
  if (unsubscribe) unsubscribe();
  unsubscribe = listenToAllAttendance((records) => {
    allRecords = records;
    renderAdminTable();
  });
};

const renderAdminTable = () => {
  const tbody = document.getElementById("attendance-table-body");
  const subtitle = document.getElementById("attendance-subtitle");
  if (!tbody) return;

  // Filter Data
  let filtered = allRecords;

  if (currentFilters.status !== "All") {
    filtered = filtered.filter(r => r.status === currentFilters.status);
  }

  if (currentFilters.search.trim() !== "") {
    filtered = filtered.filter(r => {
      const name = (r.studentName || "").toLowerCase();
      const seat = (r.seatNumber || "").toLowerCase();
      return name.includes(currentFilters.search) || seat.includes(currentFilters.search);
    });
  }

  // Update Counters
  const activeCount = allRecords.filter(r => r.status === "Active").length;
  subtitle.innerHTML = `${allRecords.length} total records · ${activeCount} active sessions right now`;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--text-muted);">No records found.</td></tr>`;
    return;
  }

  let html = "";
  filtered.forEach(r => {
    const cIn = new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const cOut = r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Active";
    const statusBadge = r.status === "Active" ? `<span class="badge badge-pending">Active</span>` : `<span class="badge badge-paid">Completed</span>`;
    
    html += `
      <tr>
        <td>${r.date}</td>
        <td>
          <div style="font-weight: 500;">${r.studentName || "Unknown"}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${r.planName || "No Plan"}</div>
        </td>
        <td>${r.seatNumber || "-"}</td>
        <td>${cIn}</td>
        <td>${cOut}</td>
        <td>${r.duration > 0 ? r.duration + 'h' : '-'}</td>
        <td>${statusBadge}</td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
};
