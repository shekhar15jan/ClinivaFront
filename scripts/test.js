// Test runner helper
const { execSync } = require('child_process');

const mode = process.argv[2] || 'unit';

switch (mode) {
  case 'unit':
    console.log('Running unit tests (Vitest)...');
    execSync('npx vitest run --reporter=verbose', { stdio: 'inherit' });
    break;
  case 'e2e':
    console.log('Running E2E tests (Playwright)...');
    execSync('npx playwright test', { stdio: 'inherit' });
    break;
  case 'watch':
    console.log('Running unit tests in watch mode...');
    execSync('npx vitest --watch', { stdio: 'inherit' });
    break;
  default:
    console.error(`Unknown mode: ${mode}. Use: unit, e2e, watch`);
    process.exit(1);
}
