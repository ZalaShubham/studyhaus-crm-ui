const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

const targetStr = `          </div>\n\n          <!-- Tasks Page -->`;
const replaceStr = `          </div>\n        </div>\n\n        <!-- Tasks Page -->`;

if (html.includes(targetStr)) {
    const newHtml = html.replace(targetStr, replaceStr);
    fs.writeFileSync('index.html', newHtml);
    console.log("Successfully fixed closing div via script!");
} else {
    // try with \r\n
    const targetStr2 = `          </div>\r\n\r\n          <!-- Tasks Page -->`;
    const replaceStr2 = `          </div>\r\n        </div>\r\n\r\n        <!-- Tasks Page -->`;
    if (html.includes(targetStr2)) {
        const newHtml = html.replace(targetStr2, replaceStr2);
        fs.writeFileSync('index.html', newHtml);
        console.log("Successfully fixed closing div via script (CRLF)!");
    } else {
        console.log("Could not find the target string!");
    }
}
