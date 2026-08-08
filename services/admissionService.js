import { collection, addDoc, serverTimestamp, getDocs, query, where, onSnapshot, doc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import { validateStudentData } from "./studentValidation.js";
import { approveAdmission, rejectAdmission } from "./approvalService.js";
import { getAuth } from "firebase/auth";

/**
 * Fetch available plans for the dropdown.
 * Students only see non-manual plans.
 */
export const fetchPlansForDropdown = async (isStudent) => {
  const plansRef = collection(db, "membershipPlans");
  // Fetch all plans so student sign up sees everything created in admin
  const q = plansRef;
  const snapshot = await getDocs(q);
  
  const plans = [];
  snapshot.forEach(doc => {
    plans.push({ id: doc.id, ...doc.data() });
  });
  return plans;
};

/**
 * Update payment details for an existing pending admission
 */
export const updateAdmissionPayment = async (admissionId, transactionId, paymentScreenshotUrl) => {
  try {
    const admissionRef = doc(db, "admissions", admissionId);
    const updates = {
      paymentMethod: "Paid",
      transactionId: transactionId,
      updatedAt: serverTimestamp()
    };
    if (paymentScreenshotUrl) {
      updates.paymentScreenshotUrl = paymentScreenshotUrl;
    }
    await updateDoc(admissionRef, updates);
    
    // Auto-approve the student since they have now paid
    const res = await approveAdmission(admissionId);
    if (!res.success) {
       console.error("Auto-approval failed: ", res.error);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
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

    // Check if auto-approval applies for "Paid" student admissions
    const autoApprove = isStudent && formData.paymentMethod === "Paid";

    if (isStudent) {
      const auth = getAuth();
      const uid = auth.currentUser ? auth.currentUser.uid : null;
      if (!uid) throw new Error("Student must be logged in to submit admission");

      if (!autoApprove) {
        // Self Registration (Pay Later)
        formData.approvalStatus = "Pending";
        formData.status = "Pending";
        await setDoc(doc(db, "admissions", uid), formData, { merge: true });
      } else {
        // Auto-Approved Student
        formData.approvalStatus = "Approved";
        formData.status = "Active";
        await setDoc(doc(db, "students", uid), formData, { merge: true });
      }
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

let availablePlansList = [];

export const initAdmissionsUI = async () => {
  const container = document.getElementById("page-admissions");
  if (!container) return; 

  const role = localStorage.getItem("userRole");
  const isStudent = role === "Student";
  const isAdminOrManager = role === "Owner/Admin" || role === "Manager";

  window.approveStudent = async (id) => {
    const confirmed = await window.showCustomConfirm("Approve Admission", "Are you sure you want to approve this student?", "Approve", false);
    if (confirmed) {
      const res = await approveAdmission(id);
      if (res.success) window.showToast("Admission Approved! Student is now Active.", "success");
      else window.showToast("Error: " + res.error, "error");
    }
  };

  window.rejectStudent = async (id) => {
    const reason = await window.showCustomPrompt("Reject Admission", "Please provide a reason for rejection (optional):", "Reject", true);
    if (reason !== null) {
      const res = await rejectAdmission(id, reason);
      if (res.success) window.showToast("Admission Rejected.", "info");
      else window.showToast("Error: " + res.error, "error");
    }
  };

  window.viewPaymentScreenshot = async (studentId) => {
    try {
        const { loadStudentDocuments } = await import("./documentUploadService.js");
        const docs = await loadStudentDocuments(studentId);
        if (docs && docs.selfie) {
            const win = window.open("", "_blank");
            win.document.write('<html><body style="margin:0; display:flex; justify-content:center; align-items:center; background:#111;"><img src="' + docs.selfie + '" style="max-width:100%; max-height:100vh; object-fit:contain;"/></body></html>');
        } else {
            window.showToast("No screenshot found.", "warning");
        }
    } catch (e) {
        window.showToast("Error loading screenshot: " + e.message, "error");
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
        
        let paymentInfo = ``;
        if (r.paymentMethod === "Paid") {
          paymentInfo = `<div style="font-size:11px; color:var(--primary); font-weight:600; margin-top:4px;">Txn ID: ${r.transactionId || 'N/A'}</div>`;
          if (r.paymentScreenshotUrl) {
            paymentInfo += `<button class="btn btn-sm btn-ghost" onclick="window.viewPaymentScreenshot('${r.id}')" style="padding:2px 6px; font-size:10px; margin-top:4px; height:auto; line-height:1.2;">View Screenshot</button>`;
          }
        } else if (r.paymentMethod === "Pay Later") {
          paymentInfo = `<div style="font-size:11px; color:var(--warning); font-weight:600; margin-top:4px;">Pay Later</div>`;
        }
        
        html += `
          <tr>
            <td>
              <div style="font-weight:600; color:#0f172a;">${r.name}</div>
              <div style="font-size:11px; color:#94a3b8;">${r.email || ""}</div>
              ${paymentInfo}
            </td>
            <td>${r.phone}</td>
            <td>${r.planName}</td>
            <td>${d}</td>
            <td style="text-align:right;">
              <button class="btn btn-sm" onclick="window.approveStudent('${r.id}')" style="background:#f0fdf4; color:#166534; border:1px solid #bbf7d0; padding:4px 12px; border-radius:999px; margin-right:4px;">Approve</button>
              <button class="btn btn-sm" onclick="window.rejectStudent('${r.id}')" style="background:#fef2f2; color:#991b1b; border:1px solid #fecaca; padding:4px 12px; border-radius:999px;">Reject</button>
            </td>
          </tr>
        `;
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
        html += `<option value="${p.id}">${p.planName} - ₹${p.price}</option>`;
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
      let validSeats = [];
      snap.forEach(doc => {
        const s = doc.data();
        if (s.seatNumber && String(s.seatNumber).trim() !== "" && String(s.seatNumber) !== "undefined") {
          const seatStr = String(s.seatNumber).trim();
          if (/^[AB]/i.test(seatStr)) {
            validSeats.push(seatStr);
          }
        }
      });
      
      validSeats.sort((a, b) => a.localeCompare(b, undefined, {numeric: true, sensitivity: 'base'}));
      
      let html = `<option value=''>${validSeats.length} available</option>`;
      validSeats.forEach(seat => {
        html += `<option value="${seat}">${seat}</option>`;
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
      document.getElementById("summary-amount").innerText = `₹${plan.price}`;
      
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

  window.submitAdmissionForm = async (overridePaymentMethod = null, txnId = null, dueDate = null) => {
    // If Admin/Manager and no payment method chosen yet, show popup
    if (isAdminOrManager && !overridePaymentMethod) {
      if (!document.getElementById("admission-form").checkValidity()) {
        document.getElementById("admission-form").reportValidity();
        return;
      }
      const planEl = document.getElementById("adm-plan");
      if (!planEl || !planEl.value) {
        if(typeof showToast === 'function') showToast("Please select a plan first.", "warning");
        return;
      }

      window.processAdminPayment = (method) => {
        if (method === 'Paid (Cash)') {
          document.getElementById('admin-payment-modal').remove();
          window.submitAdmissionForm('Paid', null, null);
        } else if (method === 'Paid (UPI)') {
          document.getElementById('admin-payment-step-1').style.display = 'none';
          document.getElementById('admin-payment-step-upi').style.display = 'block';
        } else if (method === 'Pay Later') {
          document.getElementById('admin-payment-step-1').style.display = 'none';
          document.getElementById('admin-payment-step-later').style.display = 'block';
          // Set default due date to 3 days from now
          const d = new Date();
          d.setDate(d.getDate() + 3);
          document.getElementById('admin-due-date').value = d.toISOString().split('T')[0];
        }
      };

      window.finalizeAdminPayment = (method) => {
        let tId = null;
        let dDate = null;
        if (method === 'Paid (UPI)') {
          tId = document.getElementById('admin-txn-id').value;
          if (!tId) {
             if(typeof showToast === 'function') showToast("Transaction ID is required", "warning");
             return;
          }
        } else if (method === 'Pay Later') {
          dDate = document.getElementById('admin-due-date').value;
          if (!dDate) {
             if(typeof showToast === 'function') showToast("Due Date is required", "warning");
             return;
          }
        }
        document.getElementById('admin-payment-modal').remove();
        window.submitAdmissionForm(method === 'Paid (UPI)' ? 'Paid' : 'Pay Later', tId, dDate);
      };

      const amountText = document.getElementById("summary-amount") ? document.getElementById("summary-amount").innerText : "Amount";

      const modalHtml = `
        <dialog id="admin-payment-modal" class="card" style="border:none; border-radius:12px; padding:0; box-shadow:0 10px 30px rgba(0,0,0,0.5); background: var(--bg-card); color: var(--text-primary); max-width: 450px; margin: auto;">
          <div style="padding: 1.5rem; border-bottom: 1px solid var(--borderBright); display: flex; justify-content: space-between; align-items: center;">
            <h2 style="font-size: 1.1rem; font-weight: 600; margin: 0;">Payment Options</h2>
            <button onclick="document.getElementById('admin-payment-modal').remove()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--text-muted);">&times;</button>
          </div>
          
          <div id="admin-payment-step-1" style="padding: 1.5rem; text-align: center;">
            <p style="margin-bottom: 1.5rem; color: var(--text-secondary); font-size: 0.95rem;">How is the student paying the admission fee?</p>
            <div style="display: flex; gap: 1rem; justify-content: center; flex-direction: column;">
              <button type="button" class="btn btn-primary" onclick="window.processAdminPayment('Paid (UPI)')" style="width: 100%; padding: 12px; font-size: 15px;">Paid via UPI</button>
              <button type="button" class="btn btn-primary" onclick="window.processAdminPayment('Paid (Cash)')" style="width: 100%; padding: 12px; font-size: 15px; background: #16a34a; border: none;">Paid via Cash</button>
              <button type="button" class="btn btn-ghost" onclick="window.processAdminPayment('Pay Later')" style="width: 100%; padding: 12px; font-size: 15px; border: 1px solid var(--borderBright);">Pay Later</button>
            </div>
          </div>

          <div id="admin-payment-step-upi" style="display: none; padding: 1.5rem;">
            <div style="text-align: center; margin-bottom: 1.5rem;">
              <img src="/payment-qr.jpeg" class="payment-qr-img" alt="QR Code" style="width: 180px; height: 180px; object-fit: contain; border: 1px solid var(--border); border-radius: 8px; margin-bottom: 0.5rem;" onerror="this.onerror=null; this.src='https://via.placeholder.com/180?text=QR+Code';" />
              <div style="font-weight: 600; color: var(--text-primary);">Scan to Pay: <span style="color: var(--primary);">${amountText}</span></div>
            </div>
            <div class="form-group" style="margin-bottom: 1.5rem;">
              <label>Transaction ID *</label>
              <input type="text" id="admin-txn-id" required style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;" placeholder="Enter UPI Ref ID" />
            </div>
            <button type="button" class="btn btn-primary" onclick="window.finalizeAdminPayment('Paid (UPI)')" style="width: 100%; padding: 12px; font-size: 15px;">Mark as Paid & Submit</button>
          </div>

          <div id="admin-payment-step-later" style="display: none; padding: 1.5rem;">
            <div class="form-group" style="margin-bottom: 1.5rem;">
              <label>Payment Due Date *</label>
              <input type="date" id="admin-due-date" required style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;" />
            </div>
            <button type="button" class="btn btn-primary" onclick="window.finalizeAdminPayment('Pay Later')" style="width: 100%; padding: 12px; font-size: 15px;">Confirm Pay Later</button>
          </div>
        </dialog>
      `;
      const existing = document.getElementById("admin-payment-modal");
      if (existing) existing.remove();
      document.body.insertAdjacentHTML('beforeend', modalHtml);
      document.getElementById("admin-payment-modal").showModal();
      
      // Fetch dynamic QR code
      import("./settingsService.js").then(({ getSettings }) => {
        getSettings().then(settings => {
          if (settings.qrCodeUrl) {
            document.querySelectorAll('.payment-qr-img').forEach(img => {
              img.src = settings.qrCodeUrl;
            });
          }
        });
      });
      return;
    }

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
        remarks: document.getElementById("adm-remarks")?.value || "",
        loginCredentials: (() => {
          const id = document.getElementById("adm-login-id")?.value?.trim() || "";
          const pass = document.getElementById("adm-login-pass")?.value?.trim() || "";
          if (id && pass) return `${id} / ${pass}`;
          if (id) return id;
          if (pass) return pass;
          return "";
        })(),
        planId: planId,
        planName: plan ? plan.planName : "",
        seatAssigned: seatEl.value || "",
        paymentMethod: isAdminOrManager ? (overridePaymentMethod || "Admin Created") : "Pending",
        termsAccepted: true
      };

      if (txnId) data.transactionId = txnId;
      if (dueDate) data.paymentDueDate = dueDate;

      const res = await submitAdmission(data, isStudent);
      if (res.success) {
        if (isStudent) {
            if (data.paymentMethod === "Paid") {
                window.showToast("Payment verified! You are now admitted and will be redirected to your dashboard.", "success");
            } else {
                window.showToast("Admission request submitted and is Pending Approval!", "success");
            }
        } else {
            window.showToast("Student successfully admitted as Active!", "success");
        }
        window.resetAdmission();
      } else {
        window.showToast("Error: " + res.error, "error");
      }
    } catch (e) {
      window.showToast("Validation Error: " + e.message, "error");
    } finally {
      btn.innerHTML = originalContent;
      btn.disabled = false;
    }
  };
};
