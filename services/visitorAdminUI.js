import { listenToVisitors, addVisitor, updateVisitorStatus, deleteVisitor, seedInitialPurposes, listenToVisitorPurposes } from "./visitorService.js";
import { calculateVisitorAnalytics } from "./visitorAnalytics.js";

let allVisitors = [];
let allPurposes = [];

export const initVisitorAdminUI = async () => {
  const container = document.getElementById("page-visitors");
  if (!container) return;

  const role = localStorage.getItem("userRole");
  if (role === "Student") return; // Blocked

  const canEdit = (role === "Owner/Admin" || role === "Manager");
  const canDelete = (role === "Owner/Admin");

  // Seed default purposes
  await seedInitialPurposes();

  container.innerHTML = `
    <div class="page-header" style="display:flex; justify-content:space-between; align-items:center;">
      <div>
        <h1>Visitor Management</h1>
        <p class="page-subtitle">Track walk-ins, inquiries, and analytics</p>
      </div>
      <div>
        <button class="btn btn-primary" id="btn-add-visitor">+ Add Visitor</button>
      </div>
    </div>

    <!-- Analytics Dashboard -->
    <div class="metrics-grid" style="margin-bottom: 2rem;">
      <div class="metric-card">
        <div class="metric-info">
          <div class="metric-label">Today's Visitors</div>
          <div class="metric-value" id="vis-metric-today">0</div>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-info">
          <div class="metric-label">Weekly Visitors</div>
          <div class="metric-value" id="vis-metric-weekly">0</div>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-info">
          <div class="metric-label">Monthly Visitors</div>
          <div class="metric-value" id="vis-metric-monthly">0</div>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-info">
          <div class="metric-label">Total Visitors</div>
          <div class="metric-value" id="vis-metric-total">0</div>
        </div>
      </div>
    </div>

    <!-- Visitor List Tab -->
    <div class="card" style="margin-bottom: 2rem;">
      <div class="toolbar" style="flex-wrap:wrap; gap:1rem;">
        <div class="search-box">
          <input type="text" id="vis-search" placeholder="Search by name, phone..." />
        </div>
        <div>
          <select id="vis-filter-purpose" class="input-field" style="width:150px;">
            <option value="All">All Purposes</option>
          </select>
        </div>
        <div>
          <select id="vis-filter-status" class="input-field" style="width:150px;">
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date/Time</th>
              <th>Visitor Name</th>
              <th>Phone</th>
              <th>Purpose</th>
              <th>Handled By</th>
              <th>Status</th>
              ${canEdit ? `<th>Actions</th>` : ""}
            </tr>
          </thead>
          <tbody id="visitor-tbody">
            <tr><td colspan="7" style="text-align:center;">Loading...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Attach Filter Listeners
  const renderVis = () => renderVisitors(canEdit, canDelete);
  document.getElementById("vis-search").addEventListener("input", renderVis);
  document.getElementById("vis-filter-purpose").addEventListener("change", renderVis);
  document.getElementById("vis-filter-status").addEventListener("change", renderVis);

  // Add Button
  document.getElementById("btn-add-visitor").addEventListener("click", () => handleAddVisitor());

  // Listeners
  listenToVisitorPurposes((purposes) => {
    allPurposes = purposes;
    populatePurposeDropdown();
  });

  listenToVisitors((records) => {
    allVisitors = records;
    updateAnalyticsUI();
    renderVis();
  });
};

const populatePurposeDropdown = () => {
  const filterSelect = document.getElementById("vis-filter-purpose");
  if (!filterSelect) return;
  const currentVal = filterSelect.value;
  
  let html = `<option value="All">All Purposes</option>`;
  allPurposes.forEach(p => {
    html += `<option value="${p.name}">${p.name}</option>`;
  });
  filterSelect.innerHTML = html;
  filterSelect.value = currentVal;
};

const updateAnalyticsUI = () => {
  const stats = calculateVisitorAnalytics(allVisitors);
  if (document.getElementById("vis-metric-today")) document.getElementById("vis-metric-today").innerText = stats.todayCount;
  if (document.getElementById("vis-metric-weekly")) document.getElementById("vis-metric-weekly").innerText = stats.weeklyCount;
  if (document.getElementById("vis-metric-monthly")) document.getElementById("vis-metric-monthly").innerText = stats.monthlyCount;
  if (document.getElementById("vis-metric-total")) document.getElementById("vis-metric-total").innerText = stats.totalCount;
};

const getFilteredVisitors = () => {
  let filtered = [...allVisitors];
  const search = document.getElementById("vis-search").value.toLowerCase();
  const purpose = document.getElementById("vis-filter-purpose").value;
  const status = document.getElementById("vis-filter-status").value;

  if (search) {
    filtered = filtered.filter(v => 
      v.visitorName.toLowerCase().includes(search) || 
      v.phone.includes(search) ||
      (v.employeeName && v.employeeName.toLowerCase().includes(search))
    );
  }
  if (purpose !== "All") filtered = filtered.filter(v => v.purpose === purpose);
  if (status !== "All") filtered = filtered.filter(v => v.status === status);

  return filtered;
};

const renderVisitors = (canEdit, canDelete) => {
  const tbody = document.getElementById("visitor-tbody");
  if (!tbody) return;

  const filtered = getFilteredVisitors();

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${canEdit ? '7' : '6'}" style="text-align:center;">No visitors found.</td></tr>`;
    return;
  }

  window.handleCompleteVisit = async (id) => {
    await updateVisitorStatus(id, "Completed");
  };

  window.handleDeleteVisitor = async (id) => {
    if (confirm("Delete this visitor record?")) {
      const res = await deleteVisitor(id);
      if (!res.success) alert(res.error);
    }
  };

  let html = "";
  filtered.forEach(v => {
    const isCompleted = v.status === "Completed";
    const badgeClass = isCompleted ? "badge-paid" : "badge-pending";

    let actions = "";
    if (canEdit) {
      if (!isCompleted) {
        actions += `<button class="btn btn-secondary" style="padding:0.25rem 0.5rem; font-size:0.75rem;" onclick="window.handleCompleteVisit('${v.id}')">Mark Completed</button> `;
      }
      if (canDelete) {
        actions += `<button class="btn btn-secondary" style="padding:0.25rem 0.5rem; font-size:0.75rem; color:var(--danger);" onclick="window.handleDeleteVisitor('${v.id}')">Delete</button>`;
      }
    }

    html += `
      <tr style="opacity: ${isCompleted ? '0.7' : '1'}">
        <td>${v.visitDate}<br><small style="color:var(--text-muted)">${v.visitTime}</small></td>
        <td style="font-weight:600;">${v.visitorName}<br><small style="font-weight:400; color:var(--text-muted)">${v.remarks || ""}</small></td>
        <td>${v.phone}</td>
        <td>${v.purpose}</td>
        <td style="font-size:0.8rem; color:var(--text-muted);">${v.employeeName}</td>
        <td><span class="badge ${badgeClass}">${v.status}</span></td>
        ${canEdit ? `<td>${actions}</td>` : ""}
      </tr>
    `;
  });

  tbody.innerHTML = html;
};

const handleAddVisitor = async () => {
  if (allPurposes.length === 0) {
    return alert("No purposes available.");
  }

  const name = prompt("Enter Visitor Name:");
  if (!name) return;

  const phone = prompt("Enter 10-digit Phone Number:");
  if (!phone) return;

  let purpPrompt = "Select Purpose Number:\n";
  allPurposes.forEach((p, i) => purpPrompt += `${i + 1}. ${p.name}\n`);
  const purpIdxStr = prompt(purpPrompt);
  if (!purpIdxStr) return;
  const pIdx = parseInt(purpIdxStr) - 1;
  if (isNaN(pIdx) || pIdx < 0 || pIdx >= allPurposes.length) return alert("Invalid purpose.");
  const purpose = allPurposes[pIdx].name;

  const currentUser = localStorage.getItem("userName") || "Admin";
  const employeeName = prompt(`Enter Employee Handling Visit (Default: ${currentUser}):`, currentUser);
  if (!employeeName) return;

  const remarks = prompt("Enter Remarks (Optional):") || "";

  const data = {
    visitorName: name,
    phone,
    purpose,
    employeeName,
    remarks
  };

  const authorId = localStorage.getItem("userId") || "admin";
  const res = await addVisitor(data, authorId);
  if (!res.success) {
    alert("Error: " + res.error);
  }
};
