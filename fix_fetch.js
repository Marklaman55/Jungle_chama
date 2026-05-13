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

  // await fetch('/api/...', {
  content = content.replace(
    /await fetch\(\s*'(\/api\/[^']+)'\s*,\s*\{/g,
    "await apiFetch($1, {"
  );

  // await fetch('/api/...')
  content = content.replace(
    /await fetch\(\s*'(\/api\/[^']+?)'\s*\)/g,
    "await apiFetch($1)"
  );

  // fetch('/api/...').then
  content = content.replace(
    /fetch\(\s*'(\/api\/[^']+?)'\s*\)\./g,
    "apiFetch($1)."
  );

  // fetch('/api/...', { (without await)
  content = content.replace(
    /fetch\(\s*'(\/api\/[^']+)'\s*,\s*\{/g,
    "apiFetch($1, {"
  );

  // Add import if needed
  if (content.includes('/api/') && !content.includes('apiFetch')) {
    const lines = content.split('\n');
    let insertIdx = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ')) insertIdx = i + 1;
    }
    lines.splice(insertIdx, 0, "import { apiFetch } from '../lib/api';");
    content = lines.join('\n');
  }

  if (content !== original) {
    fs.writeFileSync(fpath, content, 'utf8');
    console.log('Updated: ' + fname);
  } else {
    console.log('No changes: ' + fname);
  }
}
console.log('Done!');