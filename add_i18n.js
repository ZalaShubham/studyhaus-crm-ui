const fs = require('fs');

const files = [
  'admin/dashboard.html',
  'manager/dashboard.html',
  'employee/dashboard.html',
  'student/dashboard.html',
  'index.html'
];

const languageSelectHtml = `
              <div class="form-group" style="margin-bottom: 1.5rem;">
                <label data-i18n="settings.systemLanguage">System Language</label>
                <select id="setting-language">
                  <option value="en">English</option>
                  <option value="gu">Gujarati</option>
                </select>
              </div>`;

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');

    // 1. Add language select if missing
    if (!content.includes('id="setting-language"')) {
      const target = '<div class="settings-section-title">Preferences</div>';
      content = content.replace(
        target,
        `${target}\n${languageSelectHtml}`
      );
    }

    // 2. Add data-i18n to sidebar menu items
    // Regex matches: <span>Text</span>
    content = content.replace(/<span>([^<]+)<\/span>/g, (match, text) => {
      // Map text to key
      let key = '';
      if (text === 'Dashboard') key = 'menu.dashboard';
      else if (text === 'Students') key = 'menu.students';
      else if (text === 'Seat Map') key = 'menu.seatMap';
      else if (text === 'Live Seat Map') key = 'menu.liveSeatMap';
      else if (text === 'Attendance') key = 'menu.attendance';
      else if (text === 'Payments') key = 'menu.payments';
      else if (text === 'Visitors') key = 'menu.visitors';
      else if (text === 'Memberships') key = 'menu.memberships';
      else if (text === 'Expenses') key = 'menu.expenses';
      else if (text === 'Reports') key = 'menu.reports';
      else if (text === 'Settings') key = 'menu.settings';
      else if (text === 'Complaints') key = 'menu.complaints';
      else if (text === 'Tasks') key = 'menu.tasks';
      else if (text === 'Documents') key = 'menu.documents';
      else if (text === 'Staff') key = 'menu.staff';
      else if (text === 'Notifications') key = 'menu.notifications';
      else if (text === 'Admissions') key = 'menu.admissions';
      else if (text === 'Old Students') key = 'menu.oldStudents';
      else if (text === 'Message Logs') key = 'menu.messageLogs';
      
      if (key) {
        return `<span data-i18n="${key}">${text}</span>`;
      }
      return match;
    });

    fs.writeFileSync(f, content, 'utf8');
    console.log(`Updated ${f}`);
  }
});
