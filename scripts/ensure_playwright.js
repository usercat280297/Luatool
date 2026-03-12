#!/usr/bin/env node
const { execSync } = require('child_process');

const shouldInstall = Boolean(process.env.RENDER)
  || Boolean(process.env.RENDER_SERVICE_ID)
  || Boolean(process.env.RENDER_EXTERNAL_URL)
  || process.env.PLAYWRIGHT_INSTALL === '1'
  || process.env.CI === 'true';

if (process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD === '1') {
  console.log('[Playwright] Browser download skipped (PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1).');
  process.exit(0);
}

if (!shouldInstall) {
  console.log('[Playwright] Skip browser install (not Render/CI).');
  process.exit(0);
}

console.log('[Playwright] Installing Chromium (this may take a few minutes)...');

try {
  execSync('npx playwright install --with-deps chromium', { stdio: 'inherit' });
  console.log('[Playwright] Chromium installed.');
} catch (error) {
  console.error('[Playwright] Install failed:', error.message);
  process.exit(1);
}
