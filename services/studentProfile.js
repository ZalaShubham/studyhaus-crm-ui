import { listenToAllStudents, softDeleteStudent, updateStudentProfile } from "./studentService.js";
import { searchStudents, filterStudents, sortStudents, paginateStudents } from "./studentDataProcessing.js";
import { fetchPlansForDropdown } from "./admissionService.js";
import { convertToOldStudent } from "./oldStudentService.js";
import { loadStudentDocuments } from "./documentUploadService.js";

let allStudents = [];
let currentQuery = "";
let currentFilters = { status: "All", plan: "All" };
let currentSort = { by: "name", order: "asc" };
let currentPage = 1;
let pageSize = 10;
let availablePlans = [];

// ==========================================
// INITIALIZATION
// ==========================================
export const initStudentManagementUI = async () => {
  const tableBody = document.getElementById("students-table-body");
  if (!tableBody) return; // Not on students page

  const role = localStorage.getItem("userRole");
  if (role === "Student") {
    // Students don't manage the student table — silently skip this admin UI
    return;
  }

  // Load plans for edit dropdown
  try {
    availablePlans = await fetchPlansForDropdown(false);
  } catch (e) {
    console.error("Could not fetch plans", e);
  }

  // Start Listener
  tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Loading students...</td></tr>`;
  
  listenToAllStudents((data) => {
    // Exclude Old Students by default unless explicitly filtering for them
    allStudents = data.filter(s => s.status !== "Old Student");
    renderTable();
  }, (err) => {
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--danger);">Failed to load students.</td></tr>`;
  });

  // Attach event listeners
  const searchInput = document.getElementById("student-search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentQuery = e.target.value;
      currentPage = 1;
      renderTable();
    });
  }

  document.querySelectorAll(".filter-tab").forEach(tab => {
    tab.addEventListener("click", (e) => {
      document.querySelectorAll(".filter-tab").forEach(t => t.classList.remove("active"));
      e.target.classList.add("active");
      currentFilters.status = e.target.innerText;
      currentPage = 1;
      renderTable();
    });
  });

  // Attach global functions for UI actions
  window.changePage = (increment) => {
    currentPage += increment;
    if (currentPage < 1) currentPage = 1;
    renderTable();
  };

  window.changePageSize = (size) => {
    pageSize = parseInt(size);
    currentPage = 1;
    renderTable();
  };

  window.setSort = (field) => {
    if (currentSort.by === field) {
      currentSort.order = currentSort.order === "asc" ? "desc" : "asc";
    } else {
      currentSort.by = field;
      currentSort.order = "asc";
    }
    renderTable();
  };

  window.openStudentProfile = (id) => {
    const student = allStudents.find(s => s.id === id);
    if (student) renderProfileModal(student, role);
  };

  window.closeStudentProfile = () => {
    const modal = document.getElementById("student-profile-modal");
    if (modal) modal.close();
  };
};

// ==========================================
// RENDER LOGIC
// ==========================================
const renderTable = () => {
  const tableBody = document.getElementById("students-table-body");
  if (!tableBody) return;

  // 0. Exclude Old Students entirely from Active Management
  let activeOnly = allStudents.filter(s => s.status !== "Old");

  // 1. Search
  let processed = searchStudents(activeOnly, currentQuery);
  // 2. Filter
  processed = filterStudents(processed, currentFilters);
  // 3. Sort
  processed = sortStudents(processed, currentSort.by, currentSort.order);
  
  // Pagination State
  const total = processed.length;
  const maxPage = Math.ceil(total / pageSize) || 1;
  if (currentPage > maxPage) currentPage = maxPage;

  // Update Counters in Header
  updateCounters(processed);

  // 4. Paginate
  processed = paginateStudents(processed, currentPage, pageSize);

  if (processed.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--text-muted);">No students found.</td></tr>`;
    updatePaginationUI(total);
    return;
  }

  let html = "";
  processed.forEach(s => {
    const initials = s.name ? s.name.substring(0, 2).toUpperCase() : "??";
    const statusBadge = s.status === "Active" ? `<span class="badge badge-paid">Active</span>` 
                      : s.status === "Pending" || s.approvalStatus === "Pending" ? `<span class="badge badge-pending">Pending</span>`
                      : `<span class="badge badge-overdue">${s.status}</span>`;

    html += `
      <tr style="cursor:pointer;" onclick="window.openStudentProfile('${s.id}')">
        <td>
          <div class="student-cell">
            <div class="avatar-sm" style="background:var(--primary)">${initials}</div>
            <div>
              <div class="name">${s.name || "Unknown"}</div>
              <div class="sub-text">${s.phone || "No Phone"}</div>
            </div>
          </div>
        </td>
        <td>${s.seatNumber || "Unassigned"}</td>
        <td>${s.planName || "None"}</td>
        <td>${s.createdAt?.toDate ? new Date(s.createdAt.toDate()).toLocaleDateString() : 'N/A'}</td>
        <td>${s.paymentDueDate || "N/A"}</td>
        <td>${statusBadge}</td>
        <td><button class="icon-btn-sm" onclick="event.stopPropagation(); window.openStudentProfile('${s.id}')">⋯</button></td>
      </tr>
    `;
  });

  tableBody.innerHTML = html;
  updatePaginationUI(total);
};

const updateCounters = (dataset) => {
  const subtitle = document.querySelector("#page-students .page-subtitle");
  if (!subtitle) return;
  const active = dataset.filter(s => s.status === "Active").length;
  const inactive = dataset.filter(s => s.status === "Inactive" || s.status === "Expired").length;
  const pending = dataset.filter(s => s.status === "Pending" || s.approvalStatus === "Pending").length;
  subtitle.innerHTML = `${active} active · ${inactive} inactive · ${pending} pending`;
};

const updatePaginationUI = (total) => {
  const pageInfo = document.getElementById("pagination-info");
  if (pageInfo) {
    const start = total === 0 ? 0 : ((currentPage - 1) * pageSize) + 1;
    const end = Math.min(currentPage * pageSize, total);
    pageInfo.innerText = `Showing ${start}-${end} of ${total} students`;
  }
};

// ==========================================
// PROFILE MODAL LOGIC
// ==========================================
const renderProfileModal = (s, role) => {
  const modal = document.getElementById("student-profile-modal");
  if (!modal) return;

  const isOwner = role === "Owner/Admin";
  const isManager = role === "Manager";
  const canEdit = isOwner || isManager;
  
  // Manager cannot edit Plan, Seat, or Status
  const readOnlyForManager = isManager ? "disabled" : "";
  const hideForEmployee = !canEdit ? "display:none;" : "";

  let planOptions = `<option value="">Select Plan...</option>`;
  availablePlans.forEach(p => {
    const selected = p.id === s.planId ? "selected" : "";
    planOptions += `<option value="${p.id}" ${selected}>${p.planName}</option>`;
  });

  modal.innerHTML = `
    <div style="padding: 1.5rem; max-width: 600px; max-height: 85vh; overflow-y: auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <h2 style="margin: 0;">Student Profile</h2>
        <button class="btn btn-ghost" onclick="window.closeStudentProfile()" style="padding: 0.25rem 0.5rem;">✕</button>
      </div>
      
      <div style="display: flex; gap: 1rem; margin-bottom: 2rem; align-items: center;">
        <div id="sp-avatar-${s.id}" style="width: 80px; height: 80px; border-radius: 50%; background: var(--primary); color: white; display:flex; align-items:center; justify-content:center; font-size: 24px; font-weight: bold; overflow: hidden;">
          ${s.name ? s.name.substring(0, 2).toUpperCase() : "ST"}
        </div>
        <div>
          <h3 style="margin: 0; font-size: 1.25rem;">${s.name}</h3>
          <div style="color: var(--text-muted);">${s.studentId || "No ID"} · ${s.status}</div>
          <div style="margin-top: 0.5rem; display:flex; gap: 0.5rem;">
            <a href="tel:${s.phone}" class="btn btn-primary" style="padding: 0.25rem 0.75rem; font-size: 0.85rem; text-decoration: none;">Call</a>
            <button type="button" class="btn" style="background: #25D366; color: white; border: none; padding: 0.25rem 0.75rem; font-size: 0.85rem;" onclick="window.triggerWhatsAppModal('${s.id}')">WhatsApp</button>
            ${canEdit ? `<button type="button" class="btn btn-secondary" style="padding: 0.25rem 0.75rem; font-size: 0.85rem;" onclick="window.handleConvertToOld('${s.id}', '${s.name}')">Convert to Old</button>` : ""}
            ${canEdit ? `<button type="button" class="btn btn-primary" style="padding: 0.25rem 0.75rem; font-size: 0.85rem;" onclick="window.openRenewalModal('${s.id}')">Renew</button>` : ""}
          </div>
        </div>
      </div>

      <div class="tabs" style="display:flex; gap:1rem; border-bottom: 1px solid var(--border); margin-bottom: 1.5rem;">
        <div class="tab active" style="padding:0.5rem 1rem; border-bottom: 2px solid var(--primary); cursor:pointer;" onclick="window.switchStudentProfileTab('details', this)">Details</div>
        <div class="tab" style="padding:0.5rem 1rem; cursor:pointer;" onclick="window.switchStudentProfileTab('history', this); window.loadRenewalHistory('${s.id}')">Renewal History</div>
      </div>

      <div id="sp-tab-details">
        <form id="edit-student-form" onsubmit="event.preventDefault(); window.submitStudentEdit('${s.id}')">
          <div class="form-grid">
            <div class="form-group">
              <label>Name</label>
              <input type="text" id="edit-name" value="${s.name || ''}" ${!canEdit ? 'disabled' : ''} required />
            </div>
            <div class="form-group">
              <label>Phone</label>
              <input type="tel" id="edit-phone" value="${s.phone || ''}" ${!canEdit ? 'disabled' : ''} required />
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" id="edit-email" value="${s.email || ''}" ${!canEdit ? 'disabled' : ''} />
            </div>
            <div class="form-group">
              <label>Address</label>
              <input type="text" id="edit-address" value="${s.address || ''}" ${!canEdit ? 'disabled' : ''} />
            </div>
            <div class="form-group">
              <label>Emergency Contact</label>
              <input type="tel" id="edit-emergency" value="${s.parentPhone || ''}" ${!canEdit ? 'disabled' : ''} />
            </div>
            
            <div class="form-group" style="grid-column: span 2;">
              <hr style="border: none; border-top: 1px solid var(--border); margin: 1rem 0;" />
            </div>

            <div class="form-group">
              <label>Membership Plan ${isManager ? '(Locked)' : ''}</label>
              <select id="edit-plan" ${!canEdit || readOnlyForManager ? 'disabled' : ''}>
                ${planOptions}
              </select>
            </div>
            <div class="form-group">
              <label>Seat Number ${isManager ? '(Locked)' : ''}</label>
              <input type="text" id="edit-seat" value="${s.seatNumber || ''}" ${!canEdit || readOnlyForManager ? 'disabled' : ''} />
            </div>
            <div class="form-group">
              <label>Status ${isManager ? '(Locked)' : ''}</label>
              <select id="edit-status" ${!canEdit || readOnlyForManager ? 'disabled' : ''}>
                <option value="Active" ${s.status === 'Active' ? 'selected' : ''}>Active</option>
                <option value="Inactive" ${s.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                <option value="Pending" ${s.status === 'Pending' ? 'selected' : ''}>Pending</option>
              </select>
            </div>
          </div>

          <div class="form-actions" style="margin-top: 2rem; justify-content: flex-end; ${hideForEmployee}">
            ${isOwner ? `<button type="button" class="btn btn-ghost" style="color: var(--danger); margin-right: auto;" onclick="window.triggerSoftDelete('${s.id}')">Delete Student</button>` : ''}
            <button type="submit" class="btn btn-primary" id="btn-save-edit">Save Changes</button>
          </div>
        </form>
      </div>

      <div id="sp-tab-history" style="display:none;">
        <div id="sp-renewal-history-container"></div>
      </div>
    </div>
  `;
  modal.showModal();

  if (s.selfieUrl) {
    loadStudentDocuments(s.id).then(docs => {
      if (docs && docs.selfie) {
        const avatarEl = document.getElementById(`sp-avatar-${s.id}`);
        if (avatarEl) {
          avatarEl.innerHTML = `<img src="${docs.selfie}" style="width:100%; height:100%; object-fit:cover;" alt="Photo" />`;
        }
      }
    }).catch(err => console.error("Failed to load selfie", err));
  }
};

window.submitStudentEdit = async (id) => {
  const btn = document.getElementById("btn-save-edit");
  btn.textContent = "Saving...";
  btn.disabled = true;
  try {
    const planEl = document.getElementById("edit-plan");
    const updates = {
      name: document.getElementById("edit-name").value,
      phone: document.getElementById("edit-phone").value,
      email: document.getElementById("edit-email").value,
      address: document.getElementById("edit-address").value,
      parentPhone: document.getElementById("edit-emergency").value,
      // The following are disabled for Managers, so if disabled, they don't change in the DOM but we grab the value anyway (it hasn't changed)
      planId: planEl.value,
      planName: planEl.options[planEl.selectedIndex]?.text || "",
      seatNumber: document.getElementById("edit-seat").value,
      status: document.getElementById("edit-status").value,
    };
    const res = await updateStudentProfile(id, updates);
    if (res.success) {
      window.showToast("Profile updated successfully!", "success");
      window.closeStudentProfile();
    } else {
      window.showToast("Error: " + res.error, "error");
    }
  } catch (e) {
    window.showToast("Error saving profile: " + e.message, "error");
  } finally {
    btn.textContent = "Save Changes";
    btn.disabled = false;
  }
};

window.switchStudentProfileTab = (tab, el) => {
  document.getElementById("sp-tab-details").style.display = tab === "details" ? "block" : "none";
  document.getElementById("sp-tab-history").style.display = tab === "history" ? "block" : "none";
  
  // Update active tab styling
  const tabs = el.parentElement.querySelectorAll(".tab");
  tabs.forEach(t => {
    t.classList.remove("active");
    t.style.borderBottom = "none";
  });
  el.classList.add("active");
  el.style.borderBottom = "2px solid var(--primary)";
};

window.openRenewalModal = (studentId) => {
  const student = allStudents.find(s => s.id === studentId);
  if (!student) return;
  const role = localStorage.getItem("userRole");
  
  const modal = document.getElementById("renewal-modal");
  modal.innerHTML = `
    <div style="padding: 1.5rem; min-width: 400px; max-width: 500px; max-height: 85vh; overflow-y: auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <h2 style="margin: 0;">Renew Membership</h2>
        <button class="btn btn-ghost" onclick="document.getElementById('renewal-modal').close()" style="padding: 0.25rem 0.5rem;">✕</button>
      </div>
      <div id="renewal-modal-body"></div>
    </div>
  `;
  
  window.renderRenewalForm(student, "renewal-modal-body", role);
  modal.showModal();
};

window.loadRenewalHistory = (studentId) => {
  window.renderRenewalHistory(studentId, "sp-renewal-history-container");
};

window.triggerSoftDelete = async (id) => {
  const confirmed = await window.showCustomConfirm("Delete Student", "Are you sure you want to delete this student? They will be moved to Old Students.", "Delete", true);
  if (confirmed) {
    const res = await softDeleteStudent(id);
    if (res.success) {
      window.showToast("Student deleted.", "success");
      window.closeStudentProfile();
    } else {
      window.showToast("Error: " + res.error, "error");
    }
  }
};

window.triggerWhatsAppModal = (id) => {
  const s = allStudents.find(x => x.id === id);
  if (!s) return;
  
  // Normalize data for the whatsapp modal
  const studentData = {
    id: s.id,
    fullName: s.name,
    phone: s.phone,
    seatNumber: s.seatNumber,
    planName: s.planName,
    endDate: s.paymentDueDate
  };

  if (window.openWhatsAppModal) {
    window.openWhatsAppModal(studentData);
  }
};

window.handleConvertToOld = async (id, name) => {
  const reason = await window.showCustomPrompt("Convert to Old Student", `Convert ${name} to Old Student?<br><br>Enter Reason (e.g., Membership Completed, Shifted, Left):`, "Convert");
  if (reason) {
    const res = await convertToOldStudent(id, reason);
    if (res.success) {
      window.showToast(`${name} has been moved to Old Students.`, "success");
      window.closeStudentProfile();
    } else {
      window.showToast("Error: " + res.error, "error");
    }
  }
};
