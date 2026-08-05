const { execSync } = require('child_process');
try {
  console.log(execSync('git checkout -- admin/dashboard.html', { encoding: 'utf8' }));
  console.log('Restored admin/dashboard.html');
} catch (e) {
  console.error(e);
}
