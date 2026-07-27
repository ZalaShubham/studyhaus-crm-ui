const fs = require('fs');

let js = fs.readFileSync('services/admissionService.js', 'utf8');

const uiSectionStart = js.indexOf('// UI ORCHESTRATION LOGIC');
if (uiSectionStart === -1) {
  console.error("Could not find UI ORCHESTRATION LOGIC in admissionService.js");
  process.exit(1);
}

const replacement = `// UI ORCHESTRATION LOGIC
// ==========================================

let availablePlansList = [];

export const initAdmissionsUI = async () => {
  const container = document.getElementById("page-admissions");
  if (!container) return; 

  const role = localStorage.getItem("userRole");
  const isStudent = role === "Student";
  const isAdminOrManager = role === "Owner/Admin" || role === "Manager";

  window.approveStudent = async (id) => {
    if (confirm("Approve this admission?")) {
      const res = await approveAdmission(id);
      if (res.success) alert("Admission Approved! Student is now Active.");
      else alert("Error: " + res.error);
    }
  };

  window.rejectStudent = async (id) => {
    const reason = prompt("Enter rejection reason (optional):");
    if (reason !== null) {
      const res = await rejectAdmission(id, reason);
      if (res.success) alert("Admission Rejected.");
      else alert("Error: " + res.error);
    }
  };

  // Setup tabs if admin
  if (isAdminOrManager) {
    const pendingTab = document.getElementById("tab-pending-approval");
    if (pendingTab) pendingTab.style.display = "inline-block";
    
    // Listen to queue
    listenToPendingAdmissions((records) => {
      const tbody = document.getElementById("pending-admissions-body");
      if (!tbody) return;
      if (records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem; color:var(--text-muted);">No pending admissions.</td></tr>';
        return;
      }
      let html = "";
      records.forEach(r => {
        const d = r.createdAt ? new Date(r.createdAt.toMillis()).toLocaleDateString() : "Just now";
        html += \`
          <tr>
            <td>
              <div style="font-weight:600; color:#0f172a;">\${r.name}</div>
              <div style="font-size:11px; color:#94a3b8;">\${r.email || ""}</div>
            </td>
            <td>\${r.phone}</td>
            <td>\${r.planName}</td>
            <td>\${d}</td>
            <td style="text-align:right;">
              <button class="btn btn-sm" onclick="window.approveStudent('\${r.id}')" style="background:#f0fdf4; color:#166534; border:1px solid #bbf7d0; padding:4px 12px; border-radius:999px; margin-right:4px;">Approve</button>
              <button class="btn btn-sm" onclick="window.rejectStudent('\${r.id}')" style="background:#fef2f2; color:#991b1b; border:1px solid #fecaca; padding:4px 12px; border-radius:999px;">Reject</button>
            </td>
          </tr>
        \`;
      });
      tbody.innerHTML = html;
    });
  } else {
    // Hide pending approval tab for students
    const pendingTab = document.getElementById("tab-pending-approval");
    if (pendingTab) pendingTab.style.display = "none";
  }

  // Populate plans dropdown
  const planSelect = document.getElementById("adm-plan");
  if (planSelect) {
    planSelect.innerHTML = "<option value=''>Choose plan</option>";
    try {
      availablePlansList = await fetchPlansForDropdown(isStudent);
      let html = "<option value=''>Choose plan</option>";
      availablePlansList.forEach(p => {
        html += \`<option value="\${p.id}">\${p.planName} - ₹\${p.price}</option>\`;
      });
      planSelect.innerHTML = html;
    } catch (e) {
      planSelect.innerHTML = "<option value=''>Failed to load plans</option>";
    }
  }

  // Populate seats dropdown
  const seatSelect = document.getElementById("adm-seat");
  if (seatSelect) {
    seatSelect.innerHTML = "<option value=''>Loading...</option>";
    try {
      const q = query(collection(db, "seats"), where("status", "==", "Available"));
      const snap = await getDocs(q);
      let availableCount = snap.size;
      let html = \`<option value=''>\${availableCount} available</option>\`;
      snap.forEach(doc => {
        const s = doc.data();
        html += \`<option value="\${s.seatNumber}">\${s.seatNumber}</option>\`;
      });
      seatSelect.innerHTML = html;
    } catch (e) {
      seatSelect.innerHTML = "<option value=''>Failed to load seats</option>";
    }
  }

  // Tab switcher logic
  window.switchAdmissionTab = (tab) => {
    const isNew = tab === 'new';
    
    document.getElementById("view-new-admission").style.display = isNew ? "flex" : "none";
    document.getElementById("view-pending-approval").style.display = isNew ? "none" : "block";
    
    const newBtn = document.getElementById("tab-new-admission");
    const pendBtn = document.getElementById("tab-pending-approval");
    
    if (isNew) {
      newBtn.style.background = "#fff";
      newBtn.style.color = "#0f172a";
      newBtn.style.border = "1px solid #e2e8f0";
      newBtn.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
      
      pendBtn.style.background = "#f1f5f9";
      pendBtn.style.color = "#64748b";
      pendBtn.style.border = "none";
      pendBtn.style.boxShadow = "none";
    } else {
      pendBtn.style.background = "#fff";
      pendBtn.style.color = "#0f172a";
      pendBtn.style.border = "1px solid #e2e8f0";
      pendBtn.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
      
      newBtn.style.background = "#f1f5f9";
      newBtn.style.color = "#64748b";
      newBtn.style.border = "none";
      newBtn.style.boxShadow = "none";
    }
  };

  window.updateSummary = () => {
    const planId = document.getElementById("adm-plan").value;
    if (!planId) {
      document.getElementById("summary-plan").innerText = "—";
      document.getElementById("summary-amount").innerText = "—";
      document.getElementById("summary-start").innerText = "—";
      document.getElementById("summary-ends").innerText = "—";
      return;
    }
    
    const plan = availablePlansList.find(p => p.id === planId);
    if (plan) {
      document.getElementById("summary-plan").innerText = plan.planName;
      document.getElementById("summary-amount").innerText = \`₹\${plan.price}\`;
      
      const today = new Date();
      document.getElementById("summary-start").innerText = today.toLocaleDateString('en-GB'); // dd/mm/yyyy
      
      if (typeof plan.duration === 'number') {
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + plan.duration);
        document.getElementById("summary-ends").innerText = endDate.toLocaleDateString('en-GB');
      } else {
        document.getElementById("summary-ends").innerText = "Custom";
      }
    }
  };

  window.resetAdmission = () => {
    document.getElementById("admission-form").reset();
    window.updateSummary();
  };

  window.submitAdmissionForm = async () => {
    const btn = document.getElementById("btn-submit-admission");
    const originalContent = btn.innerHTML;
    btn.innerHTML = "Submitting...";
    btn.disabled = true;

    try {
      const planEl = document.getElementById("adm-plan");
      const seatEl = document.getElementById("adm-seat");
      
      const planId = planEl.value;
      const plan = availablePlansList.find(p => p.id === planId);

      const data = {
        name: document.getElementById("adm-name").value,
        phone: document.getElementById("adm-phone").value,
        email: document.getElementById("adm-email")?.value || "",
        dob: document.getElementById("adm-dob")?.value || "",
        gender: document.getElementById("adm-gender")?.value || "",
        parentPhone: document.getElementById("adm-parent-phone")?.value || "",
        college: document.getElementById("adm-college")?.value || "",
        course: document.getElementById("adm-course")?.value || "",
        address: document.getElementById("adm-address")?.value || "",
        planId: planId,
        planName: plan ? plan.planName : "",
        seatAssigned: seatEl.value || "",
        paymentMethod: isAdminOrManager ? "Admin Created" : "Pending",
        termsAccepted: true
      };

      const res = await submitAdmission(data, isStudent);
      if (res.success) {
        alert(isStudent ? "Admission request submitted and is Pending Approval!" : "Student successfully admitted as Active!");
        window.resetAdmission();
      } else {
        alert("Error: " + res.error);
      }
    } catch (e) {
      alert("Validation Error: " + e.message);
    } finally {
      btn.innerHTML = originalContent;
      btn.disabled = false;
    }
  };
};
`;

const newJs = js.substring(0, uiSectionStart - 1) + "\n" + replacement;
fs.writeFileSync('services/admissionService.js', newJs);
console.log('admissionService.js updated successfully.');
