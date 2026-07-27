import { listenToAllPayments, approvePayment, rejectPayment } from "./paymentService.js";

let allPayments = [];
let unsubscribe = null;
let currentFilters = { status: "All", search: "" };

export const initPaymentAdminUI = () => {
  const container = document.getElementById("page-payments");
  if (!container) return; 

  const role = localStorage.getItem("userRole");
  if (role === "Student") return; // Security guard

  // Initial UI Setup
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1>Payment Approvals</h1>
        <p class="page-subtitle" id="payments-subtitle">Loading records...</p>
      </div>
    </div>
    
    <div class="card">
      <div class="toolbar">
        <div class="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="payment-search" placeholder="Search by student name or txn ID..." />
        </div>
        <div class="filter-tabs">
          <button class="filter-tab pay-filter active" data-val="All">All</button>
          <button class="filter-tab pay-filter" data-val="pending">Pending</button>
          <button class="filter-tab pay-filter" data-val="approved">Approved</button>
          <button class="filter-tab pay-filter" data-val="rejected">Rejected</button>
        </div>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Student</th>
            <th>Txn ID</th>
            <th>Amount</th>
            <th>Period</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="payment-table-body">
          <tr><td colspan="7" style="text-align:center;">Loading...</td></tr>
        </tbody>
      </table>
    </div>
  `;

  // Filter Listeners
  document.getElementById("payment-search").addEventListener("input", (e) => {
    currentFilters.search = e.target.value.toLowerCase();
    renderPaymentAdminTable();
  });

  document.querySelectorAll(".pay-filter").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".pay-filter").forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      currentFilters.status = e.target.getAttribute("data-val");
      renderPaymentAdminTable();
    });
  });

  // Global Actions for buttons
  window.handleApprovePayment = async (id) => {
    if (!confirm("Are you sure you want to APPROVE this payment? This will update their due date.")) return;
    const approver = localStorage.getItem("userName") || "Admin";
    const res = await approvePayment(id, approver);
    if (!res.success) alert("Error approving payment: " + res.error);
  };

  window.handleRejectPayment = async (id) => {
    const remark = prompt("Please enter a reason for rejection:");
    if (remark === null) return; // cancelled
    const approver = localStorage.getItem("userName") || "Admin";
    const res = await rejectPayment(id, approver, remark);
    if (!res.success) alert("Error rejecting payment: " + res.error);
  };

  // Start Listener
  if (unsubscribe) unsubscribe();
  unsubscribe = listenToAllPayments((records) => {
    allPayments = records;
    renderPaymentAdminTable();
  });
};

const renderPaymentAdminTable = () => {
  const tbody = document.getElementById("payment-table-body");
  const subtitle = document.getElementById("payment-subtitle");
  if (!tbody) return;

  const role = localStorage.getItem("userRole");
  const canApprove = (role === "Owner" || role === "Admin"); // based on requirements

  // Filter Data
  let filtered = allPayments;

  if (currentFilters.status !== "All") {
    filtered = filtered.filter(r => r.status === currentFilters.status);
  }

  if (currentFilters.search.trim() !== "") {
    filtered = filtered.filter(r => {
      const name = (r.studentName || "").toLowerCase();
      const txn = (r.transactionId || "").toLowerCase();
      return name.includes(currentFilters.search) || txn.includes(currentFilters.search);
    });
  }

  // Update Counters
  const pendingCount = allPayments.filter(r => r.status === "pending").length;
  if (subtitle) subtitle.innerHTML = `${allPayments.length} total requests · <span style="color:var(--danger); font-weight:bold;">${pendingCount} pending approvals</span>`;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--text-muted);">No payments found.</td></tr>`;
    return;
  }

  let html = "";
  filtered.forEach(r => {
    let badgeClass = "badge-pending";
    if (r.status === "approved") badgeClass = "badge-paid";
    if (r.status === "rejected") badgeClass = "badge-absent";

    let actionsHtml = `<span style="color:var(--text-muted); font-size:0.8rem;">No actions</span>`;
    
    if (r.status === "pending") {
      if (canApprove) {
        actionsHtml = `
          <button class="btn btn-ghost" style="color: #25D366; padding: 0.2rem 0.5rem;" onclick="window.triggerWhatsAppModal('${r.studentId}')">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:text-bottom"><path d="M22 2L11 13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
          <button class="btn btn-ghost" style="color: var(--success); padding: 0.2rem 0.5rem;" onclick="window.handleApprovePayment('${r.id}')">Approve</button>
          <button class="btn btn-ghost" style="color: var(--danger); padding: 0.2rem 0.5rem;" onclick="window.handleRejectPayment('${r.id}')">Reject</button>
        `;
      } else {
        actionsHtml = `<span style="color:var(--text-muted); font-size:0.8rem;">Needs Owner Approval</span>`;
      }
    } else {
      actionsHtml = `<span style="color:var(--text-muted); font-size:0.8rem;">By: ${r.approvedBy || 'Unknown'}</span>`;
    }
    
    html += `
      <tr>
        <td>${new Date(r.date).toLocaleDateString()}</td>
        <td>
          <div style="font-weight: 500;">${r.studentName || "Unknown"}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${r.planName || "No Plan"}</div>
        </td>
        <td>${r.transactionId}</td>
        <td style="font-weight:600;">₹${r.amount}</td>
        <td>${r.renewalPeriod} Months</td>
        <td><span class="badge ${badgeClass}">${r.status.toUpperCase()}</span></td>
        <td><div style="display:flex; gap:0.5rem; align-items:center;">${actionsHtml}</div></td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
};
