// Dev harness: launches a headed Chromium with the unpacked extension loaded and a persistent
// profile (so a LinkedIn login survives restarts). Exposes CDP on 9222 so tooling can attach.
// Not part of the extension build. Run: node scripts/launch-browser.mjs
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const distPath = path.join(root, 'dist');
const profilePath = path.join(root, '.dev-profile');

const ctx = await chromium.launchPersistentContext(profilePath, {
  headless: false,
  channel: 'chromium',
  viewport: null,
  args: [
    '--remote-debugging-port=9222',
    `--disable-extensions-except=${distPath}`,
    `--load-extension=${distPath}`,
  ],
});

const [page] = ctx.pages();
await (page ?? (await ctx.newPage())).goto('https://www.linkedin.com/login');

console.log('Browser up. CDP on http://localhost:9222');
console.log('Log in to LinkedIn, then open a profile at linkedin.com/in/<name>.');

await new Promise(() => {}); // keep alive until killed
