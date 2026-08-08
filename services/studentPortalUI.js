import { listenToStudentPortalData, updateStudentOwnProfile } from "./studentPortalService.js";
import { listenToMyAttendance, checkIn, checkOut } from "./attendanceService.js";
import { calculateStudyHours } from "./studyHourCalculator.js";
import { generateAttendancePDF } from "./pdfService.js";
import { listenToMyPayments, submitPaymentRequest } from "./paymentService.js";
import { listenToMyComplaints, submitComplaint } from "./complaintService.js";
import { listenToRenewalHistory } from "./renewalService.js";
import { getSettings } from "./settingsService.js";

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
    if (!res.success) window.showToast(window.t ? window.t('Check-In Failed: ') || "Check-In Failed: " : "Check-In Failed: " + res.error, "error");
    else window.showToast(window.t ? window.t('Checked in successfully!') || "Checked in successfully!" : "Checked in successfully!", "success");
    
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
    if (!res.success) {
      window.showToast(window.t ? window.t('Check-Out Failed: ') || "Check-Out Failed: " : "Check-Out Failed: " + res.error, "error");
      if (document.getElementById("btn-checkout")) {
        btn.textContent = "Check-Out Now";
        btn.disabled = false;
      }
    } else {
      window.showToast(window.t ? window.t('Checked out successfully!') || "Checked out successfully!" : "Checked out successfully!", "success");
    }
  };

  window.handleDownloadPDF = async () => {
    if (!currentStudent || !currentAttendance) return;
    const btn = document.getElementById("btn-pdf");
    const originalText = btn.innerHTML;
    btn.innerHTML = "Generating...";
    btn.disabled = true;
    
    const calculated = calculateStudyHours(currentAttendance);
    const res = await generateAttendancePDF(currentStudent.name, currentAttendance, calculated.totalHours);
    if (!res.success) window.showToast(window.t ? window.t('Failed to generate PDF: ') || "Failed to generate PDF: " : "Failed to generate PDF: " + res.error, "error");

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

    let startDate = new Date(); // Fallback to today
    if (currentStudent.paymentDueDate) {
      const parsedDate = new Date(currentStudent.paymentDueDate);
      if (!isNaN(parsedDate.getTime())) {
        startDate = parsedDate;
      }
    }
    
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months);
    document.getElementById("payment-end-date").innerText = endDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  window.handlePaymentSubmit = async () => {
    const btn = document.getElementById("btn-submit-payment");
    const txnId = document.getElementById("payment-txnid").value;
    const months = document.getElementById("payment-months").value;
    const amount = document.getElementById("payment-amount").value;

    if (!txnId) return window.showToast(window.t ? window.t('Please enter the Transaction ID.') || "Please enter the Transaction ID." : "Please enter the Transaction ID.", "error");

    btn.innerHTML = "Submitting...";
    btn.disabled = true;

    const res = await submitPaymentRequest(currentStudent, txnId, months, amount);
    if (res.success) {
      window.showToast(window.t ? window.t('Payment Request Submitted Successfully!') || "Payment Request Submitted Successfully!" : "Payment Request Submitted Successfully!", "success");
      document.getElementById("payment-txnid").value = "";
    } else {
      window.showToast(window.t ? window.t('Failed: ') || "Failed: " : "Failed: " + res.error, "error");
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
      window.showToast(window.t ? window.t('Complaint Submitted Successfully!') || "Complaint Submitted Successfully!" : "Complaint Submitted Successfully!", "success");
      document.getElementById("complaint-category").value = "";
      document.getElementById("complaint-description").value = "";
    } else {
      window.showToast(window.t ? window.t('Failed: ') || "Failed: " : "Failed: " + res.error, "error");
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
    attendanceActionHtml = `<button id="btn-checkout" class="btn" style="background: #ef4444 !important; color: #ffffff !important; border: none; box-shadow: 0 1px 2px rgba(239,68,68,0.2);" onclick="window.handleCheckOut('${activeSession.id}', ${activeSession.checkIn})">Check-Out Now</button>`;
  } else {
    attendanceActionHtml = `<button id="btn-checkin" class="btn" style="background: var(--primary) !important; color: #ffffff !important; border: none;" onclick="window.handleCheckIn()">Check-In Now</button>`;
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
              <div class="form-group" style="margin:0;"><label style="font-size: 13px; font-weight: 600; display: block; margin-bottom: 6px;">Full name <span style="color:#e53e3e;">*</span></label><input type="text" id="adm-name" required style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;" value="${s.name || ''}" /></div>
              <div class="form-group" style="margin:0;"><label style="font-size: 13px; font-weight: 600; display: block; margin-bottom: 6px;">Mobile <span style="color:#e53e3e;">*</span></label><input type="tel" pattern="[0-9]{10}" id="adm-phone" required style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;" value="${s.phone || ''}" /></div>
              <div class="form-group" style="margin:0;"><label style="font-size: 13px; font-weight: 600; display: block; margin-bottom: 6px;">Parent mobile</label><input type="tel" pattern="[0-9]{10}" id="adm-parent-phone" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;" value="${s.parentPhone || ''}" /></div>
              <div class="form-group" style="margin:0;"><label style="font-size: 13px; font-weight: 600; display: block; margin-bottom: 6px;">Email <span style="color:#e53e3e;">*</span></label><input type="email" id="adm-email" required style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; background: #f8fafc;" value="${s.email || ''}" readonly /></div>
              <div class="form-group" style="margin:0;"><label style="font-size: 13px; font-weight: 600; display: block; margin-bottom: 6px;">Date of birth <span style="color:#e53e3e;">*</span></label><input type="date" id="adm-dob" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;" value="${s.dob || ''}" required /></div>
              <div class="form-group" style="margin:0;"><label style="font-size: 13px; font-weight: 600; display: block; margin-bottom: 6px;">Gender <span style="color:#e53e3e;">*</span></label>
                <select id="adm-gender" required style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff;">
                  <option value="">Select</option><option value="Male" ${s.gender === 'Male' ? 'selected' : ''}>Male</option><option value="Female" ${s.gender === 'Female' ? 'selected' : ''}>Female</option><option value="Other" ${s.gender === 'Other' ? 'selected' : ''}>Other</option>
                </select>
              </div>
              <div class="form-group" style="margin:0;"><label style="font-size: 13px; font-weight: 600; display: block; margin-bottom: 6px;">College / Institute</label><input type="text" id="adm-college" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;" value="${s.college || ''}" /></div>
              <div class="form-group" style="margin:0;"><label style="font-size: 13px; font-weight: 600; display: block; margin-bottom: 6px;">Course</label><input type="text" id="adm-course" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;" value="${s.course || ''}" /></div>
              <div class="form-group" style="grid-column: 1 / -1; margin:0;"><label style="font-size: 13px; font-weight: 600; display: block; margin-bottom: 6px;">Address</label><textarea id="adm-address" rows="2" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">${s.address || ''}</textarea></div>
              <div class="form-group" style="margin:0; grid-column: 1 / -1;"><label style="font-size: 13px; font-weight: 600; display: block; margin-bottom: 6px;">Membership plan <span style="color:#e53e3e;">*</span></label>
                <select id="adm-plan" required onchange="window.updateSummary()" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff;">
                  <option value="">Choose plan (Loading...)</option>
                </select>
              </div>
            </div>

            <h3 style="font-size: 15px; margin: 0 0 1rem;">Seat Selection *</h3>
            <div id="seat-selection-section" style="margin-bottom: 2rem; border: 1px solid var(--border-bright); border-radius: 12px; padding: 1rem;"></div>
            <input type="hidden" id="selectedSeatNumber" />
            <input type="hidden" id="selectedSeatId" />
            
            <h3 style="font-size: 15px; margin: 0 0 1rem;">Document Uploads *</h3>
            <div id="doc-upload-section" style="margin-bottom: 1.5rem;"></div>

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
          <button onclick="window.closePaymentModal()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--text-muted);">&times;</button>
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
            <img src="/payment-qr.jpeg" class="payment-qr-img" alt="QR Code" style="width: 180px; height: 180px; object-fit: contain; border: 1px solid var(--border); border-radius: 8px; margin-bottom: 0.5rem;" onerror="this.onerror=null; this.src='https://via.placeholder.com/180?text=QR+Code';" />
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

    import("./seatMapUI.js").then(({ initSeatMapUI }) => {
      initSeatMapUI("signup", "seat-selection-section");
    });
    
    import("./documentUploadService.js").then(({ initDocumentUploads, getSelectedDocumentFiles, uploadAdmissionDocuments }) => {
      window.getSelectedDocumentFiles = getSelectedDocumentFiles;
      window.uploadAdmissionDocuments = uploadAdmissionDocuments;
      initDocumentUploads("doc-upload-section");
    });
    
    // Add logic for modal flow
    window.showPaymentModal = async () => {
      const selectedSeatId = document.getElementById("selectedSeatId")?.value;
      if (!selectedSeatId) {
        return window.showToast(window.t ? window.t('Please select a seat from the Seat Map.') || "Please select a seat from the Seat Map." : "Please select a seat from the Seat Map.", "error");
      }

      if (window.getSelectedDocumentFiles) {
        const files = window.getSelectedDocumentFiles();
        if (!files.aadhaarFront || !files.aadhaarBack || !files.selfie) {
          return window.showToast(window.t ? window.t('Please upload Aadhaar Front, Back, and your Photo.') || "Please upload Aadhaar Front, Back, and your Photo." : "Please upload Aadhaar Front, Back, and your Photo.", "error");
        }
      }

      const btnSubmit = document.getElementById("btn-submit-admission");
      const originalText = btnSubmit.innerHTML;
      btnSubmit.innerHTML = "Reserving Seat...";
      btnSubmit.disabled = true;

      try {
        const { assignSeat } = await import("./seatService.js");
        const studentName = document.getElementById("adm-name").value || "New Student";
        await assignSeat(selectedSeatId, { id: s.id, name: studentName });
      } catch (e) {
        btnSubmit.innerHTML = originalText;
        btnSubmit.disabled = false;
        return window.showToast(window.t ? window.t('Failed to reserve seat: ') || "Failed to reserve seat: " : "Failed to reserve seat: " + e.message, "error");
      }
      
      btnSubmit.innerHTML = originalText;
      btnSubmit.disabled = false;

      const modal = document.getElementById("payment-modal");
      document.getElementById("payment-step-1").style.display = "block";
      document.getElementById("payment-step-2").style.display = "none";
      
      const amount = document.getElementById("summary-amount").innerText;
      document.getElementById("payment-modal-amount").innerText = amount;
      
      modal.showModal();
    };

    window.closePaymentModal = async () => {
      const modal = document.getElementById("payment-modal");
      modal.close();
      const selectedSeatId = document.getElementById("selectedSeatId")?.value;
      if (selectedSeatId) {
        try {
          const { unassignSeat } = await import("./seatService.js");
          await unassignSeat(selectedSeatId);
          window.showToast(window.t ? window.t('Seat reservation released.') || "Seat reservation released." : "Seat reservation released.", "info");
        } catch (e) {
          console.error("Failed to release seat on cancel", e);
        }
      }
    };

    window.showPaymentStep2 = () => {
      document.getElementById("payment-step-1").style.display = "none";
      document.getElementById("payment-step-2").style.display = "block";
    };

    window.submitSelfAdmission = async (paymentMethod) => {
      let txnId = "";
      
      try {
        if (paymentMethod === "Paid") {
          txnId = document.getElementById("modal-txnid").value;
          if (!txnId) return window.showToast(window.t ? window.t('Please enter Transaction ID.') || "Please enter Transaction ID." : "Please enter Transaction ID.", "warning");
          
          const btn = document.getElementById("btn-modal-paid");
          btn.innerHTML = "Uploading & Submitting...";
          btn.disabled = true;
        } else {
          const btn = document.querySelector("#payment-step-1 button.btn-ghost");
          btn.innerHTML = "Submitting...";
          btn.disabled = true;
        }

        // Upload Admission Documents first if present
        let docUrls = {};
        if (window.getSelectedDocumentFiles && window.uploadAdmissionDocuments) {
          const files = window.getSelectedDocumentFiles();
          if (files.aadhaarFront || files.aadhaarBack || files.selfie) {
             docUrls = await window.uploadAdmissionDocuments(files, s.id);
          }
        }

        // Collect form data
        const planEl = document.getElementById("adm-plan");
        const planId = planEl.value;
        const plan = (window.availablePlansList || []).find(p => p.id === planId);
        
        const selectedSeatNumber = document.getElementById("selectedSeatNumber")?.value || "";
        const selectedSeatId = document.getElementById("selectedSeatId")?.value || "";

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
          seatNumber: selectedSeatNumber,
          seatId: selectedSeatId,
          paymentMethod: paymentMethod,
          transactionId: txnId,
          paymentScreenshotUrl: "",
          documents: docUrls,
          loginCredentials: s.loginCredentials || "",
          termsAccepted: true
        };
        
        if (paymentMethod === "Pay Later") {
          const d = new Date();
          d.setDate(d.getDate() + 3);
          data.paymentDueDate = d.toISOString().split('T')[0];
        }

        if (window.submitAdmission) {
          // Note: window.submitAdmission takes (data, isSelfAdmission) as arguments
          // wait, let me check admissionService.js
          const res = await window.submitAdmission(data, true);
          if (res.success) {
            // Upgrade seat status to Occupied
            if (selectedSeatId) {
              try {
                const { changeSeatStatus } = await import("./seatService.js");
                await changeSeatStatus(selectedSeatId, "Occupied");
              } catch(e) {
                console.error("Failed to mark seat as occupied", e);
              }
            }
            if (paymentMethod === "Paid") {
              window.showToast(window.t ? window.t('Payment verified! You are now admitted and will be redirected to your dashboard.') || "Payment verified! You are now admitted and will be redirected to your dashboard." : "Payment verified! You are now admitted and will be redirected to your dashboard.", "success");
            } else {
              window.showToast(window.t ? window.t('Admission request submitted successfully and is Pending Approval!') || "Admission request submitted successfully and is Pending Approval!" : "Admission request submitted successfully and is Pending Approval!", "success");
            }
            document.getElementById("payment-modal").close();
            window.location.reload(); // reload to show pending or active state
          } else {
            window.showToast(window.t ? window.t('Error: ') || "Error: " : "Error: " + res.error, "error");
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
        window.showToast(window.t ? window.t('An unexpected error occurred: ') || "An unexpected error occurred: " : "An unexpected error occurred: " + err.message, "error");
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
            <img src="/payment-qr.jpeg" class="payment-qr-img" alt="QR Code" style="width: 180px; height: 180px; object-fit: contain; border: 1px solid var(--border); border-radius: 8px; margin-bottom: 0.5rem;" onerror="this.onerror=null; this.src='https://via.placeholder.com/180?text=QR+Code';" />
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
        if (!txnId) return window.showToast(window.t ? window.t('Please enter Transaction ID.') || "Please enter Transaction ID." : "Please enter Transaction ID.", "warning");
        
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
               window.showToast(window.t ? window.t('Payment details updated successfully!') || "Payment details updated successfully!" : "Payment details updated successfully!", "success");
               document.getElementById("pending-payment-modal").close();
               window.location.reload();
           } else {
               window.showToast(window.t ? window.t('Error: ') || "Error: " : "Error: " + res.error, "error");
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
      const allowedForStudent = ["student-portal", "student-payments", "student-attendance", "student-complaints", "notifications", "settings"];
      if (allowedForStudent.includes(dp)) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });

    portalSection.innerHTML = `
      <div class="page-header">
        <div>
          <h1 data-i18n="studentPortal.welcome" data-i18n-args='{"name":"${s.name}"}'>${window.t ? window.t('studentPortal.welcome', {name: s.name}) : 'Welcome back, ' + s.name}</h1>
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
            <div class="metric-label" data-i18n="studentPortal.plan">${window.t ? window.t('studentPortal.plan') : 'Membership Plan'}</div>
            <div class="metric-value" style="font-size: 1.1rem;"><span data-i18n="studentPortal.none" style="display:${s.planName ? 'none' : 'inline'}">None</span><span style="display:${s.planName ? 'inline' : 'none'}">${s.planName || ''}</span></div>
          </div>
        </div>
        <div class="metric-card" style="align-items: center;">
          <div class="metric-icon blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg></div>
          <div>
            <div class="metric-label" data-i18n="studentPortal.seatNum">${window.t ? window.t('studentPortal.seatNum') : 'Seat Number'}</div>
            <div class="metric-value"><span data-i18n="studentPortal.unassigned" style="display:${s.seatNumber ? 'none' : 'inline'}">Unassigned</span><span style="display:${s.seatNumber ? 'inline' : 'none'}">${s.seatNumber || ''}</span></div>
          </div>
        </div>
        <div class="metric-card" style="align-items: center;">
          <div class="metric-icon emerald"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg></div>
          <div>
            <div class="metric-label" data-i18n="studentPortal.status">${window.t ? window.t('studentPortal.status') : 'Status'}</div>
            <div class="metric-value"><span data-i18n="studentPortal.pending" style="display:${s.status ? 'none' : 'inline'}">Pending</span><span style="display:${s.status ? 'inline' : 'none'}">${s.status || ''}</span></div>
          </div>
        </div>
        <div class="metric-card" style="align-items: center;">
          <div class="metric-icon amber"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></div>
          <div>
            <div class="metric-label" data-i18n="studentPortal.daysRem">${window.t ? window.t('studentPortal.daysRem') : 'Days Remaining'}</div>
            <div class="metric-value" style="color: ${daysRemaining < 5 ? 'var(--danger)' : 'inherit'}">${daysRemaining} <span data-i18n="studentPortal.days">Days</span></div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;"><span data-i18n="studentPortal.due">Due:</span> ${s.paymentDueDate || 'N/A'}</div>
          </div>
        </div>
      </div>
      
      <div style="margin-top: 2rem;">
        <h3 style="margin-bottom: 1rem;" data-i18n="studentPortal.quickLinks">${window.t ? window.t('studentPortal.quickLinks') : 'Quick Links'}</h3>
        <div class="dashboard-grid">
          <div class="card" style="cursor: pointer; display: flex; align-items: center; gap: 1rem;" onclick="navigate('student-payments')">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: #8b5cf6; display: flex; align-items: center; justify-content: center; flex-shrink: 0;"><svg viewBox="0 0 24 24" width="20" height="20" stroke="white" stroke-width="2" fill="none"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
            <div>
              <h4 style="margin: 0;" data-i18n="studentPortal.paymentsTitle">${window.t ? window.t('studentPortal.paymentsTitle') : 'Payments & Renewals'}</h4>
              <div style="font-size: 0.85rem; color: var(--text-muted);">${window.t ? window.t('studentPortal.paymentsDesc') : 'Submit payments and view history'}</div>
            </div>
          </div>
          <div class="card" style="cursor: pointer; display: flex; align-items: center; gap: 1rem;" onclick="navigate('student-attendance')">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: #10b981; display: flex; align-items: center; justify-content: center; flex-shrink: 0;"><svg viewBox="0 0 24 24" width="20" height="20" stroke="white" stroke-width="2" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
            <div>
              <h4 style="margin: 0;" data-i18n="studentPortal.attendanceTitle">${window.t ? window.t('studentPortal.attendanceTitle') : 'Attendance'}</h4>
              <div style="font-size: 0.85rem; color: var(--text-muted);">${window.t ? window.t('studentPortal.attendanceDesc') : 'View check-ins and hours'}</div>
            </div>
          </div>
          <div class="card" style="cursor: pointer; display: flex; align-items: center; gap: 1rem;" onclick="navigate('student-complaints')">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: #ef4444; display: flex; align-items: center; justify-content: center; flex-shrink: 0;"><svg viewBox="0 0 24 24" width="20" height="20" stroke="white" stroke-width="2" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
            <div>
              <h4 style="margin: 0;" data-i18n="studentPortal.complaintsTitle">${window.t ? window.t('studentPortal.complaintsTitle') : 'Complaints'}</h4>
              <div style="font-size: 0.85rem; color: var(--text-muted);">${window.t ? window.t('studentPortal.complaintsDesc') : 'Report issues and track status'}</div>
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
        <div class="card" style="border: none; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); max-width: 800px; padding: 2rem;">
          <div style="display: flex; align-items: center; margin-bottom: 1.5rem; gap: 0.75rem; color: #0369a1;">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
            <h3 style="margin: 0; font-size: 1.25rem;">Renew Subscription</h3>
          </div>

          <div style="display:flex; gap: 2rem; align-items:flex-start; flex-wrap: wrap;">
            <!-- LEFT SIDE: Form & Details -->
            <div style="flex: 1; min-width: 350px;">
              
              <!-- Student Info Block -->
              <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 1rem; display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                <div class="avatar" style="width: 50px; height: 50px; background: var(--primary); font-size: 1.2rem;">${initials}</div>
                <div>
                  <h4 style="margin: 0; color: #0369a1; font-size: 1.1rem;">${s.name}</h4>
                  <div style="font-size: 0.85rem; color: #0c4a6e; margin-top:2px;">Phone: ${s.phone}</div>
                  <div style="font-size: 0.85rem; color: #0c4a6e;">Seat: ${s.seatNumber || 'Rotational'}</div>
                </div>
              </div>

              <!-- Current Expiry Block -->
              <div style="background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="#64748b" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                <div>
                  <div style="font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase;">Current Subscription Ends</div>
                  <div style="font-size: 1rem; font-weight: 600; color: #334155;">${s.paymentDueDate ? new Date(s.paymentDueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</div>
                </div>
              </div>

              <!-- NEW DATES BLOCK -->
              <div style="margin-bottom: 1.5rem;">
                <label style="font-size: 0.75rem; font-weight: 600; color: #ef4444; text-transform: uppercase; margin-bottom: 0.5rem; display: block;">Dates *</label>
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 1.5rem; display: flex; align-items: center; justify-content: space-between;">
                  <div style="text-align: center; flex:1;">
                    <div style="font-size: 0.75rem; font-weight: 600; color: #16a34a; display: flex; align-items: center; justify-content: center; gap: 6px;"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> START</div>
                    <div style="font-size: 1.1rem; font-weight: 700; color: #15803d; margin-top: 6px;" id="payment-start-date">${s.paymentDueDate ? new Date(s.paymentDueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today'}</div>
                  </div>
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="#86efac" stroke-width="2" fill="none" style="margin: 0 1rem;"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  <div style="text-align: center; flex:1;">
                    <div style="font-size: 0.75rem; font-weight: 600; color: #16a34a; display: flex; align-items: center; justify-content: center; gap: 6px;"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> END</div>
                    <div style="font-size: 1.1rem; font-weight: 700; color: #15803d; margin-top: 6px;" id="payment-end-date">--</div>
                  </div>
                </div>
              </div>

              <form onsubmit="event.preventDefault(); window.handlePaymentSubmit();" class="form-grid" style="gap: 1.5rem;">
                <div class="form-group">
                  <label style="font-size: 0.75rem; font-weight: 600; color: #ef4444; text-transform: uppercase;">Duration *</label>
                  <select id="payment-months" onchange="window.calculatePaymentAmount()" style="width:100%; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1; outline:none; background:#fff;">
                    <option value="1">1 Month</option>
                    <option value="2">2 Months</option>
                    <option value="3">3 Months</option>
                    <option value="6">6 Months</option>
                  </select>
                </div>
                <div class="form-group">
                  <label style="font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase;">Amount (₹)</label>
                  <div id="payment-amount-display" style="font-size: 1.25rem; font-weight: 700; color: #334155; padding: 6px 0;">₹--</div>
                  <input type="hidden" id="payment-amount" value="0" />
                </div>
                <div class="form-group full-width">
                  <label style="font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase;">UPI Transaction ID *</label>
                  <input type="text" id="payment-txnid" required style="width:100%; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1; outline:none;" placeholder="Enter your 12-digit UPI Txn ID" />
                </div>
                <div class="form-group full-width" style="display:flex; gap: 1rem; margin-top: 1rem;">
                  <button type="button" class="btn btn-ghost" style="flex: 1; background: #f1f5f9; color: #475569;" onclick="document.getElementById('payment-txnid').value=''">✕ Cancel</button>
                  <button type="submit" id="btn-submit-payment" class="btn btn-primary" style="flex: 2; background: #22c55e; border-color: #22c55e; color: #fff;">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:8px;"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                    Submit Renewal Request
                  </button>
                </div>
              </form>
            </div>

            <!-- RIGHT SIDE: QR Code -->
            <div style="width: 220px; display:flex; flex-direction: column; align-items:center; gap: 1rem; padding: 1.5rem 1rem; background: #f8fafc; border-radius: 12px; border: 1px dashed #cbd5e1;">
              <h4 style="margin:0; font-size: 0.9rem; color: #475569; text-align:center;">Scan to Pay</h4>
              <div style="width: 160px; height: 160px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; display:flex; align-items:center; justify-content:center; overflow: hidden;">
                <img src="/payment-qr.jpeg" class="payment-qr-img" alt="Scan to Pay" style="width: 100%; height: 100%; object-fit: contain;" onerror="this.onerror=null; this.src='https://via.placeholder.com/160?text=QR+Code';" />
              </div>
              <p style="font-size: 0.75rem; color: #64748b; text-align: center; margin: 0; line-height: 1.4;">Pay using GPay, PhonePe, or Paytm and enter the Txn ID here.</p>
            </div>

          </div>
        </div>


        <div class="card"><h3 style="margin-bottom: 1rem;">Renewal History</h3><table class="data-table"><thead><tr><th data-i18n="table.date">\${window.t ? window.t("table.date") : "Date"}</th><th>Plan</th><th>Period</th><th data-i18n="table.amount">\${window.t ? window.t("table.amount") : "Amount"}</th></tr></thead><tbody>${renewalsHtml}</tbody></table></div>
        <div class="card"><h3 style="margin-bottom: 1rem;">My Payments</h3><table class="data-table"><thead><tr><th data-i18n="table.date">\${window.t ? window.t("table.date") : "Date"}</th><th>Period</th><th data-i18n="table.amount">\${window.t ? window.t("table.amount") : "Amount"}</th><th>Txn ID</th><th data-i18n="table.status">\${window.t ? window.t("table.status") : "Status"}</th></tr></thead><tbody>${paymentsHtml}</tbody></table></div>
      </div>
    </div>
  `;

  // 3. ATTENDANCE PAGE
  attendanceActionHtml = "";
  if (activeSession) {
    attendanceActionHtml = `<button class="btn btn-primary" id="btn-checkout" onclick="window.handleCheckOut('${activeSession.id}', ${activeSession.checkIn})" style="background:#ef4444; border:none; box-shadow:0 1px 2px rgba(239,68,68,0.2);">Check Out</button>`;
  } else {
    attendanceActionHtml = `
      <button class="btn btn-primary" id="btn-checkin" onclick="window.handleCheckIn()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="margin-right:6px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Check In
      </button>
    `;
  }

  document.getElementById("page-student-attendance").innerHTML = `
    <div class="page-header">
      <div>
        <h1>Attendance</h1>
        <p class="page-subtitle">Track your daily study hours.</p>
      </div>
      <div>
        ${attendanceActionHtml}
      </div>
    </div>
    
    <div class="form-grid" style="margin-top: 1rem;">
      <div style="display: flex; flex-direction: column; gap: 2rem; grid-column: span 2;">
        <div class="card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h3 style="margin:0;">Recent Attendance</h3>
            <button id="btn-pdf" class="btn btn-ghost" onclick="window.handleDownloadPDF()">Download PDF</button>
          </div>
          <table class="data-table"><thead><tr><th data-i18n="table.date">\${window.t ? window.t("table.date") : "Date"}</th><th>Check In</th><th>Check Out</th><th>Duration</th><th data-i18n="table.status">\${window.t ? window.t("table.status") : "Status"}</th></tr></thead><tbody>${historyHtml}</tbody></table>
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
        <div class="card"><h3 style="margin-bottom: 1rem;">My Complaints</h3><table class="data-table"><thead><tr><th data-i18n="table.date">\${window.t ? window.t("table.date") : "Date"}</th><th>Category</th><th>Details</th><th data-i18n="table.status">\${window.t ? window.t("table.status") : "Status"}</th></tr></thead><tbody>${complaintsHtml}</tbody></table></div>
      </div>
    </div>
  `;

  // Fetch dynamic QR code
  getSettings().then(settings => {
    if (settings.qrCodeUrl) {
      document.querySelectorAll('.payment-qr-img').forEach(img => {
        img.src = settings.qrCodeUrl;
      });
    }
  });

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
