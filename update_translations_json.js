const fs = require('fs');

const newTranslations = {
  'settings.institution': { en: 'Institution Details', gu: 'સંસ્થાની વિગતો' },
  'settings.language': { en: 'Multi-Language', gu: 'બહુ-ભાષા' },
  'settings.theme': { en: 'Theme', gu: 'થીમ' },
  'settings.subtitle': { en: 'Manage application preferences', gu: 'એપ્લિકેશન પસંદગીઓનું સંચાલન કરો' },
  'settings.appLang': { en: 'Application Language', gu: 'એપ્લિકેશન ભાષા' },
  'settings.instName': { en: 'Institution Name', gu: 'સંસ્થાનું નામ' },
  'dash.activeStudents': { en: 'Active Students', gu: 'સક્રિય વિદ્યાર્થીઓ' },
  'dash.totalRevenue': { en: 'Total Revenue', gu: 'કુલ આવક' },
  'dash.recentEnrollments': { en: 'Recent Enrollments', gu: 'તાજેતરના પ્રવેશ' },
  'dash.todaysAttendance': { en: "Today's Attendance", gu: 'આજની હાજરી' }
};

const enFile = 'translations/en.json';
const guFile = 'translations/gu.json';

let enData = JSON.parse(fs.readFileSync(enFile, 'utf8'));
let guData = JSON.parse(fs.readFileSync(guFile, 'utf8'));

for (const [key, langs] of Object.entries(newTranslations)) {
  enData[key] = langs.en;
  guData[key] = langs.gu;
}

fs.writeFileSync(enFile, JSON.stringify(enData, null, 2));
fs.writeFileSync(guFile, JSON.stringify(guData, null, 2));
console.log('Sidebar/Dashboard translations added');
