const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

const tasksStart = html.indexOf('<!-- Tasks Page -->');
if (tasksStart !== -1) {
    // Check if the </div> is missing before tasksStart
    const textBeforeTasks = html.substring(tasksStart - 20, tasksStart);
    if (!textBeforeTasks.includes('</div>')) {
        const newHtml = html.substring(0, tasksStart) + "        </div>\n\n        " + html.substring(tasksStart);
        fs.writeFileSync('index.html', newHtml);
        console.log('Fixed missing closing div in index.html');
    } else {
        console.log('Div seems present. Let us check more deeply.');
    }
}
