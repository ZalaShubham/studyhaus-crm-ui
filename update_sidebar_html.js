const fs = require('fs');
const htmlFiles = ['admin/dashboard.html', 'admin/dashboard_head.html', 'manager/dashboard.html', 'employee/dashboard.html', 'student/dashboard.html'];

const replacements = [
  { regex: />Dashboard<\/span>/g, replace: ' data-i18n="menu.dashboard">Dashboard</span>' },
  { regex: />Students<\/span>/g, replace: ' data-i18n="menu.students">Students</span>' },
  { regex: />Seat Map<\/span>/g, replace: ' data-i18n="menu.seatMap">Seat Map</span>' },
  { regex: />Live Seat Map<\/span>/g, replace: ' data-i18n="menu.liveSeatMap">Live Seat Map</span>' },
  { regex: />Attendance<\/span>/g, replace: ' data-i18n="menu.attendance">Attendance</span>' },
  { regex: />Payments<\/span>/g, replace: ' data-i18n="menu.payments">Payments</span>' },
  { regex: />Visitors<\/span>/g, replace: ' data-i18n="menu.visitors">Visitors</span>' },
  { regex: />Memberships<\/span>/g, replace: ' data-i18n="menu.memberships">Memberships</span>' },
  { regex: />Expenses<\/span>/g, replace: ' data-i18n="menu.expenses">Expenses</span>' },
  { regex: />Reports<\/span>/g, replace: ' data-i18n="menu.reports">Reports</span>' },
  { regex: />Settings<\/span>/g, replace: ' data-i18n="menu.settings">Settings</span>' },
  { regex: />Complaints<\/span>/g, replace: ' data-i18n="menu.complaints">Complaints</span>' },
  { regex: />Tasks<\/span>/g, replace: ' data-i18n="menu.tasks">Tasks</span>' },
  { regex: />Documents<\/span>/g, replace: ' data-i18n="menu.documents">Documents</span>' },
  { regex: />Staff<\/span>/g, replace: ' data-i18n="menu.staff">Staff</span>' },
  { regex: />Notifications<\/span>/g, replace: ' data-i18n="menu.notifications">Notifications</span>' },
  { regex: />Admissions<\/span>/g, replace: ' data-i18n="menu.admissions">Admissions</span>' },
  { regex: />My Profile<\/span>/g, replace: ' data-i18n="menu.myProfile">My Profile</span>' },
  
  // Also the Settings page tabs
  { regex: />Institution Details<\/div>/g, replace: ' data-i18n="settings.institution">Institution Details</div>' },
  { regex: />Multi-Language<\/div>/g, replace: ' data-i18n="settings.language">Multi-Language</div>' },
  { regex: />Theme<\/div>/g, replace: ' data-i18n="settings.theme">Theme</div>' },
  
  // Settings Page Titles
  { regex: />Settings<\/h2>/g, replace: ' data-i18n="menu.settings">Settings</h2>' },
  { regex: />Manage application preferences<\/p>/g, replace: ' data-i18n="settings.subtitle">Manage application preferences</p>' },
  { regex: />Application Language<\/label>/g, replace: ' data-i18n="settings.appLang">Application Language</label>' },
  { regex: />Institution Name<\/label>/g, replace: ' data-i18n="settings.instName">Institution Name</label>' },
  { regex: />Phone<\/label>/g, replace: ' data-i18n="form.phone">Phone</label>' },
  { regex: />Email<\/label>/g, replace: ' data-i18n="form.email">Email</label>' },
  { regex: />Address<\/label>/g, replace: ' data-i18n="form.address">Address</label>' },
  
  // Dashboard Home Widgets (Dashboard Summary)
  { regex: />Active Students<\/div>/g, replace: ' data-i18n="dash.activeStudents">Active Students</div>' },
  { regex: />Total Revenue<\/div>/g, replace: ' data-i18n="dash.totalRevenue">Total Revenue</div>' },
  { regex: />Recent Enrollments<\/div>/g, replace: ' data-i18n="dash.recentEnrollments">Recent Enrollments</div>' },
  { regex: />Today's Attendance<\/div>/g, replace: ` data-i18n="dash.todaysAttendance">Today's Attendance</div>` }
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
