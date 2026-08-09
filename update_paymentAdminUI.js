const fs = require('fs');

const paymentJsPath = 'services/paymentAdminUI.js';
let paymentJs = fs.readFileSync(paymentJsPath, 'utf8');

const newPaymentInit = `import { listenToAllPayments, approvePayment, rejectPayment } from "./paymentService.js";

let allPayments = [];
let unsubscribe = null;
let currentFilters = { status: "All", search: "" };

export const initPaymentAdminUI = () => {
  const container = document.getElementById("page-payments");
  if (!container) return; 

  const role = localStorage.getItem("userRole");
  if (role === "Student") return; // Security guard

  // Initial UI Setup
  container.innerHTML = \`
    <div class="page-header" style="margin-bottom: 2rem;">
      <div>
        <h1>Payments</h1>
        <p class="page-subtitle" id="payments-subtitle">Collections, invoices, and outstanding dues.</p>
      </div>
      <div style="display: flex; gap: 0.75rem;">
        <button class="btn btn-ghost" style="background:#fff; color:#0f172a; border:1px solid #e2e8f0; border-radius:999px; padding:8px 16px; font-weight:500; font-size:13px; display:inline-flex; align-items:center; gap:6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export</button>
        <button class="btn btn-primary" style="background:#1e3a8a; color:#fff; border:none; border-radius:999px; padding:8px 16px; font-weight:500; font-size:13px; display:inline-flex; align-items:center; gap:6px;">+ Receive payment</button>
      </div>
    </div>
    
    <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:1rem; margin-bottom:1.5rem;">
      <div class="card" style="padding:1.5rem; background:#fff; border:1px solid #e2e8f0; border-radius:12px; display:flex; justify-content:space-between; align-items:flex-start; box-shadow:0 4px 6px -1px rgba(0,0,0,0.02);">
        <div><div style="font-size:11px; font-weight:700; letter-spacing:0.5px; color:#64748b; margin-bottom:8px; text-transform:uppercase;">Today</div><div style="font-size:24px; font-weight:700; color:#0f172a;" id="pay-today">₹0</div></div>
        <div style="width:32px; height:32px; background:#f0fdf4; color:#16a34a; border-radius:8px; display:flex; align-items:center; justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg></div>
      </div>
      <div class="card" style="padding:1.5rem; background:#fff; border:1px solid #e2e8f0; border-radius:12px; display:flex; justify-content:space-between; align-items:flex-start; box-shadow:0 4px 6px -1px rgba(0,0,0,0.02);">
        <div><div style="font-size:11px; font-weight:700; letter-spacing:0.5px; color:#64748b; margin-bottom:8px; text-transform:uppercase;">This Month</div><div style="font-size:24px; font-weight:700; color:#0f172a; margin-bottom:4px;" id="pay-month">₹0</div><div style="font-size:11px; color:#16a34a; font-weight:600; display:flex; align-items:center; gap:2px;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> 8%</div></div>
        <div style="width:32px; height:32px; background:#f1f5f9; color:#475569; border-radius:8px; display:flex; align-items:center; justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
      </div>
      <div class="card" style="padding:1.5rem; background:#fff; border:1px solid #e2e8f0; border-radius:12px; display:flex; justify-content:space-between; align-items:flex-start; box-shadow:0 4px 6px -1px rgba(0,0,0,0.02);">
        <div><div style="font-size:11px; font-weight:700; letter-spacing:0.5px; color:#64748b; margin-bottom:8px; text-transform:uppercase;">Pending</div><div style="font-size:24px; font-weight:700; color:#0f172a; margin-bottom:4px;" id="pay-pending">₹0</div><div style="font-size:11px; color:#94a3b8; font-weight:500;" id="pay-pending-count">0 invoices</div></div>
        <div style="width:32px; height:32px; background:#fffbeb; color:#d97706; border-radius:8px; display:flex; align-items:center; justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
      </div>
      <div class="card" style="padding:1.5rem; background:#fff; border:1px solid #e2e8f0; border-radius:12px; display:flex; justify-content:space-between; align-items:flex-start; box-shadow:0 4px 6px -1px rgba(0,0,0,0.02);">
        <div><div style="font-size:11px; font-weight:700; letter-spacing:0.5px; color:#64748b; margin-bottom:8px; text-transform:uppercase;">Receipts Issued</div><div style="font-size:24px; font-weight:700; color:#0f172a;" id="pay-receipts">0</div></div>
        <div style="width:32px; height:32px; background:#e0f2fe; color:#0284c7; border-radius:8px; display:flex; align-items:center; justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></div>
      </div>
    </div>
    
    <div class="card" style="padding:1.5rem; background:#fff; border:1px solid #e2e8f0; border-radius:12px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.02);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
        <h3 style="font-size:15px; font-weight:600; color:#0f172a;">Recent transactions</h3>
        <div style="display:flex; gap:1rem;">
          <input type="text" id="payment-search" placeholder="Search..." style="padding:6px 12px; border-radius:8px; border: 1px solid var(--border); font-size:13px;" />
          <select id="payment-filter-status" class="pay-filter-select" style="padding:6px 12px; border-radius:8px; border: 1px solid var(--border); font-size:13px;">
            <option value="All">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Paid</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>
      
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; text-align:left; font-size:13px; color:#475569;">
          <thead>
            <tr style="color:#94a3b8; font-size:11px; font-weight:700; letter-spacing:0.5px; text-transform:uppercase; border-bottom:1px solid #e2e8f0;">
              <th style="padding:12px 16px; font-weight:700;">Receipt</th>
              <th style="padding:12px 16px; font-weight:700; color:#0f172a;">Student</th>
              <th style="padding:12px 16px; font-weight:700;">Plan</th>
              <th style="padding:12px 16px; font-weight:700;">Method</th>
              <th style="padding:12px 16px; font-weight:700; text-align:right;">Amount</th>
              <th style="padding:12px 16px; font-weight:700;">Date</th>
              <th style="padding:12px 16px; font-weight:700; text-align:right;">Status</th>
            </tr>
          </thead>
          <tbody id="payment-table-body">
            <tr><td colspan="7" style="text-align:center; padding:2rem;">Loading...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  \`;

  // Filter Listeners
  document.getElementById("payment-search").addEventListener("input", (e) => {
    currentFilters.search = e.target.value.toLowerCase();
    renderPaymentAdminTable();
  });

  document.getElementById("payment-filter-status").addEventListener("change", (e) => {
    currentFilters.status = e.target.value;
    renderPaymentAdminTable();
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
  if (!tbody) return;

  const role = localStorage.getItem("userRole");
  const canApprove = (role === "Owner" || role === "Admin" || role === "Manager");

  // Calculate Metrics
  let todayTotal = 0;
  let monthTotal = 0;
  let pendingTotal = 0;
  let pendingCount = 0;
  let receiptsIssued = 0;

  const now = new Date();
  const todayStr = now.toDateString();
  const month = now.getMonth();
  const year = now.getFullYear();

  allPayments.forEach(p => {
    const amt = parseFloat(p.amount) || 0;
    const d = p.date ? new Date(p.date) : new Date();
    
    if (p.status === "pending") {
      pendingTotal += amt;
      pendingCount++;
    } else if (p.status === "approved") {
      receiptsIssued++;
      if (d.getMonth() === month && d.getFullYear() === year) {
        monthTotal += amt;
      }
      if (d.toDateString() === todayStr) {
        todayTotal += amt;
      }
    }
  });

  const domToday = document.getElementById("pay-today");
  const domMonth = document.getElementById("pay-month");
  const domPending = document.getElementById("pay-pending");
  const domPendingCount = document.getElementById("pay-pending-count");
  const domReceipts = document.getElementById("pay-receipts");
  
  if (domToday) domToday.innerText = "₹" + todayTotal.toLocaleString();
  if (domMonth) domMonth.innerText = "₹" + monthTotal.toLocaleString();
  if (domPending) domPending.innerText = "₹" + pendingTotal.toLocaleString();
  if (domPendingCount) domPendingCount.innerText = pendingCount + " invoices";
  if (domReceipts) domReceipts.innerText = receiptsIssued;

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

  if (filtered.length === 0) {
    tbody.innerHTML = \`<tr><td colspan="7" style="text-align:center; padding:2rem; color: var(--text-muted);">No transactions found.</td></tr>\`;
    return;
  }

  let html = "";
  filtered.forEach(r => {
    const isPending = r.status === "pending";
    const statusText = isPending ? "Pending" : (r.status === "approved" ? "Paid" : "Rejected");
    const statusStyle = isPending 
      ? "background:#fffbeb; color:#d97706; border:1px solid #fde68a;" 
      : (r.status === "approved" ? "background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0;" : "background:#fef2f2; color:#991b1b; border:1px solid #fecaca;");
    
    // Make the row clickable for admins to approve if it's pending.
    const clickAttr = (isPending && canApprove) ? \`onclick="window.handleApprovePayment('\${r.id}')" style="cursor:pointer;" title="Click to Approve"\` : "";

    html += \`
      <tr style="border-bottom:1px solid #f1f5f9;">
        <td style="padding:16px;">\${r.transactionId || "RC-N/A"}</td>
        <td style="padding:16px; font-weight:600; color:#0f172a;">\${r.studentName || "Unknown"}</td>
        <td style="padding:16px;">\${r.planName || "Unknown Plan"}</td>
        <td style="padding:16px;">\${r.paymentMethod || "Cash"}</td>
        <td style="padding:16px; font-weight:600; color:#0f172a; text-align:right;">₹\${r.amount}</td>
        <td style="padding:16px;">\${new Date(r.date).toISOString().split('T')[0]}</td>
        <td style="padding:16px; text-align:right;" \${clickAttr}>
          <span style="\${statusStyle} padding:4px 12px; border-radius:999px; font-size:11px; font-weight:600;">\${statusText}</span>
        </td>
      </tr>
    \`;
  });

  tbody.innerHTML = html;
};
`;

fs.writeFileSync(paymentJsPath, newPaymentInit);
console.log('paymentAdminUI.js updated successfully with imports.');
