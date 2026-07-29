import fs from 'fs';

let content = fs.readFileSync('services/expenseAdminUI.js', 'utf8');

// The replacement for the container.innerHTML
const newHtml = `
    <!-- Modal for adding expenses -->
    <div id="add-expense-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:50; align-items:center; justify-content:center;">
      <div class="card" style="background:var(--bg-card); padding:2rem; border-radius:12px; width:100%; max-width:400px; box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);">
        <h3 style="font-size:18px; font-weight:600; color:var(--text-primary); margin-bottom:1.5rem;">Add New Expense</h3>
        <form id="form-add-expense">
          <div style="margin-bottom:1rem;">
            <label style="display:block; font-size:13px; font-weight:500; color:var(--text-secondary); margin-bottom:4px;">Expense Name</label>
            <input type="text" id="exp-name" required placeholder="e.g. Electricity Bill" style="width:100%; padding:8px 12px; border:1px solid var(--border); border-radius:6px; background:var(--bg-card); color:var(--text-primary);">
          </div>
          <div style="margin-bottom:1rem;">
            <label style="display:block; font-size:13px; font-weight:500; color:var(--text-secondary); margin-bottom:4px;">Category</label>
            <select id="exp-category" required style="width:100%; padding:8px 12px; border:1px solid var(--border); border-radius:6px; background:var(--bg-card); color:var(--text-primary);">
              <!-- Will be populated dynamically -->
            </select>
          </div>
          <div style="display:flex; gap:1rem; margin-bottom:1rem;">
            <div style="flex:1;">
              <label style="display:block; font-size:13px; font-weight:500; color:var(--text-secondary); margin-bottom:4px;">Amount (₹)</label>
              <input type="number" id="exp-amount" required min="1" style="width:100%; padding:8px 12px; border:1px solid var(--border); border-radius:6px; background:var(--bg-card); color:var(--text-primary);">
            </div>
            <div style="flex:1;">
              <label style="display:block; font-size:13px; font-weight:500; color:var(--text-secondary); margin-bottom:4px;">Date</label>
              <input type="date" id="exp-date" required style="width:100%; padding:8px 12px; border:1px solid var(--border); border-radius:6px; background:var(--bg-card); color:var(--text-primary);">
            </div>
          </div>
          <div style="display:flex; gap:1rem; margin-bottom:1.5rem;">
            <div style="flex:1;">
              <label style="display:block; font-size:13px; font-weight:500; color:var(--text-secondary); margin-bottom:4px;">Payment Method</label>
              <select id="exp-method" required style="width:100%; padding:8px 12px; border:1px solid var(--border); border-radius:6px; background:var(--bg-card); color:var(--text-primary);">
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
            <div style="flex:1;">
              <label style="display:block; font-size:13px; font-weight:500; color:var(--text-secondary); margin-bottom:4px;">Status</label>
              <select id="exp-status" required style="width:100%; padding:8px 12px; border:1px solid var(--border); border-radius:6px; background:var(--bg-card); color:var(--text-primary);">
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>
          <div style="margin-bottom:1.5rem;">
            <label style="display:block; font-size:13px; font-weight:500; color:var(--text-secondary); margin-bottom:4px;">Vendor (Optional)</label>
            <input type="text" id="exp-vendor" placeholder="e.g. State Electricity Board" style="width:100%; padding:8px 12px; border:1px solid var(--border); border-radius:6px; background:var(--bg-card); color:var(--text-primary);">
          </div>
          
          <div style="display:flex; justify-content:flex-end; gap:0.75rem;">
            <button type="button" id="btn-cancel-expense" class="btn btn-ghost" style="padding:8px 16px; border:1px solid var(--border); border-radius:999px; background:transparent; color:var(--text-primary);">Cancel</button>
            <button type="submit" class="btn btn-primary" style="padding:8px 16px; border:none; border-radius:999px; background:var(--primary); color:#fff; font-weight:500;">Save Expense</button>
          </div>
        </form>
      </div>
    </div>

    <div class="page-header" style="margin-bottom: 2rem;">`;

// Find where container.innerHTML starts
const splitStart = content.split('container.innerHTML = `\n    <div class="page-header" style="margin-bottom: 2rem;">');
let newContent = splitStart[0] + 'container.innerHTML = `' + newHtml + splitStart[1];

// Now replace the btn-add-expense listener
const listenerReplacement = `
  const modal = document.getElementById("add-expense-modal");
  
  if(document.getElementById("btn-add-expense")) {
    document.getElementById("btn-add-expense").addEventListener("click", () => {
      // Populate categories dropdown
      const catSelect = document.getElementById("exp-category");
      if (allCategories.length > 0) {
        catSelect.innerHTML = allCategories.map(c => \`<option value="\${c.id}">\${c.name}</option>\`).join("");
      } else {
        catSelect.innerHTML = \`<option value="cat_general">General</option>\`;
      }
      
      // Set default date
      document.getElementById("exp-date").value = new Date().toISOString().split('T')[0];
      
      // Show modal
      modal.style.display = "flex";
    });
  }
  
  if(document.getElementById("btn-cancel-expense")) {
    document.getElementById("btn-cancel-expense").addEventListener("click", () => {
      modal.style.display = "none";
      document.getElementById("form-add-expense").reset();
    });
  }

  const form = document.getElementById("form-add-expense");
  if(form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const expenseName = document.getElementById("exp-name").value;
      const categoryId = document.getElementById("exp-category").value;
      const categoryName = document.getElementById("exp-category").options[document.getElementById("exp-category").selectedIndex].text;
      const amount = document.getElementById("exp-amount").value;
      const expenseDate = document.getElementById("exp-date").value;
      const paymentMethod = document.getElementById("exp-method").value;
      const status = document.getElementById("exp-status").value;
      const vendor = document.getElementById("exp-vendor").value;

      const expenseData = {
        expenseName,
        categoryId,
        amount,
        paymentMethod,
        vendor: vendor || "",
        description: "",
        expenseDate,
        status
      };
      
      const res = await addExpense(expenseData, categoryName, localStorage.getItem("userName") || "Admin User");
      if (res.success) {
        modal.style.display = "none";
        form.reset();
      } else {
        alert("Failed to add expense: " + res.error);
      }
    });
  }
};`;

// Replace from `if(document.getElementById("btn-add-expense")) {` to the end of initExpenseAdminUI
const splitListener = newContent.split('if(document.getElementById("btn-add-expense")) {');
newContent = splitListener[0] + listenerReplacement + '\n\nconst renderExpenses = () => {' + splitListener[1].split('const renderExpenses = () => {')[1];

fs.writeFileSync('services/expenseAdminUI.js', newContent);
console.log('Done rewriting modal logic');
