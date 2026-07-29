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
    if (res.success) alert("Profile updated!");
    else alert("Failed to update profile: " + res.error);
    
    btn.textContent = "Save Profile Changes";
    btn.disabled = false;
  };

  window.handleCheckIn = async () => {
    let selectedSeat = null;
    const isRotational = (currentStudent.planName || "").toLowerCase().includes("rotational");
    if (isRotational) {
      selectedSeat = prompt("You are on a Rotational Plan.\nPlease enter the Seat Number you are occupying today (e.g., A01):");
      if (!selectedSeat) return; // cancelled
      selectedSeat = selectedSeat.trim().toUpperCase();
    }

    const btn = document.getElementById("btn-checkin");
    btn.textContent = "Processing...";
    btn.disabled = true;
    const res = await checkIn(currentStudent, selectedSeat);
    if (!res.success) alert("Check-In Failed: " + res.error);
    else alert("Checked in successfully!");
    
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
    if (!res.success) alert("Check-Out Failed: " + res.error);
  };

  window.handleDownloadPDF = async () => {
    if (!currentStudent || !currentAttendance) return;
    const btn = document.getElementById("btn-pdf");
    const originalText = btn.innerHTML;
    btn.innerHTML = "Generating...";
    btn.disabled = true;
    
    const calculated = calculateStudyHours(currentAttendance);
    const res = await generateAttendancePDF(currentStudent.name, currentAttendance, calculated.totalHours);
    if (!res.success) alert("Failed to generate PDF: " + res.error);

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

    if (!txnId) return alert("Please enter the Transaction ID.");

    btn.innerHTML = "Submitting...";
    btn.disabled = true;

    const res = await submitPaymentRequest(currentStudent, txnId, months, amount);
    if (res.success) {
      alert("Payment Request Submitted Successfully!");
      document.getElementById("payment-txnid").value = "";
    } else {
      alert("Failed: " + res.error);
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
      alert("Complaint Submitted Successfully!");
      document.getElementById("complaint-category").value = "";
      document.getElementById("complaint-description").value = "";
    } else {
      alert("Failed: " + res.error);
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
            <div style="width: 120px; height: 120px; background: #eee; border-radius: 8px; display:flex; align-items:center; justify-content:center; color:#999; font-size:0.8rem; text-align:center;">[QR Placeholder]</div>
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
