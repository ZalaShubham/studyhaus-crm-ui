const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

const paymentsStart = html.indexOf('<!-- Payments Page -->');
const staffStart = html.indexOf('<!-- Staff Page -->');

if (paymentsStart === -1 || staffStart === -1) {
  console.error("Could not find bounds of Payments/Expenses pages in index.html");
  process.exit(1);
}

const replacement = `<!-- Payments Page -->
        <div class="page" id="page-payments">
          <div class="page-header" style="margin-bottom: 2rem;">
            <div>
              <h1>Payments</h1>
              <p class="page-subtitle">Collections, invoices, and outstanding dues.</p>
            </div>
            <div style="display: flex; gap: 0.75rem;">
              <button class="btn btn-ghost" style="background:#fff; color:#0f172a; border:1px solid #e2e8f0; border-radius:999px; padding:8px 16px; font-weight:500; font-size:13px; display:inline-flex; align-items:center; gap:6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export</button>
              <button class="btn btn-primary" style="background:#1e3a8a; color:#fff; border:none; border-radius:999px; padding:8px 16px; font-weight:500; font-size:13px; display:inline-flex; align-items:center; gap:6px;">+ Receive payment</button>
            </div>
          </div>
          
          <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:1rem; margin-bottom:1.5rem;">
            <div class="card" style="padding:1.5rem; background:#fff; border:1px solid #e2e8f0; border-radius:12px; display:flex; justify-content:space-between; align-items:flex-start; box-shadow:0 4px 6px -1px rgba(0,0,0,0.02);">
              <div><div style="font-size:11px; font-weight:700; letter-spacing:0.5px; color:#64748b; margin-bottom:8px; text-transform:uppercase;">Today</div><div style="font-size:24px; font-weight:700; color:#0f172a;">₹12,400</div></div>
              <div style="width:32px; height:32px; background:#f0fdf4; color:#16a34a; border-radius:8px; display:flex; align-items:center; justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg></div>
            </div>
            <div class="card" style="padding:1.5rem; background:#fff; border:1px solid #e2e8f0; border-radius:12px; display:flex; justify-content:space-between; align-items:flex-start; box-shadow:0 4px 6px -1px rgba(0,0,0,0.02);">
              <div><div style="font-size:11px; font-weight:700; letter-spacing:0.5px; color:#64748b; margin-bottom:8px; text-transform:uppercase;">This Month</div><div style="font-size:24px; font-weight:700; color:#0f172a; margin-bottom:4px;">₹71,000</div><div style="font-size:11px; color:#16a34a; font-weight:600; display:flex; align-items:center; gap:2px;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> 8%</div></div>
              <div style="width:32px; height:32px; background:#f1f5f9; color:#475569; border-radius:8px; display:flex; align-items:center; justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
            </div>
            <div class="card" style="padding:1.5rem; background:#fff; border:1px solid #e2e8f0; border-radius:12px; display:flex; justify-content:space-between; align-items:flex-start; box-shadow:0 4px 6px -1px rgba(0,0,0,0.02);">
              <div><div style="font-size:11px; font-weight:700; letter-spacing:0.5px; color:#64748b; margin-bottom:8px; text-transform:uppercase;">Pending</div><div style="font-size:24px; font-weight:700; color:#0f172a; margin-bottom:4px;">₹14,500</div><div style="font-size:11px; color:#94a3b8; font-weight:500;">6 invoices</div></div>
              <div style="width:32px; height:32px; background:#fffbeb; color:#d97706; border-radius:8px; display:flex; align-items:center; justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
            </div>
            <div class="card" style="padding:1.5rem; background:#fff; border:1px solid #e2e8f0; border-radius:12px; display:flex; justify-content:space-between; align-items:flex-start; box-shadow:0 4px 6px -1px rgba(0,0,0,0.02);">
              <div><div style="font-size:11px; font-weight:700; letter-spacing:0.5px; color:#64748b; margin-bottom:8px; text-transform:uppercase;">Receipts Issued</div><div style="font-size:24px; font-weight:700; color:#0f172a;">30</div></div>
              <div style="width:32px; height:32px; background:#e0f2fe; color:#0284c7; border-radius:8px; display:flex; align-items:center; justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></div>
            </div>
          </div>
          
          <div class="card" style="padding:1.5rem; background:#fff; border:1px solid #e2e8f0; border-radius:12px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.02);">
            <h3 style="font-size:15px; font-weight:600; color:#0f172a; margin-bottom:1.5rem;">Recent transactions</h3>
            
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
                <tbody>
                  <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:16px;">RC-24000</td><td style="padding:16px; font-weight:600; color:#0f172a;">Vihaan Verma</td><td style="padding:16px;">6 Hours Daily</td><td style="padding:16px;">Cash</td><td style="padding:16px; font-weight:600; color:#0f172a; text-align:right;">₹700</td><td style="padding:16px;">2026-07-27</td>
                    <td style="padding:16px; text-align:right;"><span style="background:#fffbeb; color:#d97706; border:1px solid #fde68a; padding:4px 12px; border-radius:999px; font-size:11px; font-weight:600;">Pending</span></td>
                  </tr>
                  <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:16px;">RC-24001</td><td style="padding:16px; font-weight:600; color:#0f172a;">Ananya Patel</td><td style="padding:16px;">12 Hours Daily</td><td style="padding:16px;">UPI</td><td style="padding:16px; font-weight:600; color:#0f172a; text-align:right;">₹1,000</td><td style="padding:16px;">2026-07-26</td>
                    <td style="padding:16px; text-align:right;"><span style="background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0; padding:4px 12px; border-radius:999px; font-size:11px; font-weight:600;">Paid</span></td>
                  </tr>
                  <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:16px;">RC-24002</td><td style="padding:16px; font-weight:600; color:#0f172a;">Navya Singh</td><td style="padding:16px;">Weekly Access</td><td style="padding:16px;">Card</td><td style="padding:16px; font-weight:600; color:#0f172a; text-align:right;">₹2,700</td><td style="padding:16px;">2026-07-25</td>
                    <td style="padding:16px; text-align:right;"><span style="background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0; padding:4px 12px; border-radius:999px; font-size:11px; font-weight:600;">Paid</span></td>
                  </tr>
                  <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:16px;">RC-24003</td><td style="padding:16px; font-weight:600; color:#0f172a;">Meera Nair</td><td style="padding:16px;">Quarterly Saver</td><td style="padding:16px;">Bank Transfer</td><td style="padding:16px; font-weight:600; color:#0f172a; text-align:right;">₹250</td><td style="padding:16px;">2026-07-24</td>
                    <td style="padding:16px; text-align:right;"><span style="background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0; padding:4px 12px; border-radius:999px; font-size:11px; font-weight:600;">Paid</span></td>
                  </tr>
                  <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:16px;">RC-24004</td><td style="padding:16px; font-weight:600; color:#0f172a;">Vivaan Kapoor</td><td style="padding:16px;">Yearly Champion</td><td style="padding:16px;">UPI</td><td style="padding:16px; font-weight:600; color:#0f172a; text-align:right;">₹9,600</td><td style="padding:16px;">2026-07-23</td>
                    <td style="padding:16px; text-align:right;"><span style="background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0; padding:4px 12px; border-radius:999px; font-size:11px; font-weight:600;">Paid</span></td>
                  </tr>
                  <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:16px;">RC-24005</td><td style="padding:16px; font-weight:600; color:#0f172a;">Ishaan Verma</td><td style="padding:16px;">6 Hours Daily</td><td style="padding:16px;">Cash</td><td style="padding:16px; font-weight:600; color:#0f172a; text-align:right;">₹700</td><td style="padding:16px;">2026-07-22</td>
                    <td style="padding:16px; text-align:right;"><span style="background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0; padding:4px 12px; border-radius:999px; font-size:11px; font-weight:600;">Paid</span></td>
                  </tr>
                  <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:16px;">RC-24006</td><td style="padding:16px; font-weight:600; color:#0f172a;">Aadhya Patel</td><td style="padding:16px;">12 Hours Daily</td><td style="padding:16px;">UPI</td><td style="padding:16px; font-weight:600; color:#0f172a; text-align:right;">₹1,000</td><td style="padding:16px;">2026-07-21</td>
                    <td style="padding:16px; text-align:right;"><span style="background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0; padding:4px 12px; border-radius:999px; font-size:11px; font-weight:600;">Paid</span></td>
                  </tr>
                  <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:16px;">RC-24007</td><td style="padding:16px; font-weight:600; color:#0f172a;">Neha Singh</td><td style="padding:16px;">Weekly Access</td><td style="padding:16px;">Card</td><td style="padding:16px; font-weight:600; color:#0f172a; text-align:right;">₹2,700</td><td style="padding:16px;">2026-07-20</td>
                    <td style="padding:16px; text-align:right;"><span style="background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0; padding:4px 12px; border-radius:999px; font-size:11px; font-weight:600;">Paid</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Expenses Page -->
        <div class="page" id="page-expenses">
          <div class="page-header" style="margin-bottom: 2rem;">
            <div>
              <h1>Expenses</h1>
              <p class="page-subtitle">Track every operational cost.</p>
            </div>
            <div style="display: flex; gap: 0.75rem;">
              <button class="btn btn-ghost" style="background:#fff; color:#0f172a; border:1px solid #e2e8f0; border-radius:999px; padding:8px 16px; font-weight:500; font-size:13px; display:inline-flex; align-items:center; gap:6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export</button>
              <button class="btn btn-primary" style="background:#1e3a8a; color:#fff; border:none; border-radius:999px; padding:8px 16px; font-weight:500; font-size:13px; display:inline-flex; align-items:center; gap:6px;">+ Add expense</button>
            </div>
          </div>
          
          <div style="display:grid; grid-template-columns:2fr 1fr 1fr; gap:1rem; margin-bottom:1.5rem;">
            <div class="card" style="padding:1.5rem; background:#fff; border:1px solid #e2e8f0; border-radius:12px; display:flex; justify-content:space-between; align-items:flex-start; box-shadow:0 4px 6px -1px rgba(0,0,0,0.02);">
              <div><div style="font-size:11px; font-weight:700; letter-spacing:0.5px; color:#64748b; margin-bottom:8px; text-transform:uppercase;">Total This Month</div><div style="font-size:24px; font-weight:700; color:#0f172a;">₹74,720</div></div>
              <div style="width:32px; height:32px; background:#e0f2fe; color:#0284c7; border-radius:8px; display:flex; align-items:center; justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg></div>
            </div>
            <div class="card" style="padding:1.5rem; background:#fff; border:1px solid #e2e8f0; border-radius:12px; display:flex; justify-content:space-between; align-items:flex-start; box-shadow:0 4px 6px -1px rgba(0,0,0,0.02);">
              <div><div style="font-size:11px; font-weight:700; letter-spacing:0.5px; color:#64748b; margin-bottom:8px; text-transform:uppercase;">Pending Bills</div><div style="font-size:24px; font-weight:700; color:#0f172a;">₹1,650</div></div>
            </div>
            <div class="card" style="padding:1.5rem; background:#fff; border:1px solid #e2e8f0; border-radius:12px; display:flex; justify-content:space-between; align-items:flex-start; box-shadow:0 4px 6px -1px rgba(0,0,0,0.02);">
              <div><div style="font-size:11px; font-weight:700; letter-spacing:0.5px; color:#64748b; margin-bottom:8px; text-transform:uppercase;">Recurring</div><div style="font-size:24px; font-weight:700; color:#0f172a;">4</div></div>
            </div>
          </div>
          
          <div style="display:flex; gap:1.5rem; align-items:flex-start;">
            
            <div class="card" style="flex:2; padding:1.5rem; background:#fff; border:1px solid #e2e8f0; border-radius:12px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.02);">
              <h3 style="font-size:15px; font-weight:600; color:#0f172a; margin-bottom:1.5rem;">Expense log</h3>
              
              <div style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse; text-align:left; font-size:13px; color:#475569;">
                  <thead>
                    <tr style="color:#94a3b8; font-size:11px; font-weight:700; letter-spacing:0.5px; text-transform:uppercase; border-bottom:1px solid #e2e8f0;">
                      <th style="padding:12px 16px; font-weight:700; color:#0f172a;">Category</th>
                      <th style="padding:12px 16px; font-weight:700;">Vendor</th>
                      <th style="padding:12px 16px; font-weight:700;">Bill #</th>
                      <th style="padding:12px 16px; font-weight:700; text-align:right;">Amount</th>
                      <th style="padding:12px 16px; font-weight:700;">Date</th>
                      <th style="padding:12px 16px; font-weight:700; text-align:right;">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style="border-bottom:1px solid #f1f5f9;">
                      <td style="padding:16px; font-weight:600; color:#0f172a;">Rent</td><td style="padding:16px;">Kapoor Properties</td><td style="padding:16px;">R-2410</td><td style="padding:16px; font-weight:600; color:#0f172a; text-align:right;">₹45,000</td><td style="padding:16px;">2026-07-24</td>
                      <td style="padding:16px; text-align:right;"><span style="background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0; padding:4px 12px; border-radius:999px; font-size:11px; font-weight:600;">Paid</span></td>
                    </tr>
                    <tr style="border-bottom:1px solid #f1f5f9;">
                      <td style="padding:16px; font-weight:600; color:#0f172a;">Electricity</td><td style="padding:16px;">BSES</td><td style="padding:16px;">E-8821</td><td style="padding:16px; font-weight:600; color:#0f172a; text-align:right;">₹12,400</td><td style="padding:16px;">2026-07-22</td>
                      <td style="padding:16px; text-align:right;"><span style="background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0; padding:4px 12px; border-radius:999px; font-size:11px; font-weight:600;">Paid</span></td>
                    </tr>
                    <tr style="border-bottom:1px solid #f1f5f9;">
                      <td style="padding:16px; font-weight:600; color:#0f172a;">Internet</td><td style="padding:16px;">ACT Fibernet</td><td style="padding:16px;">I-3320</td><td style="padding:16px; font-weight:600; color:#0f172a; text-align:right;">₹2,100</td><td style="padding:16px;">2026-07-21</td>
                      <td style="padding:16px; text-align:right;"><span style="background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0; padding:4px 12px; border-radius:999px; font-size:11px; font-weight:600;">Paid</span></td>
                    </tr>
                    <tr style="border-bottom:1px solid #f1f5f9;">
                      <td style="padding:16px; font-weight:600; color:#0f172a;">Salary</td><td style="padding:16px;">Ramesh (Cleaner)</td><td style="padding:16px;">S-021</td><td style="padding:16px; font-weight:600; color:#0f172a; text-align:right;">₹9,000</td><td style="padding:16px;">2026-07-25</td>
                      <td style="padding:16px; text-align:right;"><span style="background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0; padding:4px 12px; border-radius:999px; font-size:11px; font-weight:600;">Paid</span></td>
                    </tr>
                    <tr style="border-bottom:1px solid #f1f5f9;">
                      <td style="padding:16px; font-weight:600; color:#0f172a;">Cleaning</td><td style="padding:16px;">Local Vendor</td><td style="padding:16px;">C-99</td><td style="padding:16px; font-weight:600; color:#0f172a; text-align:right;">₹850</td><td style="padding:16px;">2026-07-23</td>
                      <td style="padding:16px; text-align:right;"><span style="background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0; padding:4px 12px; border-radius:999px; font-size:11px; font-weight:600;">Paid</span></td>
                    </tr>
                    <tr style="border-bottom:1px solid #f1f5f9;">
                      <td style="padding:16px; font-weight:600; color:#0f172a;">Repairs</td><td style="padding:16px;">Kumar Electricals</td><td style="padding:16px;">K-14</td><td style="padding:16px; font-weight:600; color:#0f172a; text-align:right;">₹1,650</td><td style="padding:16px;">2026-07-19</td>
                      <td style="padding:16px; text-align:right;"><span style="background:#fffbeb; color:#d97706; border:1px solid #fde68a; padding:4px 12px; border-radius:999px; font-size:11px; font-weight:600;">Pending</span></td>
                    </tr>
                    <tr style="border-bottom:1px solid #f1f5f9;">
                      <td style="padding:16px; font-weight:600; color:#0f172a;">Snacks</td><td style="padding:16px;">Big Basket</td><td style="padding:16px;">BB-441</td><td style="padding:16px; font-weight:600; color:#0f172a; text-align:right;">₹720</td><td style="padding:16px;">2026-07-26</td>
                      <td style="padding:16px; text-align:right;"><span style="background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0; padding:4px 12px; border-radius:999px; font-size:11px; font-weight:600;">Paid</span></td>
                    </tr>
                    <tr style="border-bottom:1px solid #f1f5f9;">
                      <td style="padding:16px; font-weight:600; color:#0f172a;">Marketing</td><td style="padding:16px;">Meta Ads</td><td style="padding:16px;">M-77</td><td style="padding:16px; font-weight:600; color:#0f172a; text-align:right;">₹3,000</td><td style="padding:16px;">2026-07-17</td>
                      <td style="padding:16px; text-align:right;"><span style="background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0; padding:4px 12px; border-radius:999px; font-size:11px; font-weight:600;">Paid</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="card" style="flex:1; padding:1.5rem; background:#fff; border:1px solid #e2e8f0; border-radius:12px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.02); display:flex; flex-direction:column;">
              <h3 style="font-size:15px; font-weight:600; color:#0f172a; margin-bottom:4px;">By category</h3>
              <p style="font-size:13px; color:#94a3b8; margin-bottom:2.5rem;">This month</p>
              
              <div style="flex:1; display:flex; align-items:center; justify-content:center; margin-bottom:2.5rem;">
                <!-- Simulated Donut Chart using CSS conic-gradient -->
                <div style="width:160px; height:160px; border-radius:50%; background: conic-gradient(#1e3a8a 0% 60%, #0ea5e9 60% 75%, #06b6d4 75% 80%, #eab308 80% 90%, #f43f5e 90% 92%, #64748b 92% 95%, #84cc16 95% 96%, #8b5cf6 96% 100%); display:flex; align-items:center; justify-content:center; position:relative;">
                  <div style="width:100px; height:100px; border-radius:50%; background:#fff;"></div>
                  <!-- White slice borders for gap effect -->
                  <div style="position:absolute; inset:0; border-radius:50%; background: conic-gradient(transparent 0% 59.5%, white 59.5% 60.5%, transparent 60.5% 74.5%, white 74.5% 75.5%, transparent 75.5% 79.5%, white 79.5% 80.5%, transparent 80.5% 89.5%, white 89.5% 90.5%, transparent 90.5% 91.5%, white 91.5% 92.5%, transparent 92.5% 94.5%, white 94.5% 95.5%, transparent 95.5% 95.8%, white 95.8% 96.2%, transparent 96.2% 100%); pointer-events:none;"></div>
                </div>
              </div>
              
              <div style="display:flex; flex-wrap:wrap; gap:12px; font-size:11px; font-weight:600; color:#64748b;">
                <div style="display:flex; align-items:center; gap:6px;"><div style="width:8px; height:8px; border-radius:50%; background:#1e3a8a;"></div>Rent</div>
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
        </div>
`;

const newHtml = html.substring(0, paymentsStart) + replacement + "\n" + html.substring(staffStart);
fs.writeFileSync('index.html', newHtml);
console.log('index.html updated successfully with Payments and Expenses pages.');
