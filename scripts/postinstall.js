// Post-install script
const { execSync } = require('child_process');
const os = require('os');

console.log(`Node version: ${process.version}`);
console.log(`Platform: ${os.platform()} ${os.arch()}`);

// Ensure Angular CLI is available
try {
  const ngVersion = execSync('npx ng version --short 2>&1', { encoding: 'utf8' });
  console.log(`Angular CLI: ${ngVersion.trim()}`);
} catch {
  console.warn('Angular CLI not found — skipping version check');
}
