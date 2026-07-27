import { collection, addDoc, serverTimestamp, getDocs, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import { validateStudentData } from "./studentValidation.js";
import { approveAdmission, rejectAdmission } from "./approvalService.js";
import { initDocumentUploads, getSelectedDocumentFiles, uploadAdmissionDocuments, setUploadProgress } from "./documentUploadService.js";

/**
 * Fetch available plans for the dropdown.
 * Students only see non-manual plans.
 */
export const fetchPlansForDropdown = async (isStudent) => {
  const plansRef = collection(db, "membershipPlans");
  const q = isStudent ? query(plansRef, where("isManual", "==", false)) : plansRef;
  const snapshot = await getDocs(q);
  
  const plans = [];
  snapshot.forEach(doc => {
    plans.push({ id: doc.id, ...doc.data() });
  });
  return plans;
};

/**
 * Submit an admission form
 * If user is Student -> goes to 'admissions' collection (Pending)
 * If user is Admin -> goes to 'students' collection (Active immediately)
 */
export const submitAdmission = async (formData, isStudent) => {
  try {
    await validateStudentData(formData);
    
    // Add timestamps and role
    formData.createdAt = serverTimestamp();
    formData.updatedAt = serverTimestamp();
    formData.role = "Student"; // Crucial for login routing

    if (isStudent) {
      // Self Registration
      formData.approvalStatus = "Pending";
      formData.status = "Pending";
      await addDoc(collection(db, "admissions"), formData);
    } else {
      // Admin Admission
      formData.approvalStatus = "Approved";
      formData.status = "Active";
      await addDoc(collection(db, "students"), formData);
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Listen to pending admissions for the Admin queue
 */
export const listenToPendingAdmissions = (onUpdate, onError) => {
  const q = query(collection(db, "admissions"), where("status", "==", "Pending"));
  
  return onSnapshot(q, (snapshot) => {
    const list = [];
    snapshot.forEach(doc => {
      list.push({ id: doc.id, ...doc.data() });
    });
    onUpdate(list);
  }, onError);
};

// ==========================================
// UI ORCHESTRATION LOGIC
// ==========================================

export const initAdmissionsUI = async () => {
  const formSection = document.getElementById("admission-step-1");
  if (!formSection) return; // Not on admissions page

  const role = localStorage.getItem("userRole");
  const isStudent = role === "Student";
  const isAdminOrManager = role === "Owner/Admin" || role === "Manager";

  // Attach approval functions globally
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

  // Hide admin queue if not admin/manager
  const adminQueue = document.getElementById("admin-pending-queue");
  if (adminQueue && isAdminOrManager) {
    adminQueue.style.display = "block";
    setupPendingQueueListener();
  }

  // Populate plans dropdown
  const planSelect = document.getElementById("adm-plan");
  if (planSelect) {
    planSelect.innerHTML = "<option value=''>Loading...</option>";
    try {
      const plans = await fetchPlansForDropdown(isStudent);
      let html = "<option value=''>Select a plan...</option>";
      plans.forEach(p => {
        html += `<option value="${p.id}" data-name="${p.planName}">${p.planName} - ₹${p.price}</option>`;
      });
      planSelect.innerHTML = html;
    } catch (e) {
      planSelect.innerHTML = "<option value=''>Failed to load plans</option>";
    }
  }

  // Initialize document upload UI
  initDocumentUploads("doc-upload-section");

  // If Admin, hide QR payment requirement and Terms
  if (isAdminOrManager) {
    const terms = document.getElementById("terms-section");
    const paySection = document.getElementById("student-payment-section");
    if (terms) terms.style.display = "none";
    if (paySection) paySection.style.display = "none";
  }

  // Define global UI functions
  window.nextAdmissionStep = (step) => {
    document.getElementById("admission-step-1").style.display = step === 1 ? "block" : "none";
    document.getElementById("admission-step-2").style.display = step === 2 ? "block" : "none";
    document.getElementById("admission-step-3").style.display = step === 3 ? "block" : "none";
    
    document.getElementById("stepper-1").className = step >= 1 ? "step active" : "step";
    document.getElementById("stepper-2").className = step >= 2 ? "step active" : "step";
    document.getElementById("stepper-3").className = step >= 3 ? "step active" : "step";
  };

  window.togglePaymentOptions = () => {
    const val = document.getElementById("adm-payment-method").value;
    document.getElementById("pay-now-details").style.display = val === "Pay Now" ? "block" : "none";
    document.getElementById("pay-later-details").style.display = val === "Pay Later" ? "block" : "none";
  };

  window.resetAdmission = () => {
    document.getElementById("admission-form").reset();
    window.nextAdmissionStep(1);
    window.togglePaymentOptions();
  };

  window.submitAdmissionForm = async () => {
    const btn = document.getElementById("btn-submit-admission");
    btn.textContent = "Submitting...";
    btn.disabled = true;

    try {
      const planEl = document.getElementById("adm-plan");
      const data = {
        name: document.getElementById("adm-name").value,
        phone: document.getElementById("adm-phone").value,
        email: document.getElementById("adm-email").value,
        dob: document.getElementById("adm-dob").value,
        gender: document.getElementById("adm-gender").value,
        parentPhone: document.getElementById("adm-parent-phone")?.value || "",
        address: document.getElementById("adm-address")?.value || "",
        planId: planEl.value,
        planName: planEl.options[planEl.selectedIndex]?.getAttribute("data-name") || "",
        paymentMethod: isAdminOrManager ? "Admin Created" : document.getElementById("adm-payment-method").value,
        paymentDueDate: document.getElementById("adm-due-date")?.value || "",
        transactionId: document.getElementById("adm-txn-id")?.value || "",
        termsAccepted: isAdminOrManager ? true : document.getElementById("adm-terms").checked
      };

      // Upload documents to Firebase Storage (if any selected)
      const docFiles = getSelectedDocumentFiles();
      const hasFiles = Object.values(docFiles).some(f => f !== null);
      if (hasFiles) {
        btn.textContent = "Uploading docs...";
        const studentId = `${Date.now()}-${data.name.replace(/\s+/g, "-").toLowerCase()}`;
        const docUrls = await uploadAdmissionDocuments(docFiles, studentId, setUploadProgress);
        Object.assign(data, docUrls); // adds aadhaarFrontUrl, aadhaarBackUrl, selfieUrl
        setUploadProgress(0);
        btn.textContent = "Submitting...";
      }

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
      btn.textContent = "Submit Admission";
      btn.disabled = false;
    }
  };
};

// Listen and render Admin pending queue
const setupPendingQueueListener = () => {
  const tbody = document.getElementById("pending-admissions-body");
  if (!tbody) return;

  listenToPendingAdmissions((list) => {
    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--text-muted);">No pending admissions.</td></tr>`;
      return;
    }

    let html = "";
    list.forEach(item => {
      html += `
        <tr>
          <td><div class="name">${item.name}</div><div class="sub-text">${item.email || "No email"}</div></td>
          <td>${item.phone}</td>
          <td>${item.planName}</td>
          <td>${item.createdAt?.toDate?.()?.toLocaleDateString() || "Pending"}</td>
          <td>
            <button class="btn btn-xs" style="background: var(--emerald); color: white; border:none; padding: 0.25rem 0.5rem; cursor: pointer; border-radius: 4px;" onclick="window.approveStudent('${item.id}')">Approve</button>
            <button class="btn btn-xs" style="background: var(--danger); color: white; border:none; padding: 0.25rem 0.5rem; cursor: pointer; border-radius: 4px; margin-left: 0.25rem;" onclick="window.rejectStudent('${item.id}')">Reject</button>
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  }, (err) => {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--danger);">Failed to load.</td></tr>`;
  });
};
