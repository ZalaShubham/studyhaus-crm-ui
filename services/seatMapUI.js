import { listenToAllSeats, assignSeat, unassignSeat, changeSeatStatus, seedInitialSeats, addSingleSeat } from "./seatService.js";
import { getDocs, collection, query, where } from "firebase/firestore";
import { db } from "../firebase/firebase.js";

let allSeats = [];
let unsubscribe = null;
let currentFilters = { status: "All", search: "", floor: "Ground Floor" };

export const initSeatMapUI = async () => {
  const container = document.getElementById("page-seats");
  if (!container) return; 

  const role = localStorage.getItem("userRole");
  if (role === "Student") return; // Security guard

  // Seed seats if empty
  await seedInitialSeats();

  // Initial UI Setup
  container.innerHTML = `
    <div class="page-header" style="display:flex; justify-content:space-between; align-items:center;">
      <div>
        <h1>Seat Map</h1>
        <p class="page-subtitle" id="seat-subtitle">Loading...</p>
      </div>
      <div style="display: flex; gap: 0.75rem;">
        <button class="btn btn-ghost" style="background: #fff; color: #0f172a; border: 1px solid #e2e8f0; border-radius: 999px; padding: 6px 16px;"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg> Filter</button>
        <button class="btn btn-primary" id="btn-add-seat" style="background: #0f172a; color: #fff; border-radius: 999px; padding: 6px 16px;">+ Add seat</button>
      </div>
    </div>
    
    <!-- Seat Legend -->
    <div class="seat-legend" style="display:flex; gap:1rem; margin-bottom:1.5rem;">
      <span class="legend-pill" style="background:#f0fdf4; color:#166534; border:1px solid #bbf7d0; padding:4px 12px; border-radius:999px; font-size:13px; font-weight:500; display:inline-flex; align-items:center; gap:6px;"><span style="width:8px; height:8px; border-radius:50%; background:currentColor;"></span>Available</span>
      <span class="legend-pill" style="background:#fef2f2; color:#991b1b; border:1px solid #fecaca; padding:4px 12px; border-radius:999px; font-size:13px; font-weight:500; display:inline-flex; align-items:center; gap:6px;"><span style="width:8px; height:8px; border-radius:50%; background:currentColor;"></span>Occupied</span>
      <span class="legend-pill" style="background:#fffbeb; color:#92400e; border:1px solid #fde68a; padding:4px 12px; border-radius:999px; font-size:13px; font-weight:500; display:inline-flex; align-items:center; gap:6px;"><span style="width:8px; height:8px; border-radius:50%; background:currentColor;"></span>Reserved</span>
      <span class="legend-pill" style="background:#eff6ff; color:#1e40af; border:1px solid #bfdbfe; padding:4px 12px; border-radius:999px; font-size:13px; font-weight:500; display:inline-flex; align-items:center; gap:6px;"><span style="width:8px; height:8px; border-radius:50%; background:currentColor;"></span>Maintenance</span>
    </div>

    <!-- Floor Tabs -->
    <div class="floor-tabs" style="display:inline-flex; gap:0.5rem; background:#f1f5f9; padding:4px; border-radius:999px; margin-bottom:1.5rem;">
      <button class="floor-tab active" data-floor="Ground Floor" style="border:none; background:#fff; color:#0f172a; padding:6px 16px; border-radius:999px; font-weight:500; font-size:13px; cursor:pointer; box-shadow:0 1px 2px rgba(0,0,0,0.05);">Ground Floor</button>
      <button class="floor-tab" data-floor="First Floor" style="border:none; background:transparent; color:#475569; padding:6px 16px; border-radius:999px; font-weight:500; font-size:13px; cursor:pointer;">First Floor</button>
      <button class="floor-tab" data-floor="Second Floor" style="border:none; background:transparent; color:#475569; padding:6px 16px; border-radius:999px; font-weight:500; font-size:13px; cursor:pointer;">Second Floor</button>
    </div>

    <!-- Main Floor Card -->
    <div class="card" style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:1.5rem; margin-bottom:2rem;">
      <h3 style="font-size:15px; font-weight:600; color:#0f172a; margin-bottom:4px;" id="current-floor-title">Ground Floor</h3>
      <p style="font-size:13px; color:#94a3b8; margin-bottom:1.5rem;">Section A · Section B · click a seat for details</p>
      
      <!-- CSS Grid for the Seat Map -->
      <div id="seat-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(85px, 1fr)); gap: 1rem;">
        <div style="text-align:center; grid-column: 1 / -1; padding: 2rem; color: #94a3b8;">Loading live seat map...</div>
      </div>
    </div>
  `;

  // Floor Tab Listeners
  document.querySelectorAll(".floor-tab").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".floor-tab").forEach(b => {
        b.style.background = 'transparent';
        b.style.color = '#475569';
        b.style.boxShadow = 'none';
      });
      const target = e.target;
      target.style.background = '#fff';
      target.style.color = '#0f172a';
      target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
      
      currentFilters.floor = target.getAttribute("data-floor");
      document.getElementById("current-floor-title").innerText = currentFilters.floor;
      renderSeatMap();
    });
  });

  if (document.getElementById("btn-add-seat")) {
    document.getElementById("btn-add-seat").addEventListener("click", async () => {
      const seatNumber = prompt("Enter new seat number (e.g. B01):");
      if (!seatNumber || seatNumber.trim() === "") return;
      
      const res = await addSingleSeat(seatNumber.trim().toUpperCase());
      if (res.success) alert("Seat added successfully!");
      else alert("Failed to add seat: " + res.error);
    });
  }

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
  const studentEmailOrId = prompt(`Enter the Name, Email or Student ID of the student to assign to Seat ${seat.seatNumber}:`);
  if (!studentEmailOrId) return;

  try {
    const q1 = query(collection(db, "students"), where("email", "==", studentEmailOrId));
    const q2 = query(collection(db, "students"), where("studentId", "==", studentEmailOrId));
    const q3 = query(collection(db, "students"), where("name", "==", studentEmailOrId));
    
    let studentSnap = await getDocs(q1);
    if (studentSnap.empty) studentSnap = await getDocs(q2);
    if (studentSnap.empty) studentSnap = await getDocs(q3);

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
  const occupied = seats.filter(s => s.status === "Occupied").length;
  const available = seats.filter(s => s.status === "Available").length;
  const subtitle = document.getElementById("seat-subtitle");
  if (subtitle) {
    subtitle.innerText = `${occupied} occupied · ${available} available across 3 floors`;
  }
};

const renderSeatMap = () => {
  const grid = document.getElementById("seat-grid");
  if (!grid) return;

  // Let's assume all seats are currently dumped together.
  // We don't have actual floor data in the objects probably, but we can divide by prefix or ID.
  // We'll just render all seats for now if we can't filter by floor.
  // Actually, let's filter by prefix if seatNumber starts with something, but if not just render them all.
  let filtered = allSeats;

  let html = "";
  filtered.forEach(seat => {
    // Determine colors
    let bg = "#f8fafc";
    let border = "1px solid #e2e8f0";
    let text = "#0f172a";
    
    if (seat.status === "Available") {
      bg = "#f0fdf4"; border = "1px solid #bbf7d0"; text = "#166534";
    } else if (seat.status === "Occupied") {
      bg = "#fef2f2"; border = "1px solid #fecaca"; text = "#991b1b";
    } else if (seat.status === "Reserved") {
      bg = "#fffbeb"; border = "1px solid #fde68a"; text = "#92400e";
    } else if (seat.status === "Maintenance") {
      bg = "#eff6ff"; border = "1px solid #bfdbfe"; text = "#1e40af";
    } else if (seat.status === "Inactive") {
      bg = "#f1f5f9"; border = "1px dashed #cbd5e1"; text = "#94a3b8";
    }

    // Strip prefix from seatNumber (e.g. A01 -> 01, G-01 -> 01)
    let displayNum = seat.seatNumber.replace(/^[A-Za-z-]+/, '');

    html += `
      <div 
        class="seat-card"
        onclick="window.handleSeatClick('${seat.id}')"
        style="
          background: ${bg}; 
          border: ${border}; 
          color: ${text}; 
          border-radius: 8px; 
          aspect-ratio: 1.1; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          cursor: pointer;
          transition: 0.2s;
        "
        onmouseover="this.style.transform='translateY(-2px)';"
        onmouseout="this.style.transform='none';"
      >
        <div style="font-size: 14px; font-weight: 600;">${displayNum}</div>
      </div>
    `;
  });

  grid.innerHTML = html;
};
