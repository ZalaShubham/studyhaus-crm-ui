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
    <!-- Seat Action Modal -->
    <div id="seat-action-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:50; align-items:center; justify-content:center;">
      <div class="card" style="background:var(--bg-card, #fff); padding:2rem; border-radius:12px; width:100%; max-width:400px; box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
          <h3 id="seat-modal-title" style="font-size:18px; font-weight:600; color:var(--text-primary, #0f172a);">Seat Action</h3>
          <button id="btn-close-seat-modal" style="background:transparent; border:none; font-size:18px; cursor:pointer;">&times;</button>
        </div>
        
        <div id="seat-modal-options" style="display:flex; flex-direction:column; gap:0.75rem;">
          <!-- Action buttons injected here -->
        </div>

        <div id="seat-modal-assign-form" style="display:none; flex-direction:column; gap:1rem;">
          <p style="font-size:13px; color:var(--text-secondary, #475569);">Enter Name, Email, or Student ID to assign:</p>
          <input type="text" id="seat-assign-input" placeholder="Search student..." style="width:100%; padding:8px 12px; border:1px solid var(--border, #e2e8f0); border-radius:6px;">
          <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:0.5rem;">
            <button id="btn-cancel-assign" class="btn btn-ghost" style="padding:8px 16px; border:1px solid var(--border, #e2e8f0); border-radius:999px; background:transparent;">Cancel</button>
            <button id="btn-confirm-assign" class="btn btn-primary" style="padding:8px 16px; border:none; border-radius:999px; background:#0f172a; color:#fff;">Assign</button>
          </div>
        </div>
      </div>
    </div>

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
    </div>

    <!-- Main Floor Card -->
    <div class="card" style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:1.5rem; margin-bottom:2rem;">
      <h3 style="font-size:15px; font-weight:600; color:#0f172a; margin-bottom:4px;" id="current-floor-title">Ground Floor</h3>
      <p style="font-size:13px; color:#94a3b8; margin-bottom:1.5rem;">Section A · Section B · click a seat for details</p>
      
      <div id="seat-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(85px, 1fr)); gap: 1rem;">
        <div style="text-align:center; grid-column: 1 / -1; padding: 2rem; color: #94a3b8;">Loading live seat map...</div>
      </div>
    </div>
  `;

  if (!document.getElementById("add-seat-modal")) {
    const modalDiv = document.createElement("div");
    modalDiv.innerHTML = `
      <dialog id="add-seat-modal" class="card" style="border:none; border-radius:12px; padding:0; box-shadow:0 10px 30px rgba(0,0,0,0.5); background: var(--bg-card, #fff); color: var(--text-primary, #0f172a);">
        <div style="padding: 1.5rem; min-width: 400px; max-width: 500px; max-height: 85vh; overflow-y: auto;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h2 style="margin: 0;">Add New Seat</h2>
            <button class="btn btn-ghost" onclick="document.getElementById('add-seat-modal').close()" style="padding: 0.25rem 0.5rem; background: transparent; border: none; font-size: 18px; cursor: pointer;">✕</button>
          </div>
          <form id="add-seat-form" onsubmit="event.preventDefault(); window.submitAddSeatForm()">
            <div class="form-group" style="margin-bottom: 1.5rem;">
              <label style="display:block; margin-bottom:0.25rem; font-size:0.875rem; font-weight:600; color:var(--text-secondary);">Seat Number</label>
              <input type="text" id="add-seat-number" required placeholder="e.g. B01" class="input-field" style="width: 100%; box-sizing: border-box; padding: 0.5rem; border:1px solid var(--border, #e2e8f0); border-radius:6px;" />
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
              <button type="button" class="btn btn-ghost" onclick="document.getElementById('add-seat-modal').close()" style="padding:8px 16px; border:1px solid var(--border, #e2e8f0); border-radius:999px; background:transparent;">Cancel</button>
              <button type="submit" class="btn btn-primary" id="btn-save-seat" style="padding:8px 16px; border:none; border-radius:999px; background:#0f172a; color:#fff;">Save Seat</button>
            </div>
          </form>
        </div>
      </dialog>
    `;
    document.body.appendChild(modalDiv.firstElementChild);
  }

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
    document.getElementById("btn-add-seat").addEventListener("click", () => {
      document.getElementById("add-seat-number").value = "";
      document.getElementById("add-seat-modal").showModal();
    });
  }

  window.submitAddSeatForm = async () => {
    const seatNumber = document.getElementById("add-seat-number").value;
    if (!seatNumber || seatNumber.trim() === "") return;
    
    const btn = document.getElementById("btn-save-seat");
    const originalText = btn.innerText;
    btn.innerText = "Saving...";
    btn.disabled = true;

    const res = await addSingleSeat(seatNumber.trim().toUpperCase(), currentFilters.floor);
    
    btn.innerText = originalText;
    btn.disabled = false;

    if (res.success) {
      document.getElementById("add-seat-modal").close();
      if(typeof showToast === 'function') showToast("Seat added successfully to " + currentFilters.floor + "!");
    } else {
      window.showToast("Failed to add seat: " + res.error, "error");
    }
  };

  
  let currentSelectedSeat = null;
  const seatModal = document.getElementById("seat-action-modal");
  const modalTitle = document.getElementById("seat-modal-title");
  const optionsDiv = document.getElementById("seat-modal-options");
  const assignForm = document.getElementById("seat-modal-assign-form");
  const assignInput = document.getElementById("seat-assign-input");

  if (document.getElementById("btn-close-seat-modal")) {
    document.getElementById("btn-close-seat-modal").addEventListener("click", () => {
      seatModal.style.display = "none";
    });
  }

  if (document.getElementById("btn-cancel-assign")) {
    document.getElementById("btn-cancel-assign").addEventListener("click", () => {
      assignForm.style.display = "none";
      optionsDiv.style.display = "flex";
    });
  }

  if (document.getElementById("btn-confirm-assign")) {
    document.getElementById("btn-confirm-assign").addEventListener("click", async () => {
      const val = assignInput.value.trim();
      if (!val) return;
      seatModal.style.display = "none";
      await triggerAssignSeat(currentSelectedSeat, val);
    });
  }

  // Global Actions
  window.handleSeatClick = (seatId) => {
    const role = localStorage.getItem("userRole");
    if (role === "Employee") {
      return window.showToast("You only have View permissions for seats.", "warning");
    }
    
    const seat = allSeats.find(s => s.id === seatId);
    if (!seat) return;
    currentSelectedSeat = seat;

    modalTitle.innerText = `Seat ${seat.seatNumber} (${seat.status})`;
    optionsDiv.innerHTML = "";
    optionsDiv.style.display = "flex";
    assignForm.style.display = "none";
    assignInput.value = "";

    const createBtn = (text, onClick) => {
      const btn = document.createElement("button");
      btn.innerText = text;
      btn.style.padding = "10px";
      btn.style.borderRadius = "8px";
      btn.style.border = "1px solid #e2e8f0";
      btn.style.background = "#f8fafc";
      btn.style.cursor = "pointer";
      btn.style.fontWeight = "500";
      btn.style.textAlign = "left";
      btn.style.color = "#0f172a";
      btn.onmouseover = () => btn.style.background = "#f1f5f9";
      btn.onmouseout = () => btn.style.background = "#f8fafc";
      btn.onclick = () => {
        if (onClick) onClick();
      };
      return btn;
    };

    const handleAction = async (choice) => {
      seatModal.style.display = "none";
      await processSeatAction(seat, choice);
    };

    if (seat.status === "Available") {
      optionsDiv.appendChild(createBtn("Assign Student", () => {
        optionsDiv.style.display = "none";
        assignForm.style.display = "flex";
        assignInput.focus();
      }));
      optionsDiv.appendChild(createBtn("Mark Maintenance", () => handleAction("2")));
      optionsDiv.appendChild(createBtn("Mark Inactive", () => handleAction("3")));
    } else if (seat.status === "Reserved") {
      optionsDiv.appendChild(createBtn("Unassign Student", () => handleAction("1")));
      optionsDiv.appendChild(createBtn("Mark Maintenance", () => handleAction("2")));
      optionsDiv.appendChild(createBtn("Mark Inactive", () => handleAction("3")));
    } else if (seat.status === "Maintenance" || seat.status === "Inactive") {
      optionsDiv.appendChild(createBtn("Mark Available", () => handleAction("1")));
    } else if (seat.status === "Occupied") {
      const p = document.createElement("p");
      p.innerText = "Occupied seats cannot be modified directly until the student checks out.";
      p.style.fontSize = "13px";
      p.style.color = "#475569";
      optionsDiv.appendChild(p);
    }

    seatModal.style.display = "flex";
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
    window.showToast("Cannot modify an occupied seat.", "error");
    return;
  }

  if (seat.status === "Available") {
    // choice === "1" is handled directly by modal assign action now
    if (choice === "2") return await changeSeatStatus(seat.id, "Maintenance");
    if (choice === "3") return await changeSeatStatus(seat.id, "Inactive");
  }

  if (seat.status === "Reserved") {
    if (choice === "1") {
      const confirmed = await window.showCustomConfirm("Unassign Seat", `Unassign ${seat.assignedStudentName} from this seat?`);
      if (confirmed) {
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
  
  window.showToast("Invalid option or action not allowed.", "error");
};

const triggerAssignSeat = async (seat, studentEmailOrId) => {
  if (!studentEmailOrId) return;

  try {
    const q1 = query(collection(db, "students"), where("email", "==", studentEmailOrId));
    const q2 = query(collection(db, "students"), where("studentId", "==", studentEmailOrId));
    const q3 = query(collection(db, "students"), where("name", "==", studentEmailOrId));
    
    let studentSnap = await getDocs(q1);
    if (studentSnap.empty) studentSnap = await getDocs(q2);
    if (studentSnap.empty) studentSnap = await getDocs(q3);

    if (studentSnap.empty) {
      return window.showToast("Student not found.", "error");
    }

    const studentDoc = studentSnap.docs[0];
    const studentData = { id: studentDoc.id, ...studentDoc.data() };
    
    if (studentData.status !== "Active") return window.showToast("Cannot assign seat to inactive student.", "warning");
    if (studentData.seatNumber) return window.showToast(`Student already has a seat assigned: ${studentData.seatNumber}`, "warning");

    const res = await assignSeat(seat.id, studentData);
    if (!res.success) window.showToast("Failed to assign seat: " + res.error, "error");
    else window.showToast(`Successfully assigned ${studentData.name} to ${seat.seatNumber}`, "success");

  } catch (err) {
    window.showToast("Error finding student: " + err.message, "error");
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

  window.quickCreateSeat = async (seatNumber, floor) => {
    const res = await addSingleSeat(String(seatNumber), floor);
    if (res.success) {
      if(typeof showToast === 'function') showToast(`Seat ${seatNumber} created!`, 'success');
    } else {
      if(typeof showToast === 'function') showToast(`Error: ${res.error}`, 'error');
    }
  };

  const renderSeatMap = () => {
    const grid = document.getElementById("seat-grid");
    if (!grid) return;

    let filtered = allSeats.filter(seat => {
      const seatFloor = seat.floor || "Ground Floor";
      return seatFloor === currentFilters.floor;
    });

    const generateRange = (prefix, start, end) => {
      const arr = [];
      if (start <= end) {
        for (let i = start; i <= end; i++) arr.push(`${prefix}${i}`);
      } else {
        for (let i = start; i >= end; i--) arr.push(`${prefix}${i}`);
      }
      return arr;
    };

    const renderSeatCard = (seatNumStr) => {
      let seat = filtered.find(s => s.seatNumber === String(seatNumStr));
      
      if (!seat) {
        return `
          <div class="seat-card empty-seat" 
               onclick="window.quickCreateSeat('${seatNumStr}', '${currentFilters.floor}')"
               style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; height: 50px; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 14px; cursor: pointer; transition: 0.2s;"
               onmouseover="this.style.background='#f1f5f9';"
               onmouseout="this.style.background='#f8fafc';"
               title="Click to create seat ${seatNumStr} in database"
               >
            ${seatNumStr}
          </div>
        `;
      }

      let bg = "#f8fafc", border = "1px solid #e2e8f0", text = "#0f172a";
      if (seat.status === "Available") { bg = "#f0fdf4"; border = "1px solid #bbf7d0"; text = "#166534"; }
      else if (seat.status === "Occupied") { bg = "#fef2f2"; border = "1px solid #fecaca"; text = "#991b1b"; }
      else if (seat.status === "Reserved") { bg = "#fffbeb"; border = "1px solid #fde68a"; text = "#92400e"; }
      else if (seat.status === "Maintenance") { bg = "#eff6ff"; border = "1px solid #bfdbfe"; text = "#1e40af"; }
      else if (seat.status === "Inactive") { bg = "#f1f5f9"; border = "1px dashed #cbd5e1"; text = "#94a3b8"; }

      return `
        <div 
          class="seat-card"
          onclick="window.handleSeatClick('${seat.id}')"
          style="
            background: ${bg}; border: ${border}; color: ${text}; 
            border-radius: 8px; height: 50px; display: flex; 
            align-items: center; justify-content: center;
            cursor: pointer; transition: 0.2s;
          "
          onmouseover="this.style.transform='translateY(-2px)';"
          onmouseout="this.style.transform='none';"
        >
          <div style="font-size: 14px; font-weight: 600;">${seat.seatNumber}</div>
        </div>
      `;
    };

    const renderColHtml = (arr) => {
      let colHtml = `<div style="display: flex; flex-direction: column; gap: 0.5rem; flex: 1;">`;
      arr.forEach(num => { colHtml += renderSeatCard(num); });
      colHtml += `</div>`;
      return colHtml;
    };

    let html = "";

    if (currentFilters.floor === "First Floor") {
      html = `
        <div style="background: #fff; padding: 3rem 2rem 3rem 2rem; border-radius: 12px; position: relative; border: 1px solid #e2e8f0;">
          <!-- Door -->
          <div style="position: absolute; top: 0; left: 50%; transform: translateX(-50%); background: #f1f5f9; border: 1px solid #e2e8f0; border-top: none; padding: 0.5rem 2.5rem; border-radius: 0 0 12px 12px; font-weight: 700; color: #475569; letter-spacing: 2px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            DOOR
          </div>
          
          <div style="display: flex; gap: 1.5rem; justify-content: center; max-width: 800px; margin: 0 auto;">
            ${renderColHtml(generateRange('B', 1, 10))}
            ${renderColHtml(generateRange('B', 20, 11))}
            
            <!-- Middle aisle -->
            <div style="width: 40px; flex-shrink: 0;"></div>

            ${renderColHtml(generateRange('B', 21, 30))}
            ${renderColHtml(generateRange('B', 40, 31))}
          </div>

          <!-- Toilets -->
          <div style="position: absolute; bottom: 0; left: 0; right: 0; display: flex; justify-content: space-around; pointer-events: none;">
            <div style="background: #f1f5f9; border: 1px solid #e2e8f0; border-bottom: none; padding: 0.5rem 2.5rem; border-radius: 12px 12px 0 0; font-weight: 700; color: #475569; letter-spacing: 2px; box-shadow: 0 -4px 6px -1px rgba(0,0,0,0.05);">
              TOILET
            </div>
            <div style="background: #f1f5f9; border: 1px solid #e2e8f0; border-bottom: none; padding: 0.5rem 2.5rem; border-radius: 12px 12px 0 0; font-weight: 700; color: #475569; letter-spacing: 2px; box-shadow: 0 -4px 6px -1px rgba(0,0,0,0.05);">
              TOILET
            </div>
          </div>
        </div>
      `;
    } else if (currentFilters.floor === "Ground Floor") {
      html = `
        <div style="background: #fff; padding: 3rem 2rem 2rem 2rem; border-radius: 12px; position: relative; border: 1px solid #e2e8f0;">
          <!-- Door -->
          <div style="position: absolute; top: 0; left: 50%; transform: translateX(-50%); background: #f1f5f9; border: 1px solid #e2e8f0; border-top: none; padding: 0.5rem 2.5rem; border-radius: 0 0 12px 12px; font-weight: 700; color: #475569; letter-spacing: 2px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            DOOR
          </div>
          
          <div style="display: flex; gap: 1.5rem; justify-content: center; max-width: 900px; margin: 0 auto; align-items: flex-start;">
            ${renderColHtml(generateRange('A', 1, 17))}
            ${renderColHtml(generateRange('A', 34, 18))}
            
            <!-- Middle section with seats 63 to 68 -->
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; width: 80px; flex-shrink: 0; align-self: center;">
               ${renderSeatCard('A63')}
               ${renderSeatCard('A64')}
               ${renderSeatCard('A65')}
               ${renderSeatCard('A66')}
               ${renderSeatCard('A67')}
               ${renderSeatCard('A68')}
            </div>

            ${renderColHtml(generateRange('A', 35, 48))}
            ${renderColHtml(generateRange('A', 62, 49))}
          </div>
        </div>
      `;
    } else {
      // Fallback for other custom floors
      grid.style.display = "grid";
      grid.style.gridTemplateColumns = "repeat(auto-fill, minmax(85px, 1fr))";
      grid.style.gap = "1rem";
      
      let fallbackHtml = "";
      filtered.forEach(seat => {
        fallbackHtml += renderSeatCard(seat.seatNumber);
      });
      html = fallbackHtml;
      
      grid.innerHTML = html;
      return;
    }

    // Unset grid style for custom physical layout containers
    grid.style.display = "block";
    grid.innerHTML = html;
  };

