import { listenToOldStudents, restoreOldStudent } from "./oldStudentService.js";

let allOldStudents = [];

export const initOldStudentAdminUI = () => {
  const container = document.getElementById("page-old-students");
  if (!container) return;

  const role = localStorage.getItem("userRole");
  if (role === "Student") return; // Blocked

  const canRestore = (role === "Owner/Admin" || role === "Manager");

  container.innerHTML = `
    <div class="page-header" style="display:flex; justify-content:space-between; align-items:center;">
      <div>
        <h1>Old Students</h1>
        <p class="page-subtitle">View and restore past members. History is preserved permanently.</p>
      </div>
    </div>

    <div class="card" style="margin-bottom: 2rem;">
      <div class="toolbar" style="flex-wrap:wrap; gap:1rem;">
        <div class="search-box">
          <input type="text" id="old-search" placeholder="Search name, phone, ID..." />
        </div>
        <div>
          <select id="old-filter-reason" class="input-field" style="width:180px;">
            <option value="All">All Reasons</option>
          </select>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Student Info</th>
              <th>Last Seat</th>
              <th>Last Plan</th>
              <th>Exit Date</th>
              <th>Exit Reason</th>
              ${canRestore ? `<th>Actions</th>` : ""}
            </tr>
          </thead>
          <tbody id="old-tbody">
            <tr><td colspan="${canRestore ? '6' : '5'}" style="text-align:center;">Loading old students...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Attach Listeners
  const renderList = () => renderOldStudents(canRestore);
  document.getElementById("old-search").addEventListener("input", renderList);
  document.getElementById("old-filter-reason").addEventListener("change", renderList);

  listenToOldStudents((records) => {
    allOldStudents = records;
    populateReasonDropdown();
    renderList();
  });
};

const populateReasonDropdown = () => {
  const filterSelect = document.getElementById("old-filter-reason");
  if (!filterSelect) return;
  const currentVal = filterSelect.value;
  
  const reasons = new Set();
  allOldStudents.forEach(s => {
    if (s.exitReason) reasons.add(s.exitReason);
  });

  let html = `<option value="All">All Reasons</option>`;
  Array.from(reasons).sort().forEach(r => {
    html += `<option value="${r}">${r}</option>`;
  });
  
  filterSelect.innerHTML = html;
  filterSelect.value = currentVal || "All";
};

const getFilteredOldStudents = () => {
  let filtered = [...allOldStudents];
  const search = document.getElementById("old-search").value.toLowerCase();
  const reason = document.getElementById("old-filter-reason").value;

  if (search) {
    filtered = filtered.filter(s => 
      (s.name && s.name.toLowerCase().includes(search)) || 
      (s.phone && s.phone.includes(search)) ||
      (s.studentId && s.studentId.toLowerCase().includes(search))
    );
  }
  if (reason !== "All") filtered = filtered.filter(s => s.exitReason === reason);

  return filtered;
};

const renderOldStudents = (canRestore) => {
  const tbody = document.getElementById("old-tbody");
  if (!tbody) return;

  const filtered = getFilteredOldStudents();

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${canRestore ? '6' : '5'}" style="text-align:center;">No old students found.</td></tr>`;
    return;
  }

  window.handleRestoreStudent = async (id, name) => {
    const confirmed = await window.showCustomConfirm("Restore Student", `Restore ${name} to Active Students?<br><br>They will be restored without an assigned seat.`);
    if (confirmed) {
      const res = await restoreOldStudent(id);
      if (!res.success) window.showToast("Error restoring student: " + res.error, "error");
    }
  };

  let html = "";
  filtered.forEach(s => {
    const initials = s.name ? s.name.substring(0, 2).toUpperCase() : "??";
    
    html += `
      <tr>
        <td>
          <div class="student-cell">
            <div class="avatar-sm" style="background:#9ca3af">${initials}</div>
            <div>
              <div class="name">${s.name || "Unknown"}</div>
              <div class="sub-text">${s.phone || "No Phone"} · ID: ${s.studentId || "N/A"}</div>
            </div>
          </div>
        </td>
        <td style="color:var(--text-muted);">${s.seatNumber || "Unassigned"}</td>
        <td style="color:var(--text-muted);">${s.planName || "None"}</td>
        <td style="font-weight:500;">${s.exitDate || "N/A"}</td>
        <td><span class="badge" style="background:#e5e7eb; color:#374151;">${s.exitReason || "Other"}</span></td>
        ${canRestore ? `
        <td>
          <button class="btn btn-secondary" style="padding:0.25rem 0.5rem; font-size:0.75rem;" onclick="window.handleRestoreStudent('${s.id}', '${s.name}')">Restore</button>
        </td>
        ` : ""}
      </tr>
    `;
  });

  tbody.innerHTML = html;
};
