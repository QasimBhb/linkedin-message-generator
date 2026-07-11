// Dev probe: runs both checks from an extension page (which wakes the MV3 service worker):
//   1. a real SCRAPE_PROFILE against the open LinkedIn profile,
//   2. the fail-closed guard — GENERATE with a deliberately broken profile must be refused.
import { chromium } from 'playwright';

const EXT_ID = 'bicbnljimggldgdedjipbdpdpahckggg'; // stable for this unpacked path

const browser = await chromium.connectOverCDP('http://localhost:9222');
const ctx = browser.contexts()[0];

let page = ctx.pages().find((p) => p.url().includes('linkedin.com/in/'));
if (!page) {
  page = await ctx.newPage();
  await page.goto('https://www.linkedin.com/in/darmin-memisevic-44593a23/', {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForTimeout(3000);
}

const ext = await ctx.newPage();
await ext.goto(`chrome-extension://${EXT_ID}/src/popup/index.html`);
await ext.waitForTimeout(800);

const scrape = await ext.evaluate(async () => {
  const [tab] = await chrome.tabs.query({
    url: 'https://www.linkedin.com/in/*',
  });
  if (!tab?.id) return { ok: false, error: 'no linkedin tab' };
  try {
    return await chrome.tabs.sendMessage(tab.id, { type: 'SCRAPE_PROFILE' });
  } catch (e) {
    return { ok: false, error: String(e) };
  }
});

console.log('GOOD PROFILE -> scrape:', scrape.ok ? 'ok' : `FAILED: ${scrape.error}`);
if (scrape.ok) {
  const p = scrape.profile;
  console.log(`   ${p.name} | ${p.currentTitle} @ ${p.currentCompany}`);
  console.log(`   experiences: ${p.experiences.length} · about: ${!!p.about}`);
}

const blocked = await ext.evaluate(async () =>
  chrome.runtime.sendMessage({
    type: 'GENERATE',
    angleId: 'networking',
    profile: {
      name: 'Someone',
      headline: null,
      location: null,
      about: null,
      currentCompany: null,
      currentTitle: null,
      experiences: [],
      education: [],
      skills: [],
    },
  }),
);

console.log('\nBROKEN PROFILE -> generate:');
console.log(JSON.stringify(blocked, null, 2));
console.log(
  blocked.ok
    ? '\n *** FAIL: generated from a partial profile ***'
    : '\n PASS: refused, no LLM call',
);

await ext.close();
await browser.close();
