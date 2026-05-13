const { execSync } = require('child_process');
const path = require('path');

const backendDir = path.join('C:', 'Users', 'HomePC', 'Desktop', 'jungle-chama', 'secon_last_version', 'backend');

try {
  const result = execSync('npx tsc --noEmit', { cwd: backendDir, encoding: 'utf8' });
  console.log('TypeScript compilation: OK (no errors)');
} catch (e) {
  console.log('TypeScript compilation ERRORS:');
  console.log(e.stdout || e.message);
}