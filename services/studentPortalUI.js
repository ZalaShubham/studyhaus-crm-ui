import { listenToStudentPortalData, updateStudentOwnProfile } from "./studentPortalService.js";
import { listenToMyAttendance, checkIn, checkOut } from "./attendanceService.js";
import { calculateStudyHours } from "./studyHourCalculator.js";
import { generateAttendancePDF } from "./pdfService.js";
import { listenToMyPayments, submitPaymentRequest } from "./paymentService.js";
import { listenToMyComplaints, submitComplaint } from "./complaintService.js";
import { listenToRenewalHistory } from "./renewalService.js";

let currentStudent = null;
let currentAttendance = [];
let currentPayments = [];
let currentComplaints = [];
let currentRenewals = [];
let unsubscribePortal = null;
let unsubscribeAttendance = null;
let unsubscribePayments = null;
let unsubscribeComplaints = null;
let unsubscribeRenewals = null;

export const initStudentPortalUI = () => {
  const portalSection = document.getElementById("page-student-portal");
  if (!portalSection) return;

  const role = localStorage.getItem("userRole");
  if (role !== "Student") return;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  portalSection.classList.add('active');
  portalSection.innerHTML = `<div style="padding: 2rem; text-align: center;">Loading your portal...</div>`;
  document.getElementById("page-student-payments").innerHTML = "";
  document.getElementById("page-student-attendance").innerHTML = "";
  document.getElementById("page-student-complaints").innerHTML = "";
  document.getElementById("page-student-profile").innerHTML = "";

  unsubscribePortal = listenToStudentPortalData(async (studentData) => {
    currentStudent = studentData;
    
    // Listeners
    if (!unsubscribeAttendance) {
      unsubscribeAttendance = listenToMyAttendance(studentData.id, (records) => {
        currentAttendance = records;
        renderPortal();
      });
    }

    if (!unsubscribePayments) {
      unsubscribePayments = listenToMyPayments(studentData.id, (records) => {
        currentPayments = records;
        renderPortal();
      });
    }

    if (!unsubscribeComplaints) {
      unsubscribeComplaints = listenToMyComplaints(studentData.id, (records) => {
        currentComplaints = records;
        renderPortal();
      });
    }

    if (!unsubscribeRenewals) {
      unsubscribeRenewals = listenToRenewalHistory(studentData.id, (records) => {
        currentRenewals = records;
        renderPortal();
      });
    }

    if (unsubscribeAttendance && unsubscribePayments && unsubscribeComplaints && unsubscribeRenewals) {
      renderPortal(); // Initial render if already subscribed
    }
  }, (errorMsg) => {
    portalSection.innerHTML = `<div style="padding: 2rem; color: var(--danger); text-align: center;">${errorMsg}</div>`;
  });

  // Actions
  window.saveStudentPortalProfile = async () => {
    const btn = document.getElementById("btn-portal-save");
    btn.textContent = "Saving...";
    btn.disabled = true;

    const updates = {
      email: document.getElementById("portal-edit-email").value,
      address: document.getElementById("portal-edit-address").value,
      parentPhone: document.getElementById("portal-edit-parent").value
    };

    const res = await updateStudentOwnProfile(currentStudent.id, updates);
    if (res.success) window.showToast("Profile updated!", "success");
    else window.showToast("Failed to update profile: " + res.error, "error");
    
    btn.textContent = "Save Profile Changes";
    btn.disabled = false;
  };

  window.handleCheckIn = async () => {
    let selectedSeat = null;
    const isRotational = (currentStudent.planName || "").toLowerCase().includes("rotational");
    if (isRotational) {
      selectedSeat = await window.showCustomPrompt("Seat Required", "You are on a Rotational Plan.<br>Please enter the Seat Number you are occupying today (e.g., A01):");
      if (!selectedSeat) return; // cancelled
      selectedSeat = selectedSeat.trim().toUpperCase();
    }

    const btn = document.getElementById("btn-checkin");
    btn.textContent = "Processing...";
    btn.disabled = true;
    const res = await checkIn(currentStudent, selectedSeat);
    if (!res.success) window.showToast("Check-In Failed: " + res.error, "error");
    else window.showToast("Checked in successfully!", "success");
    
    if (document.getElementById("btn-checkin")) {
      btn.textContent = "Check-In Now";
      btn.disabled = false;
    }
  };

  window.handleCheckOut = async (attendanceId, checkInTimestamp) => {
    const btn = document.getElementById("btn-checkout");
    btn.textContent = "Processing...";
    btn.disabled = true;
    const res = await checkOut(attendanceId, checkInTimestamp);
    if (!res.success) window.showToast("Check-Out Failed: " + res.error, "error");
  };

  window.handleDownloadPDF = async () => {
    if (!currentStudent || !currentAttendance) return;
    const btn = document.getElementById("btn-pdf");
    const originalText = btn.innerHTML;
    btn.innerHTML = "Generating...";
    btn.disabled = true;
    
    const calculated = calculateStudyHours(currentAttendance);
    const res = await generateAttendancePDF(currentStudent.name, currentAttendance, calculated.totalHours);
    if (!res.success) window.showToast("Failed to generate PDF: " + res.error, "error");

    btn.innerHTML = originalText;
    btn.disabled = false;
  };

  window.calculatePaymentAmount = () => {
    const months = parseInt(document.getElementById("payment-months").value) || 1;
    let basePrice = 0;
    if (currentStudent.planName.toLowerCase().includes("regular")) basePrice = 1000;
    else if (currentStudent.planName.toLowerCase().includes("rotational")) basePrice = 800;
    else if (currentStudent.planName.toLowerCase().includes("night")) basePrice = 700;
    else basePrice = 1000;

    const total = basePrice * months;
    document.getElementById("payment-amount-display").innerText = `₹${total}`;
    document.getElementById("payment-amount").value = total;
  };

  window.handlePaymentSubmit = async () => {
    const btn = document.getElementById("btn-submit-payment");
    const txnId = document.getElementById("payment-txnid").value;
    const months = document.getElementById("payment-months").value;
    const amount = document.getElementById("payment-amount").value;

    if (!txnId) return window.showToast("Please enter the Transaction ID.", "error");

    btn.innerHTML = "Submitting...";
    btn.disabled = true;

    const res = await submitPaymentRequest(currentStudent, txnId, months, amount);
    if (res.success) {
      window.showToast("Payment Request Submitted Successfully!", "success");
      document.getElementById("payment-txnid").value = "";
    } else {
      window.showToast("Failed: " + res.error, "error");
    }

    btn.innerHTML = "Submit Payment Request";
    btn.disabled = false;
  };

  window.handleComplaintSubmit = async () => {
    const btn = document.getElementById("btn-submit-complaint");
    const category = document.getElementById("complaint-category").value;
    const description = document.getElementById("complaint-description").value;

    btn.innerHTML = "Submitting...";
    btn.disabled = true;

    const res = await submitComplaint(currentStudent, category, description);
    if (res.success) {
      window.showToast("Complaint Submitted Successfully!", "success");
      document.getElementById("complaint-category").value = "";
      document.getElementById("complaint-description").value = "";
    } else {
      window.showToast("Failed: " + res.error, "error");
    }

    btn.innerHTML = "Submit Complaint";
    btn.disabled = false;
  };
};

const renderPortal = () => {
  if (!currentStudent || !currentAttendance || !currentPayments || !currentComplaints) return;
  const s = currentStudent;
  const portalSection = document.getElementById("page-student-portal");
  const initials = s.name ? s.name.substring(0, 2).toUpperCase() : "ST";
  const daysRemaining = calculateDaysRemaining(s.paymentDueDate);

  const activeSession = currentAttendance.find(r => r.status === "Active");
  const studyHours = calculateStudyHours(currentAttendance);

  // History HTML Generation...
  let historyHtml = "";
  if (currentAttendance.length === 0) {
    historyHtml = `<tr><td colspan="5" style="text-align:center; color: var(--text-muted);">No attendance records.</td></tr>`;
  } else {
    currentAttendance.slice(0, 5).forEach(r => { 
      const cIn = new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const cOut = r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Active";
      const statusBadge = r.status === "Active" ? `<span class="badge badge-pending">Active</span>` : `<span class="badge badge-paid">Completed</span>`;
      historyHtml += `<tr><td>${r.date}</td><td>${cIn}</td><td>${cOut}</td><td>${r.duration > 0 ? r.duration + 'h' : '-'}</td><td>${statusBadge}</td></tr>`;
    });
  }

  let paymentsHtml = "";
  if (currentPayments.length === 0) {
    paymentsHtml = `<tr><td colspan="5" style="text-align:center; color: var(--text-muted);">No payment history.</td></tr>`;
  } else {
    currentPayments.forEach(p => {
      let badgeClass = "badge-pending";
      if (p.status === "approved") badgeClass = "badge-paid";
      if (p.status === "rejected") badgeClass = "badge-absent";
      paymentsHtml += `<tr><td>${new Date(p.date).toLocaleDateString()}</td><td>${p.renewalPeriod} Mo.</td><td>₹${p.amount}</td><td>${p.transactionId}</td><td><span class="badge ${badgeClass}">${p.status.toUpperCase()}</span></td></tr>`;
    });
  }

  let complaintsHtml = "";
  if (currentComplaints.length === 0) {
    complaintsHtml = `<tr><td colspan="4" style="text-align:center; color: var(--text-muted);">No complaints history.</td></tr>`;
  } else {
    currentComplaints.forEach(c => {
      let badgeClass = "badge-pending";
      if (c.status === "Resolved" || c.status === "Closed") badgeClass = "badge-paid";
      if (c.status === "In Progress") badgeClass = "badge-absent";
      
      const resNote = c.resolutionNote ? `<br><small style="color:var(--text-muted)"><i>Admin: ${c.resolutionNote}</i></small>` : "";
      
      complaintsHtml += `
        <tr>
          <td>${new Date(c.date).toLocaleDateString()}</td>
          <td>${c.category}</td>
          <td>${c.description}${resNote}</td>
          <td><span class="badge ${badgeClass}">${c.status}</span></td>
        </tr>`;
    });
  }

  let renewalsHtml = "";
  if (currentRenewals.length === 0) {
    renewalsHtml = `<tr><td colspan="4" style="text-align:center; color: var(--text-muted);">No renewal history.</td></tr>`;
  } else {
    currentRenewals.forEach(r => {
      const dateStr = r.createdAt ? new Date(r.createdAt.seconds * 1000).toLocaleDateString() : "Just now";
      renewalsHtml += `
        <tr>
          <td>${dateStr}</td>
          <td>${r.newPlan}</td>
          <td style="font-size:0.85rem;">${r.startDate} to ${r.endDate}</td>
          <td class="amount">,${r.amount}</td>
        </tr>
      `;
    });
  }

  let attendanceActionHtml = "";
  if (activeSession) {
    attendanceActionHtml = `<button id="btn-checkout" class="btn btn-primary" style="background: var(--danger); border-color: var(--danger);" onclick="window.handleCheckOut('${activeSession.id}', ${activeSession.checkIn})">Check-Out Now</button>`;
  } else {
    attendanceActionHtml = `<button id="btn-checkin" class="btn btn-primary" onclick="window.handleCheckIn()">Check-In Now</button>`;
  }

  // 1. DASHBOARD PAGE (Overview)
  if (s._isNewUser) {
    // New user -> Show admission form
    portalSection.innerHTML = `
      <div class="page-header" style="margin-bottom: 1.5rem;">
        <div>
          <h1>Complete Your Admission</h1>
          <p class="page-subtitle">Please fill out the admission form to enroll in a plan.</p>
        </div>
      </div>
      <div style="display: flex; gap: 1.5rem; align-items: flex-start;">
        <div class="card" style="flex: 1; padding: 2rem; border-radius: 12px; background: #fff; border: 1px solid #e2e8f0;">
          <form id="admission-form" onsubmit="event.preventDefault(); window.showPaymentModal();">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
              <div class="form-group" style="margin:0;"><label style="font-size: 13px; font-weight: 600; display: block; margin-bottom: 6px;">Full name *</label><input type="text" id="adm-name" required style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;" value="${s.name || ''}" /></div>
              <div class="form-group" style="margin:0;"><label style="font-size: 13px; font-weight: 600; display: block; margin-bottom: 6px;">Mobile *</label><input type="tel" pattern="[0-9]{10}" id="adm-phone" required style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;" value="${s.phone || ''}" /></div>
              <div class="form-group" style="margin:0;"><label style="font-size: 13px; font-weight: 600; display: block; margin-bottom: 6px;">Parent mobile</label><input type="tel" pattern="[0-9]{10}" id="adm-parent-phone" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;" value="${s.parentPhone || ''}" /></div>
              <div class="form-group" style="margin:0;"><label style="font-size: 13px; font-weight: 600; display: block; margin-bottom: 6px;">Email</label><input type="email" id="adm-email" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; background: #f8fafc;" value="${s.email || ''}" readonly /></div>
              <div class="form-group" style="margin:0;"><label style="font-size: 13px; font-weight: 600; display: block; margin-bottom: 6px;">Date of birth</label><input type="date" id="adm-dob" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;" value="${s.dob || ''}" /></div>
              <div class="form-group" style="margin:0;"><label style="font-size: 13px; font-weight: 600; display: block; margin-bottom: 6px;">Gender</label>
                <select id="adm-gender" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff;">
                  <option value="">Select</option><option value="Male" ${s.gender === 'Male' ? 'selected' : ''}>Male</option><option value="Female" ${s.gender === 'Female' ? 'selected' : ''}>Female</option><option value="Other" ${s.gender === 'Other' ? 'selected' : ''}>Other</option>
                </select>
              </div>
              <div class="form-group" style="margin:0;"><label style="font-size: 13px; font-weight: 600; display: block; margin-bottom: 6px;">College / Institute</label><input type="text" id="adm-college" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;" value="${s.college || ''}" /></div>
              <div class="form-group" style="margin:0;"><label style="font-size: 13px; font-weight: 600; display: block; margin-bottom: 6px;">Course</label><input type="text" id="adm-course" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;" value="${s.course || ''}" /></div>
              <div class="form-group" style="grid-column: 1 / -1; margin:0;"><label style="font-size: 13px; font-weight: 600; display: block; margin-bottom: 6px;">Address</label><textarea id="adm-address" rows="2" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">${s.address || ''}</textarea></div>
              <div class="form-group" style="margin:0;"><label style="font-size: 13px; font-weight: 600; display: block; margin-bottom: 6px;">Membership plan *</label>
                <select id="adm-plan" required onchange="window.updateSummary()" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff;">
                  <option value="">Choose plan (Loading...)</option>
                </select>
              </div>
              <div class="form-group" style="margin:0;"><label style="font-size: 13px; font-weight: 600; display: block; margin-bottom: 6px;">Seat (optional)</label>
                <select id="adm-seat" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff;">
                  <option value="">Loading...</option>
                </select>
              </div>
            </div>
          </form>
        </div>
        <div style="width: 280px; position: sticky; top: 1rem; display: flex; flex-direction: column; gap: 1rem;">
          <div class="card" style="padding: 1.5rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: none;">
            <h4 style="font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 0.5px; margin-bottom: 1rem;">SUMMARY</h4>
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #475569; margin-bottom: 12px;"><span>Plan</span><span id="summary-plan" style="color: #0f172a; font-weight: 600;">—</span></div>
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #475569; margin-bottom: 12px;"><span>Amount</span><span id="summary-amount" style="color: #0f172a; font-weight: 600;">—</span></div>
            <div style="height: 1px; background: #e2e8f0; margin: 12px 0;"></div>
            <button class="btn btn-primary" id="btn-submit-admission" onclick="document.getElementById('admission-form').requestSubmit()" style="width: 100%; padding: 12px; font-size: 14px;">Confirm Admission</button>
          </div>
        </div>
      </div>
      
      <!-- Payment Modal -->
      <dialog id="payment-modal" class="card" style="border:none; border-radius:12px; padding:0; box-shadow:0 10px 30px rgba(0,0,0,0.5); background: var(--bg-card); color: var(--text-primary); max-width: 450px; margin: auto;">
        <div style="padding: 1.5rem; border-bottom: 1px solid var(--borderBright); display: flex; justify-content: space-between; align-items: center;">
          <h2 style="font-size: 1.1rem; font-weight: 600; margin: 0;">Payment Options</h2>
          <button onclick="document.getElementById('payment-modal').close()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--text-muted);">&times;</button>
        </div>
        
        <!-- Step 1: Choose Pay Now or Pay Later -->
        <div id="payment-step-1" style="padding: 1.5rem; text-align: center;">
          <p style="margin-bottom: 1.5rem; color: var(--text-secondary); font-size: 0.95rem;">You can pay now to confirm your seat immediately, or pay later at the desk.</p>
          <div style="display: flex; gap: 1rem; justify-content: center;">
            <button class="btn btn-ghost" onclick="window.submitSelfAdmission('Pay Later')" style="flex: 1; border: 1px solid var(--borderBright);">Pay Later</button>
            <button class="btn btn-primary" onclick="window.showPaymentStep2()" style="flex: 1;">Pay Now</button>
          </div>
        </div>

        <!-- Step 2: Pay Now Form -->
        <div id="payment-step-2" style="padding: 1.5rem; display: none;">
          <div style="text-align: center; margin-bottom: 1.5rem;">
            <img src="/payment-qr.jpeg" alt="QR Code" style="width: 180px; height: 180px; object-fit: contain; border: 1px solid var(--border); border-radius: 8px; margin-bottom: 0.5rem;" onerror="this.onerror=null; this.src='https://via.placeholder.com/180?text=QR+Code';" />
            <div style="font-weight: 600; color: var(--text-primary);">Scan to Pay: <span id="payment-modal-amount" style="color: var(--primary);">₹--</span></div>
          </div>
          <div class="form-group">
            <label>Transaction ID *</label>
            <input type="text" id="modal-txnid" required style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;" placeholder="Enter UPI Ref ID" />
          </div>
          <div class="form-group" style="margin-bottom: 1.5rem;">
            <div id="modal-doc-upload-section"></div>
          </div>
          <button class="btn btn-primary" id="btn-modal-paid" onclick="window.submitSelfAdmission('Paid')" style="width: 100%;">Mark as Paid & Submit</button>
        </div>
      </dialog>
    `;
    
    // Hide sidebars since they shouldn't access other pages yet
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    navItems.forEach(item => {
      if (item.getAttribute('data-page') !== 'student-portal') {
        item.style.display = 'none';
      }
    });

    // We must manually trigger initAdmissionsUI logic for dropdowns since we are in the student portal view
    import("./admissionService.js").then(({ fetchPlansForDropdown, submitAdmission }) => {
      window.submitAdmission = submitAdmission;
      fetchPlansForDropdown(true).then(plans => {
        window.availablePlansList = plans;
        const planSelect = document.getElementById("adm-plan");
        if (planSelect) {
          let html = "<option value=''>Choose plan</option>";
          plans.forEach(p => { html += `<option value="${p.id}">${p.planName} - ₹${p.price}</option>`; });
          planSelect.innerHTML = html;
        }
      });
    });

    import("firebase/firestore").then(({ collection, query, where, getDocs }) => {
      import("../firebase/firebase.js").then(({ db }) => {
        const q = query(collection(db, "seats"), where("status", "==", "Available"));
        getDocs(q).then(snap => {
          const seatSelect = document.getElementById("adm-seat");
          if (seatSelect) {
            let html = `<option value=''>${snap.size} available</option>`;
            snap.forEach(doc => { const st = doc.data(); html += `<option value="${st.seatNumber}">${st.seatNumber}</option>`; });
            seatSelect.innerHTML = html;
          }
        });
      });
    });
    
    // Add logic for modal flow
    window.showPaymentModal = () => {
      const modal = document.getElementById("payment-modal");
      document.getElementById("payment-step-1").style.display = "block";
      document.getElementById("payment-step-2").style.display = "none";
      
      const amount = document.getElementById("summary-amount").innerText;
      document.getElementById("payment-modal-amount").innerText = amount;
      
      modal.showModal();
    };

    window.showPaymentStep2 = () => {
      document.getElementById("payment-step-1").style.display = "none";
      document.getElementById("payment-step-2").style.display = "block";
      
      import("./documentUploadService.js").then(({ initDocumentUploads, getSelectedDocumentFiles, uploadAdmissionDocuments }) => {
        window.getSelectedDocumentFiles = getSelectedDocumentFiles;
        window.uploadAdmissionDocuments = uploadAdmissionDocuments;
        initDocumentUploads("modal-doc-upload-section");
        // Hide aadhar uploads, only show selfie but repurposed as screenshot
        setTimeout(() => {
          const d1 = document.getElementById('doc-card-aadhaarFront');
          const d2 = document.getElementById('doc-card-aadhaarBack');
          const d3 = document.getElementById('doc-card-selfie');
          if (d1) d1.style.display = 'none';
          if (d2) d2.style.display = 'none';
          if (d3) {
            d3.style.gridColumn = "1 / -1";
            const lbl = d3.querySelector('div[style*="font-size:12px"]');
            if (lbl) lbl.textContent = "Payment Screenshot (Optional)";
            const icon = d3.querySelector('div[style*="font-size:1.5rem"]');
            if (icon) icon.textContent = "🧾";
          }
        }, 100);
      });
    };

    window.submitSelfAdmission = async (paymentMethod) => {
      let txnId = "";
      let paymentScreenshotUrl = "";
      
      try {
        if (paymentMethod === "Paid") {
          txnId = document.getElementById("modal-txnid").value;
          if (!txnId) return window.showToast("Please enter Transaction ID.", "warning");
          
          // Optional file upload handling
          const btn = document.getElementById("btn-modal-paid");
          btn.innerHTML = "Uploading & Submitting...";
          btn.disabled = true;

          if (window.getSelectedDocumentFiles && window.uploadAdmissionDocuments) {
            const files = window.getSelectedDocumentFiles();
            if (files.selfie) {
               const urlMap = await window.uploadAdmissionDocuments({ selfie: files.selfie }, s.id);
               paymentScreenshotUrl = urlMap.selfieUrl || "";
            }
          }
        } else {
          const btn = document.querySelector("#payment-step-1 button.btn-ghost");
          btn.innerHTML = "Submitting...";
          btn.disabled = true;
        }

        // Collect form data
        const planEl = document.getElementById("adm-plan");
        const seatEl = document.getElementById("adm-seat");
        const planId = planEl.value;
        const plan = (window.availablePlansList || []).find(p => p.id === planId);

        const data = {
          name: document.getElementById("adm-name").value,
          phone: document.getElementById("adm-phone").value,
          email: (document.getElementById("adm-email")?.value || "").trim().toLowerCase(),
          dob: document.getElementById("adm-dob")?.value || "",
          gender: document.getElementById("adm-gender")?.value || "",
          parentPhone: document.getElementById("adm-parent-phone")?.value || "",
          college: document.getElementById("adm-college")?.value || "",
          course: document.getElementById("adm-course")?.value || "",
          address: document.getElementById("adm-address")?.value || "",
          planId: planId,
          planName: plan ? plan.planName : "",
          seatAssigned: seatEl.value || "",
          paymentMethod: paymentMethod,
          transactionId: txnId,
          paymentScreenshotUrl: paymentScreenshotUrl,
          termsAccepted: true
        };
        
        if (paymentMethod === "Pay Later") {
          const d = new Date();
          d.setDate(d.getDate() + 3); // Default 3 days for pay later
          data.paymentDueDate = d.toISOString().split('T')[0];
        }

        if (window.submitAdmission) {
          const res = await window.submitAdmission(data, true);
          if (res.success) {
            if (paymentMethod === "Paid") {
              window.showToast("Payment verified! You are now admitted and will be redirected to your dashboard.", "success");
            } else {
              window.showToast("Admission request submitted successfully and is Pending Approval!", "success");
            }
            document.getElementById("payment-modal").close();
            window.location.reload(); // reload to show pending or active state
          } else {
            window.showToast("Error: " + res.error, "error");
            document.getElementById("payment-modal").close();
            if (paymentMethod === "Paid") {
              const btn = document.getElementById("btn-modal-paid");
              btn.innerHTML = "Mark as Paid & Submit";
              btn.disabled = false;
            } else {
              const btn = document.querySelector("#payment-step-1 button.btn-ghost");
              btn.innerHTML = "Pay Later";
              btn.disabled = false;
            }
          }
        }
      } catch (err) {
        window.showToast("An unexpected error occurred: " + err.message, "error");
        if (paymentMethod === "Paid") {
          const btn = document.getElementById("btn-modal-paid");
          if(btn) { btn.innerHTML = "Mark as Paid & Submit"; btn.disabled = false; }
        } else {
          const btn = document.querySelector("#payment-step-1 button.btn-ghost");
          if(btn) { btn.innerHTML = "Pay Later"; btn.disabled = false; }
        }
      }
    };
    
  } else if (s._isPendingAdmission) {
    // Pending admission state
    portalSection.innerHTML = `
      <div class="page-header" style="margin-bottom: 1.5rem; justify-content: center; text-align: center;">
        <div>
          <h1 style="color: var(--warning);">Admission Pending Approval</h1>
          <p class="page-subtitle" style="margin-top: 0.5rem;">Your admission details have been submitted and are waiting for admin approval. Please check back later or contact the desk.</p>
        </div>
      </div>
      <div style="display: flex; justify-content: center;">
        <div class="card" style="padding: 2rem; max-width: 500px; text-align: center; border-radius: 12px; background: #fff; border: 1px solid #e2e8f0;">
           <div style="font-size: 3rem; margin-bottom: 1rem;">⏳</div>
           <h3 style="margin-bottom: 1rem; color: #0f172a;">What's next?</h3>
           <ul style="text-align: left; color: #475569; font-size: 0.95rem; line-height: 1.5; padding-left: 1.5rem;">
             <li>The admin will verify your details and payment.</li>
             <li>Once approved, you will get access to the portal.</li>
             <li>If you chose "Pay Later", please visit the desk, or pay online below.</li>
           </ul>
           <button class="btn btn-primary" style="margin-top: 1rem; width: 100%;" onclick="window.showPendingPaymentModal()">Pay Now Online</button>
        </div>
      </div>

      <!-- Payment Modal for Pending State -->
      <dialog id="pending-payment-modal" class="card" style="border:none; border-radius:12px; padding:0; box-shadow:0 10px 30px rgba(0,0,0,0.5); background: var(--bg-card); color: var(--text-primary); max-width: 450px; margin: auto;">
        <div style="padding: 1.5rem; border-bottom: 1px solid var(--borderBright); display: flex; justify-content: space-between; align-items: center;">
          <h2 style="font-size: 1.1rem; font-weight: 600; margin: 0;">Pay Now</h2>
          <button onclick="document.getElementById('pending-payment-modal').close()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--text-muted);">&times;</button>
        </div>
        
        <!-- Step 2: Pay Now Form (Directly) -->
        <div id="pending-payment-step-2" style="padding: 1.5rem;">
          <div style="text-align: center; margin-bottom: 1.5rem;">
            <img src="/payment-qr.jpeg" alt="QR Code" style="width: 180px; height: 180px; object-fit: contain; border: 1px solid var(--border); border-radius: 8px; margin-bottom: 0.5rem;" onerror="this.onerror=null; this.src='https://via.placeholder.com/180?text=QR+Code';" />
            <div style="font-weight: 600; color: var(--text-primary);">Scan to Pay</div>
          </div>
          <div class="form-group">
            <label>Transaction ID *</label>
            <input type="text" id="pending-modal-txnid" required style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;" placeholder="Enter UPI Ref ID" />
          </div>
          <div class="form-group" style="margin-bottom: 1.5rem;">
            <div id="pending-modal-doc-upload-section"></div>
          </div>
          <button class="btn btn-primary" id="btn-pending-modal-paid" onclick="window.submitPendingPayment()" style="width: 100%;">Mark as Paid & Submit</button>
        </div>
      </dialog>
    `;

    window.showPendingPaymentModal = () => {
      document.getElementById('pending-payment-modal').showModal();
      import("./documentUploadService.js").then(({ initDocumentUploads, getSelectedDocumentFiles, uploadAdmissionDocuments }) => {
        window.getSelectedDocumentFiles = getSelectedDocumentFiles;
        window.uploadAdmissionDocuments = uploadAdmissionDocuments;
        initDocumentUploads("pending-modal-doc-upload-section");
        setTimeout(() => {
          const d1 = document.getElementById('doc-card-aadhaarFront');
          const d2 = document.getElementById('doc-card-aadhaarBack');
          const d3 = document.getElementById('doc-card-selfie');
          if (d1) d1.style.display = 'none';
          if (d2) d2.style.display = 'none';
          if (d3) {
            d3.style.gridColumn = "1 / -1";
            const lbl = d3.querySelector('div[style*="font-size:12px"]');
            if (lbl) lbl.textContent = "Payment Screenshot (Optional)";
            const icon = d3.querySelector('div[style*="font-size:1.5rem"]');
            if (icon) icon.textContent = "🧾";
          }
        }, 100);
      });
    };

    window.submitPendingPayment = async () => {
        const txnId = document.getElementById("pending-modal-txnid").value;
        if (!txnId) return window.showToast("Please enter Transaction ID.", "warning");
        
        const btn = document.getElementById("btn-pending-modal-paid");
        btn.innerHTML = "Uploading & Submitting...";
        btn.disabled = true;

        let paymentScreenshotUrl = "";
        if (window.getSelectedDocumentFiles && window.uploadAdmissionDocuments) {
          const files = window.getSelectedDocumentFiles();
          if (files.selfie) {
             const urlMap = await window.uploadAdmissionDocuments({ selfie: files.selfie }, s.id);
             paymentScreenshotUrl = urlMap.selfieUrl || "";
          }
        }

        import("./admissionService.js").then(async ({ updateAdmissionPayment }) => {
           const res = await updateAdmissionPayment(s.id, txnId, paymentScreenshotUrl);
           if (res.success) {
               window.showToast("Payment details updated successfully!", "success");
               document.getElementById("pending-payment-modal").close();
               window.location.reload();
           } else {
               window.showToast("Error: " + res.error, "error");
               btn.innerHTML = "Mark as Paid & Submit";
               btn.disabled = false;
           }
        });
    };
    
    // Hide sidebars since they shouldn't access other pages yet
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    navItems.forEach(item => {
      if (item.getAttribute('data-page') !== 'student-portal') {
        item.style.display = 'none';
      }
    });

  } else {
    // Normal active student dashboard
    
    // Restore sidebars for active students
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    navItems.forEach(item => {
      const dp = item.getAttribute('data-page');
      const allowedForStudent = ["student-portal", "student-payments", "student-attendance", "student-complaints", "student-profile", "notifications", "settings"];
      if (allowedForStudent.includes(dp)) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });

    portalSection.innerHTML = `
      <div class="page-header">
        <div>
          <h1>Welcome back, ${s.name}</h1>
          <p class="page-subtitle">Here is your personal study portal.</p>
        </div>
        <div style="display:flex; gap:1rem;">
          ${attendanceActionHtml}
        </div>
      </div>

      <!-- Top Dashboard Metrics -->
      <div class="metrics-grid">
        <div class="metric-card" style="align-items: center;">
          <div class="metric-icon violet" style="border-radius: 50%; font-weight: bold;">${initials}</div>
          <div>
            <div class="metric-label">Membership Plan</div>
            <div class="metric-value" style="font-size: 1.1rem;">${s.planName || 'None'}</div>
          </div>
        </div>
        <div class="metric-card" style="align-items: center;">
          <div class="metric-icon blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg></div>
          <div>
            <div class="metric-label">Seat Number</div>
            <div class="metric-value">${s.seatNumber || 'Unassigned'}</div>
          </div>
        </div>
        <div class="metric-card" style="align-items: center;">
          <div class="metric-icon emerald"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg></div>
          <div>
            <div class="metric-label">Status</div>
            <div class="metric-value">${s.status || 'Pending'}</div>
          </div>
        </div>
        <div class="metric-card" style="align-items: center;">
          <div class="metric-icon amber"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></div>
          <div>
            <div class="metric-label">Days Remaining</div>
            <div class="metric-value" style="color: ${daysRemaining < 5 ? 'var(--danger)' : 'inherit'}">${daysRemaining} Days</div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">Due: ${s.paymentDueDate || 'N/A'}</div>
          </div>
        </div>
      </div>
      
      <div style="margin-top: 2rem;">
        <h3 style="margin-bottom: 1rem;">Quick Links</h3>
        <div class="dashboard-grid">
          <div class="card" style="cursor: pointer; display: flex; align-items: center; gap: 1rem;" onclick="navigate('student-payments')">
            <div class="avatar" style="background: var(--accent-violet);"><svg viewBox="0 0 24 24" width="20" height="20" stroke="white" stroke-width="2" fill="none"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
            <div>
              <h4 style="margin: 0;">Payments & Renewals</h4>
              <div style="font-size: 0.85rem; color: var(--text-muted);">Submit payments and view history</div>
            </div>
          </div>
          <div class="card" style="cursor: pointer; display: flex; align-items: center; gap: 1rem;" onclick="navigate('student-attendance')">
            <div class="avatar" style="background: var(--success);"><svg viewBox="0 0 24 24" width="20" height="20" stroke="white" stroke-width="2" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
            <div>
              <h4 style="margin: 0;">Attendance</h4>
              <div style="font-size: 0.85rem; color: var(--text-muted);">View check-ins and hours</div>
            </div>
          </div>
          <div class="card" style="cursor: pointer; display: flex; align-items: center; gap: 1rem;" onclick="navigate('student-complaints')">
            <div class="avatar" style="background: var(--danger);"><svg viewBox="0 0 24 24" width="20" height="20" stroke="white" stroke-width="2" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
            <div>
              <h4 style="margin: 0;">Complaints</h4>
              <div style="font-size: 0.85rem; color: var(--text-muted);">Report issues and track status</div>
            </div>
          </div>
          <div class="card" style="cursor: pointer; display: flex; align-items: center; gap: 1rem;" onclick="navigate('student-profile')">
            <div class="avatar" style="background: var(--primary);"><svg viewBox="0 0 24 24" width="20" height="20" stroke="white" stroke-width="2" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
            <div>
              <h4 style="margin: 0;">My Profile</h4>
              <div style="font-size: 0.85rem; color: var(--text-muted);">Update personal information</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 2. PAYMENTS PAGE
  document.getElementById("page-student-payments").innerHTML = `
    <div class="page-header">
      <div>
        <h1>Payments & Renewals</h1>
        <p class="page-subtitle">Manage your subscription and view past payments.</p>
      </div>
    </div>
    
    <div class="form-grid" style="margin-top: 1rem;">
      <div style="display: flex; flex-direction: column; gap: 2rem; grid-column: span 2;">
        <!-- Submit Payment Request -->
        <div class="card" style="border-left: 4px solid var(--accent-violet); max-width: 800px;">
          <h3 style="margin-bottom: 1.5rem;">Submit Payment</h3>
          <div style="display:flex; gap: 2rem; align-items:flex-start; flex-wrap: wrap;">
            <div style="width: 160px; height: 160px; background: #fff; border: 1px solid var(--border); border-radius: 8px; display:flex; align-items:center; justify-content:center; overflow: hidden; flex-shrink: 0;">
              <img src="/payment-qr.jpeg" alt="Scan to Pay" style="width: 100%; height: 100%; object-fit: contain;" onerror="this.onerror=null; this.src='https://via.placeholder.com/160?text=QR+Code';" />
            </div>
            <div style="flex:1; min-width: 300px;">
              <form onsubmit="event.preventDefault(); window.handlePaymentSubmit();" class="form-grid" style="gap: 1.5rem;">
                <div class="form-group"><label>Renewal Period</label><select id="payment-months" onchange="window.calculatePaymentAmount()"><option value="1">1 Month</option><option value="2">2 Months</option><option value="3">3 Months</option></select></div>
                <div class="form-group"><label>Amount to Pay</label><div id="payment-amount-display" style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">₹--</div><input type="hidden" id="payment-amount" value="0" /></div>
                <div class="form-group full-width"><label>UPI Transaction ID *</label><input type="text" id="payment-txnid" required /></div>
                <div class="form-group full-width"><button type="submit" id="btn-submit-payment" class="btn btn-primary">Submit Payment Request</button></div>
              </form>
            </div>
          </div>
        </div>

        <div class="card"><h3 style="margin-bottom: 1rem;">Renewal History</h3><table class="data-table"><thead><tr><th>Date</th><th>Plan</th><th>Period</th><th>Amount</th></tr></thead><tbody>${renewalsHtml}</tbody></table></div>
        <div class="card"><h3 style="margin-bottom: 1rem;">My Payments</h3><table class="data-table"><thead><tr><th>Date</th><th>Period</th><th>Amount</th><th>Txn ID</th><th>Status</th></tr></thead><tbody>${paymentsHtml}</tbody></table></div>
      </div>
    </div>
  `;

  // 3. ATTENDANCE PAGE
  document.getElementById("page-student-attendance").innerHTML = `
    <div class="page-header">
      <div>
        <h1>Attendance</h1>
        <p class="page-subtitle">Track your daily study hours.</p>
      </div>
    </div>
    
    <div class="form-grid" style="margin-top: 1rem;">
      <div style="display: flex; flex-direction: column; gap: 2rem; grid-column: span 2;">
        <div class="card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h3 style="margin:0;">Recent Attendance</h3>
            <button id="btn-pdf" class="btn btn-ghost" onclick="window.handleDownloadPDF()">Download PDF</button>
          </div>
          <table class="data-table"><thead><tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Duration</th><th>Status</th></tr></thead><tbody>${historyHtml}</tbody></table>
        </div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 2rem; grid-column: span 1;">
        <div class="card" style="padding: 1.5rem; text-align:center;">
          <h4 style="margin-bottom: 0.5rem; color: var(--text-muted);">Today's Hours</h4>
          <div style="font-size: 1.5rem; font-weight: 600; color: var(--primary);">${studyHours.todayHours}h</div>
        </div>
      </div>
    </div>
  `;

  // 4. COMPLAINTS PAGE
  document.getElementById("page-student-complaints").innerHTML = `
    <div class="page-header">
      <div>
        <h1>Complaints</h1>
        <p class="page-subtitle">Report issues and track their resolution status.</p>
      </div>
    </div>
    
    <div class="form-grid" style="margin-top: 1rem;">
      <div style="display: flex; flex-direction: column; gap: 2rem; grid-column: span 2;">
        <div class="card" style="border-left: 4px solid var(--danger); max-width: 600px;">
          <h3 style="margin-bottom: 1.5rem;">Report an Issue</h3>
          <form onsubmit="event.preventDefault(); window.handleComplaintSubmit();" class="form-grid">
            <div class="form-group full-width">
              <label>Category</label>
              <select id="complaint-category" required>
                <option value="">Select an issue...</option>
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
            </div>
            <div class="form-group full-width">
              <label>Description</label>
              <textarea id="complaint-description" rows="3" style="resize:none;" required placeholder="Describe the issue in detail..."></textarea>
            </div>
            <div class="form-group full-width" style="margin-top: 0.5rem;">
              <button type="submit" id="btn-submit-complaint" class="btn btn-primary">Submit Complaint</button>
            </div>
          </form>
        </div>
        <div class="card"><h3 style="margin-bottom: 1rem;">My Complaints</h3><table class="data-table"><thead><tr><th>Date</th><th>Category</th><th>Details</th><th>Status</th></tr></thead><tbody>${complaintsHtml}</tbody></table></div>
      </div>
    </div>
  `;

  // 5. PROFILE PAGE
  document.getElementById("page-student-profile").innerHTML = `
    <div class="page-header">
      <div>
        <h1>My Profile</h1>
        <p class="page-subtitle">Update your personal information.</p>
      </div>
    </div>
    
    <div class="form-grid" style="margin-top: 1rem;">
      <div style="display: flex; flex-direction: column; gap: 2rem; grid-column: span 2;">
        <!-- Profile Module -->
        <div class="card" style="max-width: 600px;">
          <h3 style="margin-bottom: 1.5rem;">Edit Details</h3>
          <form onsubmit="event.preventDefault(); window.saveStudentPortalProfile();">
            <div class="form-grid">
              <div class="form-group full-width"><label>Email</label><input type="email" id="portal-edit-email" value="${s.email || ''}" /></div>
              <div class="form-group full-width"><label>Parent Contact</label><input type="tel" id="portal-edit-parent" value="${s.parentPhone || ''}" /></div>
              <div class="form-group full-width"><label>Address</label><textarea id="portal-edit-address" rows="2" style="resize:none;">${s.address || ''}</textarea></div>
            </div>
            <div style="margin-top: 1.5rem;">
              <button type="submit" id="btn-portal-save" class="btn btn-primary">Save Profile Changes</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  setTimeout(() => { if (window.calculatePaymentAmount) window.calculatePaymentAmount(); }, 50);
};

const calculateDaysRemaining = (dueDateStr) => {
  if (!dueDateStr) return 0;
  const due = new Date(dueDateStr);
  const now = new Date();
  const diffTime = due - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};
