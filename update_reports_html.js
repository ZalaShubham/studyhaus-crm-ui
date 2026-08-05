const fs = require('fs');
const htmlFiles = ['admin/dashboard.html', 'manager/dashboard.html', 'employee/dashboard.html', 'student/dashboard.html', 'index.html'];

const replacements = [
  { regex: />Reports<\/h2>/g, replace: ' data-i18n="report.title">Reports</h2>' },
  { regex: />Generate and download reports<\/p>/g, replace: ' data-i18n="report.subtitle">Generate and download reports</p>' },
  { regex: />Dashboard Summary<\/div>/g, replace: ' data-i18n="report.dashboardTitle">Dashboard Summary</div>' },
  { regex: />Master P&L, Revenue vs Expenses<\/div>/g, replace: ' data-i18n="report.dashboardDesc">Master P&L, Revenue vs Expenses</div>' },
  { regex: />Payment Report<\/div>/g, replace: ' data-i18n="report.paymentTitle">Payment Report</div>' },
  { regex: />All collections, dues, and breakdowns<\/div>/g, replace: ' data-i18n="report.paymentDesc">All collections, dues, and breakdowns</div>' },
  { regex: />Student Report<\/div>/g, replace: ' data-i18n="report.studentTitle">Student Report</div>' },
  { regex: />Active, inactive, and pending students list<\/div>/g, replace: ' data-i18n="report.studentDesc">Active, inactive, and pending students list</div>' },
  { regex: />Attendance Report<\/div>/g, replace: ' data-i18n="report.attendanceTitle">Attendance Report</div>' },
  { regex: />Daily and monthly attendance records<\/div>/g, replace: ' data-i18n="report.attendanceDesc">Daily and monthly attendance records</div>' },
  { regex: />Seat Occupancy Report<\/div>/g, replace: ' data-i18n="report.seatTitle">Seat Occupancy Report</div>' },
  { regex: />Seat utilization and floor-wise breakdown<\/div>/g, replace: ' data-i18n="report.seatDesc">Seat utilization and floor-wise breakdown</div>' },
  { regex: />Expense Report<\/div>/g, replace: ' data-i18n="report.expenseTitle">Expense Report</div>' },
  { regex: />Monthly expenses breakdown by category<\/div>/g, replace: ' data-i18n="report.expenseDesc">Monthly expenses breakdown by category</div>' },
  { regex: />Membership Report<\/div>/g, replace: ' data-i18n="report.membershipTitle">Membership Report</div>' },
  { regex: />Plan distribution and tracking<\/div>/g, replace: ' data-i18n="report.membershipDesc">Plan distribution and tracking</div>' },
  { regex: />Renewal Report<\/div>/g, replace: ' data-i18n="report.renewalTitle">Renewal Report</div>' },
  { regex: />Historical log of all membership renewals<\/div>/g, replace: ' data-i18n="report.renewalDesc">Historical log of all membership renewals</div>' },
  { regex: />Visitor Report<\/div>/g, replace: ' data-i18n="report.visitorTitle">Visitor Report</div>' },
  { regex: />Walk-ins, inquiries and foot traffic<\/div>/g, replace: ' data-i18n="report.visitorDesc">Walk-ins, inquiries and foot traffic</div>' },
  { regex: />Complaint Report<\/div>/g, replace: ' data-i18n="report.complaintTitle">Complaint Report</div>' },
  { regex: />Student issues and resolution tracking<\/div>/g, replace: ' data-i18n="report.complaintDesc">Student issues and resolution tracking</div>' },
  { regex: />View Report<\/button>/g, replace: ' data-i18n="btn.viewReport">View Report</button>' }
];

for (const file of htmlFiles) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    for (const r of replacements) {
      content = content.replace(r.regex, (match) => {
         return r.replace;
      });
    }
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
}
