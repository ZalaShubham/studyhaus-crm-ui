const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'services');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

async function test() {
  for (const file of files) {
    try {
      await import(`file://${path.join(dir, file)}`);
    } catch (err) {
      if (err.name === 'SyntaxError') {
        console.error(`SyntaxError in ${file}:`, err);
      }
    }
  }
}
test();
