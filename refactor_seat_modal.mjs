import fs from 'fs';

let content = fs.readFileSync('services/seatMapUI.js', 'utf8');

const newHtml = `
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

    <div class="page-header" style="display:flex; justify-content:space-between; align-items:center;">`;

const splitStart = content.split('container.innerHTML = `\n    <div class="page-header" style="display:flex; justify-content:space-between; align-items:center;">');

let newContent = splitStart[0] + 'container.innerHTML = `' + newHtml + splitStart[1];

const listenerReplacement = `
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
      return alert("You only have View permissions for seats.");
    }
    
    const seat = allSeats.find(s => s.id === seatId);
    if (!seat) return;
    currentSelectedSeat = seat;

    modalTitle.innerText = \`Seat \${seat.seatNumber} (\${seat.status})\`;
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
`;

const splitListener = newContent.split('// Global Actions\n  window.handleSeatClick = (seatId) => {');
const endListenerSplit = splitListener[1].split('// Start Listener');

newContent = splitListener[0] + listenerReplacement + '\n  // Start Listener' + endListenerSplit[1];

// Update triggerAssignSeat to accept studentEmailOrId parameter directly
newContent = newContent.replace(
  'const triggerAssignSeat = async (seat) => {\n  const studentEmailOrId = prompt(`Enter the Name, Email or Student ID of the student to assign to Seat ${seat.seatNumber}:`);\n  if (!studentEmailOrId) return;',
  'const triggerAssignSeat = async (seat, studentEmailOrId) => {\n  if (!studentEmailOrId) return;'
);

// We should remove triggerAssignSeat from processSeatAction for choice "1" of Available, as we directly call it now in UI
newContent = newContent.replace(
  'if (seat.status === "Available") {\n    if (choice === "1") return await triggerAssignSeat(seat);',
  'if (seat.status === "Available") {\n    // choice === "1" is handled directly by modal assign action now'
);

fs.writeFileSync('services/seatMapUI.js', newContent);
console.log('Done rewriting seat modal logic');
