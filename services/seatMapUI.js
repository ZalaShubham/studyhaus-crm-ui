import { listenToAllSeats, assignSeat, unassignSeat, changeSeatStatus, seedInitialSeats, addSingleSeat } from "./seatService.js";
import { getDocs, collection, query, where } from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import { initLiveSeatMapInTab } from "./liveSeatMapUI.js";

let allSeats = [];
let unsubscribe = null;
let currentFilters = { status: "All", search: "", floor: "Ground Floor" };

export const initSeatMapUI = async (mode, containerId) => {
  // ── SIGNUP / SELF-ADMISSION MODE ─────────────────────────────────────────
  if (mode === "signup" && containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div style="padding: 0.5rem 0 0.75rem;">
        <!-- Floor tabs -->
        <div style="display:inline-flex; gap:0.5rem; background:#f1f5f9; padding:4px; border-radius:999px; margin-bottom:1rem;">
          <button id="signup-tab-ground" onclick="window._signupSwitchFloor('Ground Floor')"
            style="border:none; background:#fff; color:#0f172a; padding:5px 14px; border-radius:999px; font-weight:500; font-size:12px; cursor:pointer; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
            Ground Floor
          </button>
          <button id="signup-tab-first" onclick="window._signupSwitchFloor('First Floor')"
            style="border:none; background:transparent; color:#475569; padding:5px 14px; border-radius:999px; font-weight:500; font-size:12px; cursor:pointer;">
            First Floor
          </button>
        </div>
        <!-- Legend -->
        <div style="display:flex; gap:0.75rem; margin-bottom:0.75rem; flex-wrap:wrap;">
          <span style="background:#f0fdf4; color:#166534; border:1px solid #bbf7d0; padding:3px 10px; border-radius:999px; font-size:12px; font-weight:500;">● Available</span>
          <span style="background:#fef2f2; color:#991b1b; border:1px solid #fecaca; padding:3px 10px; border-radius:999px; font-size:12px; font-weight:500;">● Occupied</span>
          <span style="background:#fffbeb; color:#92400e; border:1px solid #fde68a; padding:3px 10px; border-radius:999px; font-size:12px; font-weight:500;">● Reserved</span>
          <span style="background:#0f172a; color:#fff; border:1px solid #0f172a; padding:3px 10px; border-radius:999px; font-size:12px; font-weight:600;">✓ Selected</span>
        </div>
        <!-- Seat grid -->
        <div id="signup-seat-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(70px,1fr)); gap:0.6rem; max-height:260px; overflow-y:auto; padding-right:4px;"></div>
        <div id="signup-selected-label" style="margin-top:0.6rem; font-size:13px; color:#475569; min-height:20px;"></div>
      </div>
    `;

    let signupAllSeats = [];
    let signupCurrentFloor = "Ground Floor";
    let signupSelectedId = null;

    const renderSignupSeats = () => {
      const grid = document.getElementById("signup-seat-grid");
      if (!grid) return;

      const floorSeats = signupAllSeats.filter(s => (s.floor || "Ground Floor") === signupCurrentFloor);

      if (floorSeats.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:1.5rem;color:#94a3b8;font-size:13px;">No seats on this floor yet.</div>`;
        return;
      }

      grid.innerHTML = floorSeats.map(seat => {
        const isSelected = seat.id === signupSelectedId;
        const isPickable = seat.status === "Available";

        let bg = "#f8fafc", border = "1px solid #e2e8f0", color = "#0f172a", cursor = "not-allowed", opacity = "0.55";
        if (seat.status === "Available")   { bg = "#f0fdf4"; border = "1px solid #bbf7d0"; color = "#166534"; cursor = "pointer"; opacity = "1"; }
        if (seat.status === "Occupied")    { bg = "#fef2f2"; border = "1px solid #fecaca"; color = "#991b1b"; }
        if (seat.status === "Reserved")    { bg = "#fffbeb"; border = "1px solid #fde68a"; color = "#92400e"; }
        if (seat.status === "Maintenance") { bg = "#eff6ff"; border = "1px solid #bfdbfe"; color = "#1e40af"; }

        if (isSelected) { bg = "#0f172a"; border = "2px solid #0f172a"; color = "#fff"; cursor = "pointer"; opacity = "1"; }

        return `
          <div
            onclick="window._signupSelectSeat('${seat.id}', '${seat.seatNumber}', ${isPickable})"
            title="${seat.status}${!isPickable ? ' – not selectable' : ''}"
            style="background:${bg}; border:${border}; color:${color}; opacity:${opacity};
                   border-radius:8px; height:46px; display:flex; align-items:center;
                   justify-content:center; cursor:${cursor}; transition:box-shadow 0.15s, border-color 0.15s;
                   font-size:13px; font-weight:600;"
            onmouseover="if(${isPickable}) { this.style.boxShadow='0 0 0 2px currentColor'; }"
            onmouseout="this.style.boxShadow='none';"
          >
            ${isSelected ? "✓ " : ""}${seat.seatNumber}
          </div>
        `;
      }).join("");
    };

    window._signupSwitchFloor = (floor) => {
      signupCurrentFloor = floor;
      const gBtn = document.getElementById("signup-tab-ground");
      const fBtn = document.getElementById("signup-tab-first");
      if (gBtn && fBtn) {
        if (floor === "Ground Floor") {
          gBtn.style.background = "#fff"; gBtn.style.color = "#0f172a"; gBtn.style.boxShadow = "0 1px 2px rgba(0,0,0,0.05)";
          fBtn.style.background = "transparent"; fBtn.style.color = "#475569"; fBtn.style.boxShadow = "none";
        } else {
          fBtn.style.background = "#fff"; fBtn.style.color = "#0f172a"; fBtn.style.boxShadow = "0 1px 2px rgba(0,0,0,0.05)";
          gBtn.style.background = "transparent"; gBtn.style.color = "#475569"; gBtn.style.boxShadow = "none";
        }
      }
      renderSignupSeats();
    };

    window._signupSelectSeat = (seatId, seatNumber, isPickable) => {
      if (!isPickable) {
        window.showToast && window.showToast("This seat is not available. Please choose a green (Available) seat.", "warning");
        return;
      }
      signupSelectedId = seatId;
      const numInput = document.getElementById("selectedSeatNumber");
      const idInput  = document.getElementById("selectedSeatId");
      if (numInput) numInput.value = seatNumber;
      if (idInput)  idInput.value  = seatId;
      const label = document.getElementById("signup-selected-label");
      if (label) label.innerHTML = `<span style="color:#166534; font-weight:600;">✓ Seat ${seatNumber} selected</span>`;
      renderSignupSeats();
    };

    // Listen for live seat updates
    listenToAllSeats((records) => {
      signupAllSeats = records;
      renderSignupSeats();
    });

    return; // ── end signup mode ───────────────────────────────────────────
  }

  // ── NORMAL ADMIN / SEAT MAP PAGE MODE ────────────────────────────────────
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

    <div class="page-header" style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid #e2e8f0; padding-bottom: 1rem; margin-bottom: 1.5rem;">
      <div style="display: flex; gap: 1.5rem;">
        <button id="view-tab-existing" class="view-tab active" style="background:transparent; border:none; border-bottom: 2px solid #0f172a; padding: 0.5rem 0; font-size: 18px; font-weight: 600; color: #0f172a; cursor: pointer;">Seat Map</button>
        <button id="view-tab-live" class="view-tab" style="background:transparent; border:none; border-bottom: 2px solid transparent; padding: 0.5rem 0; font-size: 18px; font-weight: 600; color: #64748b; cursor: pointer;">Live Seat Map</button>
      </div>
      <div style="display: flex; gap: 0.75rem;">
        <button class="btn btn-ghost" id="btn-filter-seats" style="background: #fff; color: #0f172a; border: 1px solid #e2e8f0; border-radius: 999px; padding: 6px 16px;"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg> Filter</button>
        <button class="btn btn-primary" id="btn-add-seat" style="background: #0f172a; color: #fff; border-radius: 999px; padding: 6px 16px;">+ Add seat</button>
      </div>
    </div>
    
    <div id="seatmap-view-existing">
      <div style="margin-bottom: 1rem;"><p class="page-subtitle" id="seat-subtitle">Loading...</p></div>
      <!-- Seat Legend -->
      <div class="seat-legend" style="display:flex; gap:1rem; margin-bottom:1.5rem;">
        <span class="legend-pill" style="background:#f0fdf4; color:#166534; border:1px solid #bbf7d0; padding:4px 12px; border-radius:999px; font-size:13px; font-weight:500; display:inline-flex; align-items:center; gap:6px;"><span style="width:8px; height:8px; border-radius:50%; background:currentColor;"></span><span data-i18n="status.available">Available</span></span>
        <span class="legend-pill" style="background:#fef2f2; color:#991b1b; border:1px solid #fecaca; padding:4px 12px; border-radius:999px; font-size:13px; font-weight:500; display:inline-flex; align-items:center; gap:6px;"><span style="width:8px; height:8px; border-radius:50%; background:currentColor;"></span><span data-i18n="status.occupied">Occupied</span></span>
        <span class="legend-pill" style="background:#fffbeb; color:#92400e; border:1px solid #fde68a; padding:4px 12px; border-radius:999px; font-size:13px; font-weight:500; display:inline-flex; align-items:center; gap:6px;"><span style="width:8px; height:8px; border-radius:50%; background:currentColor;"></span><span data-i18n="status.reserved">Reserved</span></span>
        <span class="legend-pill" style="background:#eff6ff; color:#1e40af; border:1px solid #bfdbfe; padding:4px 12px; border-radius:999px; font-size:13px; font-weight:500; display:inline-flex; align-items:center; gap:6px;"><span style="width:8px; height:8px; border-radius:50%; background:currentColor;"></span><span data-i18n="status.maintenance">Maintenance</span></span>
      </div>

      <!-- Floor Tabs -->
      <div class="floor-tabs" style="display:inline-flex; gap:0.5rem; background:#f1f5f9; padding:4px; border-radius:999px; margin-bottom:1.5rem;">
        <button class="floor-tab active" data-floor="Ground Floor" style="border:none; background:#fff; color:#0f172a; padding:6px 16px; border-radius:999px; font-weight:500; font-size:13px; cursor:pointer; box-shadow:0 1px 2px rgba(0,0,0,0.05);" data-i18n="floor.ground">Ground Floor</button>
        <button class="floor-tab" data-floor="First Floor" style="border:none; background:transparent; color:#475569; padding:6px 16px; border-radius:999px; font-weight:500; font-size:13px; cursor:pointer;" data-i18n="floor.first">First Floor</button>
      </div>

      <!-- Main Floor Card -->
      <div class="card" style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:1.5rem; margin-bottom:2rem;">
        <h3 style="font-size:15px; font-weight:600; color:#0f172a; margin-bottom:4px;" id="current-floor-title" data-i18n="floor.ground">Ground Floor</h3>
        <p style="font-size:13px; color:#94a3b8; margin-bottom:1.5rem;">Section A · Section B · click a seat for details</p>
        
        <div id="seat-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(85px, 1fr)); gap: 1rem;">
          <div style="text-align:center; grid-column: 1 / -1; padding: 2rem; color: #94a3b8;">Loading live seat map...</div>
        </div>
      </div>
    </div>
    
    <div id="seatmap-view-live" style="display:none;"></div>
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

  if (!document.getElementById("filter-seat-modal")) {
    const filterModalDiv = document.createElement("div");
    filterModalDiv.innerHTML = `
      <dialog id="filter-seat-modal" class="card" style="border:none; border-radius:12px; padding:0; box-shadow:0 10px 30px rgba(0,0,0,0.5); background: var(--bg-card, #fff); color: var(--text-primary, #0f172a);">
        <div style="padding: 1.5rem; min-width: 400px; max-width: 500px; max-height: 85vh; overflow-y: auto;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h2 style="margin: 0;">Filter Seats</h2>
            <button class="btn btn-ghost" onclick="document.getElementById('filter-seat-modal').close()" style="padding: 0.25rem 0.5rem; background: transparent; border: none; font-size: 18px; cursor: pointer;">✕</button>
          </div>
          <form id="filter-seat-form" onsubmit="event.preventDefault(); window.applySeatFilters()">
            <div class="form-group" style="margin-bottom: 1rem;">
              <label style="display:block; margin-bottom:0.25rem; font-size:0.875rem; font-weight:600; color:var(--text-secondary);">Search (Seat No or Name)</label>
              <input type="text" id="filter-seat-search" placeholder="e.g. A01 or John" class="input-field" style="width: 100%; box-sizing: border-box; padding: 0.5rem; border:1px solid var(--border, #e2e8f0); border-radius:6px;" />
            </div>
            <div class="form-group" style="margin-bottom: 1.5rem;">
              <label style="display:block; margin-bottom:0.25rem; font-size:0.875rem; font-weight:600; color:var(--text-secondary);">Status</label>
              <select id="filter-seat-status" class="input-field" style="width: 100%; box-sizing: border-box; padding: 0.5rem; border:1px solid var(--border, #e2e8f0); border-radius:6px;">
                <option value="All">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Occupied">Occupied</option>
                <option value="Reserved">Reserved</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
              <button type="button" class="btn btn-ghost" onclick="window.clearSeatFilters()" style="padding:8px 16px; border:1px solid var(--border, #e2e8f0); border-radius:999px; background:transparent;">Clear Filters</button>
              <button type="submit" class="btn btn-primary" style="padding:8px 16px; border:none; border-radius:999px; background:#0f172a; color:#fff;">Apply</button>
            </div>
          </form>
        </div>
      </dialog>
    `;
    document.body.appendChild(filterModalDiv.firstElementChild);
  }

  // View Tab Listeners
  let liveMapInitialized = false;
  const tabExisting = document.getElementById("view-tab-existing");
  const tabLive = document.getElementById("view-tab-live");
  const viewExisting = document.getElementById("seatmap-view-existing");
  const viewLive = document.getElementById("seatmap-view-live");

  if (tabExisting && tabLive) {
    tabExisting.addEventListener("click", () => {
      tabExisting.classList.add("active");
      tabExisting.style.borderBottomColor = "#0f172a";
      tabExisting.style.color = "#0f172a";
      
      tabLive.classList.remove("active");
      tabLive.style.borderBottomColor = "transparent";
      tabLive.style.color = "#64748b";

      viewExisting.style.display = "block";
      viewLive.style.display = "none";
      document.getElementById("btn-add-seat").style.display = "inline-block";
    });

    tabLive.addEventListener("click", () => {
      tabLive.classList.add("active");
      tabLive.style.borderBottomColor = "#0f172a";
      tabLive.style.color = "#0f172a";
      
      tabExisting.classList.remove("active");
      tabExisting.style.borderBottomColor = "transparent";
      tabExisting.style.color = "#64748b";

      viewExisting.style.display = "none";
      viewLive.style.display = "block";
      document.getElementById("btn-add-seat").style.display = "none";

      if (!liveMapInitialized) {
        initLiveSeatMapInTab("seatmap-view-live");
        liveMapInitialized = true;
      }
    });
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
    if (!seatNumber) {
      window.showToast("Please enter a seat number.", "warning");
      return;
    }

    const btn = document.getElementById("btn-save-seat");
    const originalText = btn.innerText;
    btn.innerText = "Saving...";
    btn.disabled = true;

    try {
      const res = await addSingleSeat(seatNumber.trim().toUpperCase(), currentFilters.floor);
      if (res.success) {
        document.getElementById("add-seat-modal").close();
        document.getElementById("add-seat-number").value = "";
        if(typeof showToast === 'function') showToast("Seat added successfully to " + currentFilters.floor + "!");
        else window.showToast("Seat added successfully to " + currentFilters.floor + "!", "success");
      } else {
        window.showToast("Failed to add seat: " + res.error, "error");
      }
    } catch (e) {
      window.showToast("Error adding seat: " + e.message, "error");
    } finally {
      btn.innerText = originalText;
      btn.disabled = false;
    }
  };

  const btnFilter = document.getElementById("btn-filter-seats");
  if (btnFilter) {
    btnFilter.addEventListener("click", () => {
      document.getElementById("filter-seat-search").value = currentFilters.search;
      document.getElementById("filter-seat-status").value = currentFilters.status;
      document.getElementById("filter-seat-modal").showModal();
    });
  }

  window.applySeatFilters = () => {
    currentFilters.search = document.getElementById("filter-seat-search").value.trim();
    currentFilters.status = document.getElementById("filter-seat-status").value;
    document.getElementById("filter-seat-modal").close();
    renderSeatMap();
  };

  window.clearSeatFilters = () => {
    currentFilters.search = "";
    currentFilters.status = "All";
    document.getElementById("filter-seat-modal").close();
    renderSeatMap();
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
      let seat = allSeats.find(s => s.seatNumber === String(seatNumStr) && s.floor === currentFilters.floor);
      
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

      let isFilteredOut = false;
      if (currentFilters.status !== "All" && seat.status !== currentFilters.status) isFilteredOut = true;
      if (currentFilters.search) {
        const q = currentFilters.search.toLowerCase();
        const sn = (seat.seatNumber||"").toLowerCase();
        const asn = (seat.assignedStudentName||"").toLowerCase();
        if (!sn.includes(q) && !asn.includes(q)) isFilteredOut = true;
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
            cursor: pointer; transition: box-shadow 0.15s, border-color 0.15s;
            opacity: ${isFilteredOut ? '0.15' : '1'};
          "
          onmouseover="this.style.boxShadow='0 0 0 2px currentColor';"
          onmouseout="this.style.boxShadow='none';"
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
            ${renderColHtml(generateRange('A', 1, 18))}
            ${renderColHtml(generateRange('A', 34, 19))}
            
            <!-- Middle section with seats 67 and 68 -->
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; width: 80px; flex-shrink: 0; align-self: center;">
               ${renderSeatCard('A67')}
               ${renderSeatCard('A68')}
            </div>

            ${renderColHtml(generateRange('A', 35, 48))}
            ${renderColHtml(generateRange('A', 66, 49))}
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

