const fs = require('fs');
const path = require('path');

const pagesDir = path.join(
  'C:', 'Users', 'HomePC', 'Desktop', 'jungle-chama', 'secon_last_version',
  'frontend', 'src', 'pages'
);

const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));

for (const fname of files) {
  const fpath = path.join(pagesDir, fname);
  let content = fs.readFileSync(fpath, 'utf8');
  const original = content;

  // Fix: apiFetch(/api/...  ->  apiFetch('/api/...
  // The Node.js script removed the quotes around the string path
  // We need to add single quotes back around the path argument
  content = content.replace(
    /apiFetch\((\/api\/[^,\)\s]+)/g,
    "apiFetch('$1'"
  );

  if (content !== original) {
    fs.writeFileSync(fpath, content, 'utf8');
    console.log('Fixed quotes: ' + fname);
  } else {
    console.log('OK: ' + fname);
  }
}
console.log('Done!');