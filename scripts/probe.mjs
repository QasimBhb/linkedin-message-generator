// Dev probe: drives a real SCRAPE_PROFILE through the extension's service worker and prints the
// Profile the content script returns — the same path the popup uses.
import { chromium } from 'playwright';

const PROFILE_URL = process.argv[2] ?? 'https://www.linkedin.com/in/darmin-memisevic-44593a23/';

const browser = await chromium.connectOverCDP('http://localhost:9222');
const ctx = browser.contexts()[0];

let page = ctx.pages().find((p) => p.url().includes('linkedin.com/in/'));
if (!page) {
  page = await ctx.newPage();
  await page.goto(PROFILE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
}

const [sw] = ctx.serviceWorkers();
if (!sw) {
  console.log('No extension service worker found.');
  process.exit(1);
}

const result = await sw.evaluate(async () => {
  const [tab] = await chrome.tabs.query({
    url: 'https://www.linkedin.com/in/*',
  });
  if (!tab?.id) return { error: 'no linkedin tab' };
  try {
    return await chrome.tabs.sendMessage(tab.id, { type: 'SCRAPE_PROFILE' });
  } catch (e) {
    return { error: String(e) };
  }
});

console.log(JSON.stringify(result, null, 2));
await browser.close();
