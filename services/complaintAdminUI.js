import { listenToAllComplaints, resolveComplaint, updateComplaintStatus } from "./complaintService.js";
import { filterComplaints } from "./complaintFilter.js";

let allComplaints = [];
let unsubscribe = null;
let currentFilters = { status: "All", category: "All", search: "" };

export const initComplaintAdminUI = () => {
  const container = document.getElementById("page-complaints");
  if (!container) return; 

  const role = localStorage.getItem("userRole");
  if (role === "Student") return; // Security guard

  // Initial UI Setup
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1>Complaint Management</h1>
        <p class="page-subtitle" id="complaints-subtitle">Loading records...</p>
      </div>
    </div>
    
    <div class="card">
      <div class="toolbar" style="flex-wrap: wrap;">
        <div class="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="complaint-search" placeholder="Search by student, seat, or ID..." />
        </div>
        
        <select id="complaint-filter-category" style="padding: 0.5rem; border: 1px solid var(--border); border-radius: 6px; background: var(--bg-color); color: var(--text-color);">
          <option value="All">All Categories</option>
          <option value="Noise">Noise</option>
          <option value="Light">Light</option>
          <option value="Fan">Fan</option>
          <option value="Charging Point">Charging Point</option>
          <option value="Furniture">Furniture</option>
          <option value="Cleaning">Cleaning</option>
          <option value="Washroom">Washroom</option>
          <option value="WiFi">WiFi</option>
          <option value="Others">Others</option>
        </select>

        <div class="filter-tabs">
          <button class="filter-tab comp-filter active" data-val="All">All</button>
          <button class="filter-tab comp-filter" data-val="Pending">Pending</button>
          <button class="filter-tab comp-filter" data-val="In Progress">In Progress</button>
          <button class="filter-tab comp-filter" data-val="Resolved">Resolved</button>
        </div>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Student</th>
            <th>Seat</th>
            <th>Category</th>
            <th>Issue Description</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="complaint-table-body">
          <tr><td colspan="7" style="text-align:center;">Loading...</td></tr>
        </tbody>
      </table>
    </div>
  `;

  // Listeners
  document.getElementById("complaint-search").addEventListener("input", (e) => {
    currentFilters.search = e.target.value;
    renderComplaintAdminTable();
  });

  document.getElementById("complaint-filter-category").addEventListener("change", (e) => {
    currentFilters.category = e.target.value;
    renderComplaintAdminTable();
  });

  document.querySelectorAll(".comp-filter").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".comp-filter").forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      currentFilters.status = e.target.getAttribute("data-val");
      renderComplaintAdminTable();
    });
  });

  // Global Actions
  window.handleResolveComplaint = async (id, phone, name, category) => {
    const remark = prompt(`Resolving complaint for ${name}.\nEnter a resolution note (optional):`);
    if (remark === null) return; // cancelled

    const resolver = localStorage.getItem("userName") || "Admin";
    const res = await resolveComplaint(id, resolver, remark || "Issue resolved.");
    if (res.success) {
      // Trigger WhatsApp
      let cleanPhone = (phone || "").replace(/\D/g, "");
      if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone; // Assume India by default if 10 digits
      
      if (cleanPhone && confirm("Complaint marked as Resolved. Do you want to notify the student via WhatsApp?")) {
        const studentData = {
          id: studentId,
          fullName: name,
          phone: cleanPhone
        };
        const text = `Hello ${name},\n\nYour complaint regarding '${category}' has been resolved.\n\nThank you for your patience.`;
        
        // Use global whatsapp service if available
        if (window.sendWhatsAppMessage) {
          window.sendWhatsAppMessage(studentData, "Complaint Update", text);
        } else {
          const encoded = encodeURIComponent(text);
          window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, "_blank");
        }
      }
    } else {
      alert("Error resolving complaint: " + res.error);
    }
  };

  window.handleMarkInProgress = async (id) => {
    const res = await updateComplaintStatus(id, "In Progress");
    if (!res.success) alert("Error: " + res.error);
  };

  // Start Listener
  if (unsubscribe) unsubscribe();
  unsubscribe = listenToAllComplaints((records) => {
    allComplaints = records;
    renderComplaintAdminTable();
  });
};

const renderComplaintAdminTable = () => {
  const tbody = document.getElementById("complaint-table-body");
  const subtitle = document.getElementById("complaints-subtitle");
  if (!tbody) return;

  const role = localStorage.getItem("userRole");
  const canResolve = (role === "Owner" || role === "Manager" || role === "Admin"); 

  const filtered = filterComplaints(allComplaints, currentFilters);

  // Update Counters
  const pendingCount = allComplaints.filter(r => r.status === "Pending").length;
  if (subtitle) subtitle.innerHTML = `${allComplaints.length} total complaints · <span style="color:var(--danger); font-weight:bold;">${pendingCount} pending</span>`;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--text-muted);">No complaints found.</td></tr>`;
    return;
  }

  let html = "";
  filtered.forEach(c => {
    let badgeClass = "badge-pending";
    if (c.status === "Resolved" || c.status === "Closed") badgeClass = "badge-paid";
    if (c.status === "In Progress") badgeClass = "badge-absent"; // Orange-ish or red

    let actionsHtml = `<span style="color:var(--text-muted); font-size:0.8rem;">No actions</span>`;
    
    if (c.status === "Pending" || c.status === "In Progress") {
      if (canResolve) {
        actionsHtml = `<button class="btn btn-ghost" style="color: var(--success); padding: 0.2rem 0.5rem;" onclick="window.handleResolveComplaint('${c.id}', '${c.studentPhone}', '${c.studentName}', '${c.category}')">Resolve</button>`;
        
        if (c.status === "Pending") {
          actionsHtml += `<button class="btn btn-ghost" style="color: var(--primary); padding: 0.2rem 0.5rem;" onclick="window.handleMarkInProgress('${c.id}')">Start</button>`;
        }
      } else {
        actionsHtml = `<span style="color:var(--text-muted); font-size:0.8rem;">View Only</span>`;
      }
    } else {
      actionsHtml = `<span style="color:var(--text-muted); font-size:0.8rem;">Resolved by: ${c.resolvedBy || 'Unknown'}</span>`;
    }
    
    const resNote = c.resolutionNote ? `<div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.2rem;"><i>Admin: ${c.resolutionNote}</i></div>` : "";

    html += `
      <tr>
        <td>${new Date(c.date).toLocaleDateString()}</td>
        <td>
          <div style="font-weight: 500;">${c.studentName || "Unknown"}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${c.planName || "No Plan"}</div>
        </td>
        <td>${c.seatNumber || "-"}</td>
        <td style="font-weight:600;">${c.category}</td>
        <td><div style="max-width: 250px; overflow: hidden; text-overflow: ellipsis;">${c.description}</div>${resNote}</td>
        <td><span class="badge ${badgeClass}">${c.status.toUpperCase()}</span></td>
        <td><div style="display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap;">${actionsHtml}</div></td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
};
