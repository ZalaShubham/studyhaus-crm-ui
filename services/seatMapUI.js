import { listenToAllSeats, assignSeat, unassignSeat, changeSeatStatus, seedInitialSeats } from "./seatService.js";
import { getDocs, collection, query, where } from "firebase/firestore";
import { db } from "../firebase/firebase.js";

let allSeats = [];
let unsubscribe = null;
let currentFilters = { status: "All", search: "" };

export const initSeatMapUI = async () => {
  const container = document.getElementById("page-seats");
  if (!container) return; 

  const role = localStorage.getItem("userRole");
  if (role === "Student") return; // Security guard

  // Seed seats if empty
  await seedInitialSeats();

  // Initial UI Setup
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1>Seat Management</h1>
        <p class="page-subtitle">Live map and seat analysis dashboard</p>
      </div>
    </div>
    
    <!-- Seat Analysis Dashboard -->
    <div class="metrics-grid" id="seat-metrics">
      <div class="metric-card"><div class="metric-label">Total Seats</div><div class="metric-value" id="metric-total">0</div></div>
      <div class="metric-card"><div class="metric-label">Available</div><div class="metric-value" style="color:var(--success);" id="metric-available">0</div></div>
      <div class="metric-card"><div class="metric-label">Occupied</div><div class="metric-value" style="color:var(--primary);" id="metric-occupied">0</div></div>
      <div class="metric-card"><div class="metric-label">Reserved</div><div class="metric-value" style="color:var(--warning);" id="metric-reserved">0</div></div>
      <div class="metric-card"><div class="metric-label">Maintenance</div><div class="metric-value" style="color:var(--danger);" id="metric-maintenance">0</div></div>
    </div>

    <!-- Seat Map & Tools -->
    <div class="card" style="margin-top: 2rem;">
      <div class="toolbar" style="flex-wrap:wrap; gap:1rem;">
        <div class="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="seat-search" placeholder="Search Seat or Student..." />
        </div>
        
        <div class="filter-tabs" style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <button class="filter-tab seat-filter active" data-val="All">All</button>
          <button class="filter-tab seat-filter" data-val="Available">Available</button>
          <button class="filter-tab seat-filter" data-val="Occupied">Occupied</button>
          <button class="filter-tab seat-filter" data-val="Reserved">Reserved</button>
          <button class="filter-tab seat-filter" data-val="Maintenance">Maintenance</button>
          <button class="filter-tab seat-filter" data-val="Inactive">Inactive</button>
        </div>
      </div>
      
      <!-- CSS Grid for the Seat Map -->
      <div id="seat-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 1rem; margin-top: 1.5rem;">
        <div style="text-align:center; grid-column: 1 / -1; padding: 2rem; color: var(--text-muted);">Loading live seat map...</div>
      </div>
    </div>
  `;

  // Filter Listeners
  document.getElementById("seat-search").addEventListener("input", (e) => {
    currentFilters.search = e.target.value.toLowerCase();
    renderSeatMap();
  });

  document.querySelectorAll(".seat-filter").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".seat-filter").forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      currentFilters.status = e.target.getAttribute("data-val");
      renderSeatMap();
    });
  });

  // Global Actions
  window.handleSeatClick = (seatId) => {
    const role = localStorage.getItem("userRole");
    if (role === "Employee") {
      return alert("You only have View permissions for seats.");
    }
    
    const seat = allSeats.find(s => s.id === seatId);
    if (!seat) return;

    // Build options based on current status
    let options = "";
    if (seat.status === "Available") {
      options = `1. Assign Student\n2. Mark Maintenance\n3. Mark Inactive`;
    } else if (seat.status === "Reserved") {
      options = `1. Unassign Student\n2. Mark Maintenance\n3. Mark Inactive`;
    } else if (seat.status === "Maintenance" || seat.status === "Inactive") {
      options = `1. Mark Available`;
    } else if (seat.status === "Occupied") {
      options = `Occupied seats cannot be modified directly until the student checks out.`;
    }

    const choice = prompt(`Seat ${seat.seatNumber} (${seat.status})\n\nOptions:\n${options}\n\nEnter option number:`);
    if (!choice) return;

    processSeatAction(seat, choice.trim());
  };

  // Start Listener
  if (unsubscribe) unsubscribe();
  unsubscribe = listenToAllSeats((records) => {
    allSeats = records;
    updateSeatAnalysis(allSeats);
    renderSeatMap();
  });
};

const processSeatAction = async (seat, choice) => {
  if (seat.status === "Occupied") {
    alert("Cannot modify an occupied seat.");
    return;
  }

  if (seat.status === "Available") {
    if (choice === "1") return await triggerAssignSeat(seat);
    if (choice === "2") return await changeSeatStatus(seat.id, "Maintenance");
    if (choice === "3") return await changeSeatStatus(seat.id, "Inactive");
  }

  if (seat.status === "Reserved") {
    if (choice === "1") {
      if (confirm(`Unassign ${seat.assignedStudentName} from this seat?`)) {
        await unassignSeat(seat.id);
      }
      return;
    }
    if (choice === "2") return await changeSeatStatus(seat.id, "Maintenance");
    if (choice === "3") return await changeSeatStatus(seat.id, "Inactive");
  }

  if (seat.status === "Maintenance" || seat.status === "Inactive") {
    if (choice === "1") return await changeSeatStatus(seat.id, "Available");
  }
  
  alert("Invalid option or action not allowed.");
};

const triggerAssignSeat = async (seat) => {
  const studentEmailOrId = prompt(`Enter the Email or Student ID of the student to assign to Seat ${seat.seatNumber}:`);
  if (!studentEmailOrId) return;

  try {
    // Search for student
    const q1 = query(collection(db, "students"), where("email", "==", studentEmailOrId));
    const q2 = query(collection(db, "students"), where("studentId", "==", studentEmailOrId));
    
    let studentSnap = await getDocs(q1);
    if (studentSnap.empty) studentSnap = await getDocs(q2);

    if (studentSnap.empty) {
      return alert("Student not found.");
    }

    const studentDoc = studentSnap.docs[0];
    const studentData = { id: studentDoc.id, ...studentDoc.data() };
    
    if (studentData.status !== "Active") return alert("Cannot assign seat to inactive student.");
    if (studentData.seatNumber) return alert(`Student already has a seat assigned: ${studentData.seatNumber}`);

    const res = await assignSeat(seat.id, studentData);
    if (!res.success) alert("Failed to assign seat: " + res.error);
    else alert(`Successfully assigned ${studentData.name} to ${seat.seatNumber}`);

  } catch (err) {
    alert("Error finding student: " + err.message);
  }
};

const updateSeatAnalysis = (seats) => {
  if (!document.getElementById("metric-total")) return;
  document.getElementById("metric-total").innerText = seats.length;
  document.getElementById("metric-available").innerText = seats.filter(s => s.status === "Available").length;
  document.getElementById("metric-occupied").innerText = seats.filter(s => s.status === "Occupied").length;
  document.getElementById("metric-reserved").innerText = seats.filter(s => s.status === "Reserved").length;
  document.getElementById("metric-maintenance").innerText = seats.filter(s => s.status === "Maintenance").length;
};

const renderSeatMap = () => {
  const grid = document.getElementById("seat-grid");
  if (!grid) return;

  let filtered = allSeats;
  
  if (currentFilters.status !== "All") {
    filtered = filtered.filter(s => s.status === currentFilters.status);
  }

  if (currentFilters.search) {
    const q = currentFilters.search;
    filtered = filtered.filter(s => 
      s.seatNumber.toLowerCase().includes(q) || 
      (s.assignedStudentName && s.assignedStudentName.toLowerCase().includes(q))
    );
  }

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1 / -1; padding: 2rem; text-align:center; color: var(--text-muted);">No seats match your filters.</div>`;
    return;
  }

  let html = "";
  filtered.forEach(seat => {
    // Determine colors
    let bg = "var(--bg-color)";
    let border = "1px solid var(--border)";
    let text = "var(--text-color)";
    
    if (seat.status === "Available") {
      border = "2px solid var(--success)";
    } else if (seat.status === "Occupied") {
      bg = "rgba(79, 70, 229, 0.1)"; // Light primary (blue)
      border = "2px solid var(--primary)";
    } else if (seat.status === "Reserved") {
      bg = "rgba(245, 158, 11, 0.1)"; // Light warning (yellow)
      border = "2px solid var(--warning)";
    } else if (seat.status === "Maintenance") {
      bg = "rgba(239, 68, 68, 0.1)"; // Light danger (red/orange)
      border = "2px dashed var(--danger)";
    } else if (seat.status === "Inactive") {
      bg = "#e5e7eb"; // Gray
      text = "var(--text-muted)";
    }

    const studentInfo = (seat.assignedStudentName) 
      ? `<div style="font-size:0.75rem; margin-top:0.5rem; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${seat.assignedStudentName}">${seat.assignedStudentName.split(" ")[0]}</div>`
      : `<div style="font-size:0.75rem; margin-top:0.5rem; color:transparent;">-</div>`;

    html += `
      <div 
        class="seat-card"
        onclick="window.handleSeatClick('${seat.id}')"
        style="
          background: ${bg}; 
          border: ${border}; 
          color: ${text}; 
          border-radius: 8px; 
          padding: 1rem; 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        "
      >
        <div style="font-size: 1.25rem; font-weight: 700;">${seat.seatNumber}</div>
        <div style="font-size: 0.7rem; opacity: 0.8; margin-top: 0.2rem; text-transform: uppercase; font-weight:600;">${seat.status}</div>
        ${studentInfo}
      </div>
    `;
  });

  grid.innerHTML = html;
};
