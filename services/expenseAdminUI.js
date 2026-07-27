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
    <div class="page-header" style="display:flex; justify-content:space-between; align-items:center;">
      <div>
        <h1>Expense Management</h1>
        <p class="page-subtitle">Track and analyze operational expenses</p>
      </div>
      <div class="tabs" style="display:flex; gap:1rem;">
        <button class="btn btn-primary" id="btn-tab-list">Expense List</button>
        ${isOwner ? `<button class="btn btn-secondary" id="btn-tab-cats">Manage Categories</button>` : ""}
      </div>
    </div>

    <!-- EXPENSE LIST TAB -->
    <div id="tab-expense-list" style="display:block;">
      <div class="card" style="margin-bottom: 2rem;">
        <div class="toolbar" style="flex-wrap:wrap; gap:1rem; align-items:flex-end;">
          <div class="search-box">
            <input type="text" id="exp-search" placeholder="Search by name or vendor..." />
          </div>
          <div>
            <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:0.25rem;">Category</label>
            <select id="exp-filter-cat" class="input-field" style="width:150px;">
              <option value="All">All Categories</option>
            </select>
          </div>
          <div>
            <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:0.25rem;">Payment Method</label>
            <select id="exp-filter-method" class="input-field" style="width:150px;">
              <option value="All">All Methods</option>
              <option value="UPI">UPI</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>
          <div>
            <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:0.25rem;">Sort By</label>
            <select id="exp-sort" class="input-field" style="width:150px;">
              <option value="date-desc">Date (Newest)</option>
              <option value="date-asc">Date (Oldest)</option>
              <option value="amount-desc">Amount (High to Low)</option>
              <option value="amount-asc">Amount (Low to High)</option>
            </select>
          </div>
          
          <div style="flex: 1; text-align: right;">
            <button class="btn btn-secondary" id="btn-export-csv">Export CSV / Excel</button>
            <button class="btn btn-secondary" id="btn-export-pdf">Export PDF</button>
            ${canEdit ? `<button class="btn btn-primary" id="btn-add-expense">+ Add Expense</button>` : ""}
          </div>
        </div>
      </div>

      <div class="card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Expense Name</th>
                <th>Category</th>
                <th>Vendor</th>
                <th>Method</th>
                <th>Created By</th>
                <th>Amount</th>
                ${canEdit ? `<th>Actions</th>` : ""}
              </tr>
            </thead>
            <tbody id="expense-tbody">
              <tr><td colspan="8" style="text-align:center;">Loading expenses...</td></tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="6" style="text-align:right; font-weight:bold;">Filtered Total:</td>
                <td colspan="${canEdit ? '2' : '1'}" style="font-weight:bold; font-size:1.1rem; color:var(--danger);" id="expense-total">₹0</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>

    <!-- CATEGORIES TAB -->
    ${isOwner ? `
    <div id="tab-expense-cats" style="display:none;">
      <div class="card" style="margin-bottom: 2rem;">
        <div style="display:flex; gap:1rem; align-items:center;">
          <input type="text" id="new-cat-name" class="input-field" placeholder="New Category Name..." style="max-width:300px;"/>
          <button class="btn btn-primary" id="btn-add-cat">Add Category</button>
        </div>
      </div>
      <div class="card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Category Name</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="cat-tbody"></tbody>
        </table>
      </div>
    </div>
    ` : ""}
  `;

  // Attach Tab Listeners
  document.getElementById("btn-tab-list").addEventListener("click", () => switchTab("list"));
  if (isOwner) document.getElementById("btn-tab-cats").addEventListener("click", () => switchTab("categories"));

  // Attach Filter Listeners
  const renderExps = () => renderExpenses(canEdit);
  document.getElementById("exp-search").addEventListener("input", renderExps);
  document.getElementById("exp-filter-cat").addEventListener("change", renderExps);
  document.getElementById("exp-filter-method").addEventListener("change", renderExps);
  document.getElementById("exp-sort").addEventListener("change", renderExps);

  // Attach Action Listeners
  if (canEdit) {
    document.getElementById("btn-add-expense").addEventListener("click", handleAddExpense);
  }
  document.getElementById("btn-export-csv").addEventListener("click", () => exportToCSV(getFilteredExpenses()));
  document.getElementById("btn-export-pdf").addEventListener("click", () => exportToPDF(getFilteredExpenses()));

  if (isOwner) {
    document.getElementById("btn-add-cat").addEventListener("click", async () => {
      const name = document.getElementById("new-cat-name").value;
      const res = await addExpenseCategory(name);
      if (res.success) document.getElementById("new-cat-name").value = "";
      else alert(res.error);
    });
  }

  // Listeners
  listenToExpenseCategories((cats) => {
    allCategories = cats;
    populateCategoryDropdowns();
    if (isOwner) renderCategories();
  });

  listenToExpenses((exps) => {
    allExpenses = exps;
    renderExps();
  });
};

const switchTab = (tab) => {
  activeTab = tab;
  document.getElementById("tab-expense-list").style.display = tab === "list" ? "block" : "none";
  const catTab = document.getElementById("tab-expense-cats");
  if (catTab) catTab.style.display = tab === "categories" ? "block" : "none";
  
  document.getElementById("btn-tab-list").className = tab === "list" ? "btn btn-primary" : "btn btn-secondary";
  const catBtn = document.getElementById("btn-tab-cats");
  if (catBtn) catBtn.className = tab === "categories" ? "btn btn-primary" : "btn btn-secondary";
};

const populateCategoryDropdowns = () => {
  const filterSelect = document.getElementById("exp-filter-cat");
  if (!filterSelect) return;
  const currentVal = filterSelect.value;
  
  let html = `<option value="All">All Categories</option>`;
  allCategories.forEach(c => {
    html += `<option value="${c.id}">${c.name}</option>`;
  });
  filterSelect.innerHTML = html;
  filterSelect.value = currentVal;
};

const getFilteredExpenses = () => {
  let filtered = [...allExpenses];
  const search = document.getElementById("exp-search").value.toLowerCase();
  const cat = document.getElementById("exp-filter-cat").value;
  const method = document.getElementById("exp-filter-method").value;
  const sort = document.getElementById("exp-sort").value;

  if (search) {
    filtered = filtered.filter(e => 
      e.expenseName.toLowerCase().includes(search) || 
      (e.vendor && e.vendor.toLowerCase().includes(search))
    );
  }
  if (cat !== "All") filtered = filtered.filter(e => e.categoryId === cat);
  if (method !== "All") filtered = filtered.filter(e => e.paymentMethod === method);

  if (sort === "amount-desc") filtered.sort((a, b) => b.amount - a.amount);
  else if (sort === "amount-asc") filtered.sort((a, b) => a.amount - b.amount);
  else if (sort === "date-asc") filtered.sort((a, b) => new Date(a.expenseDate) - new Date(b.expenseDate));
  // date-desc is default handled by service

  return filtered;
};

const renderExpenses = (canEdit) => {
  const tbody = document.getElementById("expense-tbody");
  if (!tbody) return;

  const filtered = getFilteredExpenses();
  let total = 0;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${canEdit ? '8' : '7'}" style="text-align:center;">No expenses found.</td></tr>`;
    document.getElementById("expense-total").innerText = `₹0`;
    return;
  }

  window.handleDeleteExpense = async (id) => {
    if (confirm("Delete this expense?")) {
      const res = await deleteExpense(id);
      if (!res.success) alert(res.error);
    }
  };

  let html = "";
  filtered.forEach(exp => {
    total += Number(exp.amount);
    html += `
      <tr>
        <td>${exp.expenseDate}</td>
        <td style="font-weight:600;">${exp.expenseName}</td>
        <td><span class="badge" style="background:#e5e7eb; color:#374151;">${exp.categoryName}</span></td>
        <td>${exp.vendor || "-"}</td>
        <td>${exp.paymentMethod}</td>
        <td style="font-size:0.8rem; color:var(--text-muted);">${exp.createdBy}</td>
        <td style="font-weight:bold; color:var(--danger);">₹${exp.amount}</td>
        ${canEdit ? `
        <td>
          <button class="btn btn-secondary" style="padding:0.25rem 0.5rem; font-size:0.75rem;" onclick="window.handleDeleteExpense('${exp.id}')">Delete</button>
        </td>
        ` : ""}
      </tr>
    `;
  });

  tbody.innerHTML = html;
  document.getElementById("expense-total").innerText = `₹${total}`;
};

const renderCategories = () => {
  const tbody = document.getElementById("cat-tbody");
  if (!tbody) return;

  if (allCategories.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">No categories found.</td></tr>`;
    return;
  }

  window.handleToggleCat = async (id, status) => { await toggleExpenseCategory(id, status); };
  window.handleDeleteCat = async (id) => { if(confirm("Delete category?")) await deleteExpenseCategory(id); };
  window.handleEditCat = async (id) => { 
    const newName = prompt("Enter new name:");
    if(newName) await updateExpenseCategory(id, newName);
  };

  let html = "";
  allCategories.forEach(c => {
    html += `
      <tr>
        <td style="font-weight:600;">${c.name}</td>
        <td>
          <span class="badge ${c.enabled ? 'badge-paid' : 'badge-absent'}">${c.enabled ? 'Enabled' : 'Disabled'}</span>
        </td>
        <td>
          <button class="btn btn-secondary" style="padding:0.25rem 0.5rem; font-size:0.75rem;" onclick="window.handleToggleCat('${c.id}', ${c.enabled})">${c.enabled ? 'Disable' : 'Enable'}</button>
          <button class="btn btn-secondary" style="padding:0.25rem 0.5rem; font-size:0.75rem;" onclick="window.handleEditCat('${c.id}')">Edit</button>
          <button class="btn btn-secondary" style="padding:0.25rem 0.5rem; font-size:0.75rem; color:var(--danger);" onclick="window.handleDeleteCat('${c.id}')">Delete</button>
        </td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
};

// --- ADD EXPENSE MODAL / PROMPTS ---
const handleAddExpense = async () => {
  const enabledCats = allCategories.filter(c => c.enabled);
  if (enabledCats.length === 0) {
    return alert("No expense categories enabled. Admin must create one first.");
  }

  let catPromptStr = "Select Category Number:\n";
  enabledCats.forEach((c, i) => catPromptStr += `${i + 1}. ${c.name}\n`);
  
  const catIdxStr = prompt(catPromptStr);
  if (!catIdxStr) return;
  const catIdx = parseInt(catIdxStr) - 1;
  if (isNaN(catIdx) || catIdx < 0 || catIdx >= enabledCats.length) return alert("Invalid category selection.");
  
  const category = enabledCats[catIdx];

  const expenseName = prompt("Enter Expense Name/Title (e.g., Internet Bill):");
  if (!expenseName) return;

  const amount = prompt("Enter Amount (₹):");
  if (!amount || isNaN(amount)) return alert("Invalid amount.");

  const paymentMethod = prompt("Enter Payment Method (UPI, Cash, Cheque):", "UPI");
  if (!paymentMethod) return;

  const vendor = prompt("Enter Vendor Name (Optional):") || "";
  const description = prompt("Enter Description (Optional):") || "";
  
  // Default to today
  const d = new Date();
  const defaultDate = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const expenseDate = prompt("Enter Date (YYYY-MM-DD):", defaultDate);
  if (!expenseDate) return;

  const author = localStorage.getItem("userName") || "Admin";

  const expData = {
    expenseName,
    categoryId: category.id,
    amount,
    paymentMethod,
    vendor,
    description,
    expenseDate
  };

  const res = await addExpense(expData, category.name, author);
  if (!res.success) {
    alert("Failed to add expense: " + res.error);
  } else {
    alert("Expense added successfully.");
  }
};
