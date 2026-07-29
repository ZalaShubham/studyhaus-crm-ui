import { listenToExpenseCategories, addExpenseCategory, updateExpenseCategory, toggleExpenseCategory, deleteExpenseCategory } from "./expenseCategoryService.js";
import { listenToExpenses, addExpense, deleteExpense } from "./expenseService.js";
import { exportToCSV, exportToPDF } from "./expenseExportService.js";

let allCategories = [];
let allExpenses = [];
let activeTab = "list"; // "list" or "categories"

export const initExpenseAdminUI = () => {
  const container = document.getElementById("page-expenses");
  if (!container) return;

  const role = localStorage.getItem("userRole");
  if (role === "Student") return;

  const isOwner = role === "Owner/Admin";
  const canEdit = (role === "Owner/Admin" || role === "Manager");

  container.innerHTML = `
    <div class="page-header" style="margin-bottom: 2rem;">
      <div>
        <h1>Expenses</h1>
        <p class="page-subtitle">Track every operational cost.</p>
      </div>
      <div style="display: flex; gap: 0.75rem;">
        <button class="btn btn-ghost" id="btn-export-csv" style="background:var(--bg-card); color:var(--text-primary); border:1px solid var(--border); border-radius:999px; padding:8px 16px; font-weight:500; font-size:13px; display:inline-flex; align-items:center; gap:6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export</button>
        ${canEdit ? `<button class="btn btn-primary" id="btn-add-expense" style="background:var(--primary); color:#fff; border:none; border-radius:999px; padding:8px 16px; font-weight:500; font-size:13px; display:inline-flex; align-items:center; gap:6px;">+ Add expense</button>` : ""}
      </div>
    </div>
    
    <div style="display:grid; grid-template-columns:2fr 1fr 1fr; gap:1rem; margin-bottom:1.5rem;">
      <div class="card" class="card-theme" style="padding:1.5rem; display:flex; justify-content:space-between; align-items:flex-start;">
        <div><div style="font-size:11px; font-weight:700; letter-spacing:0.5px; color:var(--text-muted); margin-bottom:8px; text-transform:uppercase;">Total This Month</div><div style="font-size:24px; font-weight:700; color:var(--text-primary);" id="exp-total-month">₹0</div></div>
        <div style="width:32px; height:32px; background:#e0f2fe; color:#0284c7; border-radius:8px; display:flex; align-items:center; justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg></div>
      </div>
      <div class="card" class="card-theme" style="padding:1.5rem; display:flex; justify-content:space-between; align-items:flex-start;">
        <div><div style="font-size:11px; font-weight:700; letter-spacing:0.5px; color:var(--text-muted); margin-bottom:8px; text-transform:uppercase;">Pending Bills</div><div style="font-size:24px; font-weight:700; color:var(--text-primary);" id="exp-total-pending">₹0</div></div>
      </div>
      <div class="card" class="card-theme" style="padding:1.5rem; display:flex; justify-content:space-between; align-items:flex-start;">
        <div><div style="font-size:11px; font-weight:700; letter-spacing:0.5px; color:var(--text-muted); margin-bottom:8px; text-transform:uppercase;">Recurring</div><div style="font-size:24px; font-weight:700; color:var(--text-primary);" id="exp-recurring">0</div></div>
      </div>
    </div>
    
    <div style="display:flex; gap:1.5rem; align-items:flex-start;">
      
      <div class="card" style="flex:2; padding:1.5rem; background:var(--bg-card); border:1px solid var(--border); border-radius:12px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.02);">
        <h3 style="font-size:15px; font-weight:600; color:var(--text-primary); margin-bottom:1.5rem;">Expense log</h3>
        
        <div style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; text-align:left; font-size:13px; color:var(--text-secondary);">
            <thead>
              <tr style="color:var(--text-muted); font-size:11px; font-weight:700; letter-spacing:0.5px; text-transform:uppercase; border-bottom:1px solid var(--border);">
                <th style="padding:12px 16px; font-weight:700; color:var(--text-primary);">Category</th>
                <th style="padding:12px 16px; font-weight:700;">Vendor</th>
                <th style="padding:12px 16px; font-weight:700;">Bill #</th>
                <th style="padding:12px 16px; font-weight:700; text-align:right;">Amount</th>
                <th style="padding:12px 16px; font-weight:700;">Date</th>
                <th style="padding:12px 16px; font-weight:700; text-align:right;">Status</th>
              </tr>
            </thead>
            <tbody id="expense-tbody">
              <tr><td colspan="6" style="text-align:center; padding: 2rem;">Loading...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card" style="flex:1; padding:1.5rem; background:var(--bg-card); border:1px solid var(--border); border-radius:12px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.02); display:flex; flex-direction:column;">
        <h3 style="font-size:15px; font-weight:600; color:var(--text-primary); margin-bottom:4px;">By category</h3>
        <p style="font-size:13px; color:var(--text-muted); margin-bottom:2.5rem;">This month</p>
        
        <div style="flex:1; display:flex; align-items:center; justify-content:center; margin-bottom:2.5rem;">
          <!-- Simulated Donut Chart using CSS conic-gradient -->
          <div style="width:160px; height:160px; border-radius:50%; background: conic-gradient(#1e3a8a 0% 60%, #0ea5e9 60% 75%, #06b6d4 75% 80%, #eab308 80% 90%, #f43f5e 90% 92%, #64748b 92% 95%, #84cc16 95% 96%, #8b5cf6 96% 100%); display:flex; align-items:center; justify-content:center; position:relative;">
            <div style="width:100px; height:100px; border-radius:50%; background:var(--bg-card);"></div>
            <!-- White slice borders for gap effect -->
            <div style="position:absolute; inset:0; border-radius:50%; background: conic-gradient(transparent 0% 59.5%, white 59.5% 60.5%, transparent 60.5% 74.5%, white 74.5% 75.5%, transparent 75.5% 79.5%, white 79.5% 80.5%, transparent 80.5% 89.5%, white 89.5% 90.5%, transparent 90.5% 91.5%, white 91.5% 92.5%, transparent 92.5% 94.5%, white 94.5% 95.5%, transparent 95.5% 95.8%, white 95.8% 96.2%, transparent 96.2% 100%); pointer-events:none;"></div>
          </div>
        </div>
        
        <div style="display:flex; flex-wrap:wrap; gap:12px; font-size:11px; font-weight:600; color:var(--text-muted);">
          <div style="display:flex; align-items:center; gap:6px;"><div style="width:8px; height:8px; border-radius:50%; background:var(--primary);"></div>Rent</div>
          <div style="display:flex; align-items:center; gap:6px;"><div style="width:8px; height:8px; border-radius:50%; background:#0ea5e9;"></div>Electricity</div>
          <div style="display:flex; align-items:center; gap:6px;"><div style="width:8px; height:8px; border-radius:50%; background:#06b6d4;"></div>Internet</div>
          <div style="display:flex; align-items:center; gap:6px;"><div style="width:8px; height:8px; border-radius:50%; background:#eab308;"></div>Salary</div>
          <div style="display:flex; align-items:center; gap:6px;"><div style="width:8px; height:8px; border-radius:50%; background:#f43f5e;"></div>Cleaning</div>
          <div style="display:flex; align-items:center; gap:6px;"><div style="width:8px; height:8px; border-radius:50%; background:#64748b;"></div>Repairs</div>
          <div style="display:flex; align-items:center; gap:6px;"><div style="width:8px; height:8px; border-radius:50%; background:#84cc16;"></div>Snacks</div>
          <div style="display:flex; align-items:center; gap:6px;"><div style="width:8px; height:8px; border-radius:50%; background:#8b5cf6;"></div>Marketing</div>
        </div>
      </div>
    </div>
  `;

  // Start Listeners
  listenToExpenseCategories(cats => {
    allCategories = cats;
    renderExpenses();
  });

  listenToExpenses(exps => {
    allExpenses = exps;
    renderExpenses();
  });

  if(document.getElementById("btn-export-csv")) {
    document.getElementById("btn-export-csv").addEventListener("click", () => exportToCSV(allExpenses));
  }

  if(document.getElementById("btn-add-expense")) {
    document.getElementById("btn-add-expense").addEventListener("click", async () => {
      const expenseName = prompt("Enter expense name (e.g. Electricity Bill):");
      if (!expenseName) return;
      const amountStr = prompt("Enter amount:");
      if (!amountStr) return;
      const vendor = prompt("Enter vendor name:");
      const statusInput = prompt("Enter status (Paid or Pending):", "Paid");
      const finalStatus = (statusInput && statusInput.trim().toLowerCase() === "pending") ? "Pending" : "Paid";
      
      const expenseData = {
        expenseName,
        categoryId: "general",
        amount: amountStr,
        paymentMethod: "Cash",
        vendor: vendor || "",
        description: "",
        expenseDate: new Date().toISOString().split('T')[0],
        status: finalStatus
      };
      
      const res = await addExpense(expenseData, "General", localStorage.getItem("userName") || "Admin User");
      if (res.success) alert("Expense added successfully!");
      else alert("Failed to add expense: " + res.error);
    });
  }
};

const renderExpenses = () => {
  const tbody = document.getElementById("expense-tbody");
  if (!tbody) return;

  const role = localStorage.getItem("userRole");
  const canEdit = (role === "Owner/Admin" || role === "Manager");

  let totalMonth = 0;
  let totalPending = 0;
  let recurring = 0;

  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  allExpenses.forEach(exp => {
    const amt = parseFloat(exp.amount) || 0;
    const expDate = exp.expenseDate || exp.date; // Fallback
    const d = expDate ? new Date(expDate) : new Date();
    const status = exp.status || "Paid"; // Default to Paid if not set

    if (status === "Pending") {
      totalPending += amt;
    }
    
    if (d.getMonth() === month && d.getFullYear() === year) {
      if (status === "Paid") {
        totalMonth += amt;
      }
    }
    
    // In our mock logic, let's just count Rent/Salary as recurring for visual
    const catName = exp.categoryName || exp.category;
    if (catName === "Rent" || catName === "Salary" || catName === "Internet") {
      recurring++;
    }
  });

  const domTotal = document.getElementById("exp-total-month");
  const domPending = document.getElementById("exp-total-pending");
  const domRecur = document.getElementById("exp-recurring");

  if (domTotal) domTotal.innerText = "₹" + totalMonth.toLocaleString();
  if (domPending) domPending.innerText = "₹" + totalPending.toLocaleString();
  if (domRecur) domRecur.innerText = recurring;

  if (allExpenses.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem; color: var(--text-muted);">No expenses found.</td></tr>`;
    return;
  }

  // Sort descending by date
  allExpenses.sort((a,b) => new Date(b.expenseDate || b.date) - new Date(a.expenseDate || a.date));

  let html = "";
  allExpenses.forEach(r => {
    const status = r.status || "Paid";
    const isPending = status === "Pending";
    const statusText = isPending ? "Pending" : "Paid";
    const statusStyle = isPending 
      ? "background:#fffbeb; color:#d97706; border:1px solid #fde68a;" 
      : "background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0;";

    const catName = r.categoryName || r.category || "General";
    const expName = r.expenseName || r.name || "-";
    const expDate = r.expenseDate || r.date;

    html += `
      <tr style="border-bottom:1px solid #f1f5f9;">
        <td style="padding:16px; font-weight:600; color:#0f172a;">${catName}</td>
        <td style="padding:16px;">${r.vendor || expName}</td>
        <td style="padding:16px;">${r.id.substring(0,6).toUpperCase()}</td>
        <td style="padding:16px; font-weight:600; color:#0f172a; text-align:right;">₹${r.amount}</td>
        <td style="padding:16px;">${expDate ? new Date(expDate).toISOString().split('T')[0] : "-"}</td>
        <td style="padding:16px; text-align:right;">
          <span style="${statusStyle} padding:4px 12px; border-radius:999px; font-size:11px; font-weight:600;">${statusText}</span>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
};
