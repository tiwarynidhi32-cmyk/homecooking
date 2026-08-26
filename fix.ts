import fs from 'fs';
let content = fs.readFileSync('./src/panels/AdminPanel.tsx', 'utf-8');
content = content.replace(/\)\}\s+<\/div>\s+<\/motion\.div>\s+\)\}\s+\{activeTab === 'database'/, ")}\n\n          {activeTab === 'database'");
fs.writeFileSync('./src/panels/AdminPanel.tsx', content);
console.log('AdminPanel fixed');
