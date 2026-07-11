# Project Status — resume here

_Last updated: 2026-07-11_

## What this is
Chrome extension (MV3): on a LinkedIn **profile page**, scrape visible profile data, send to a
chosen LLM (Gemini or DeepSeek), generate a tailored outreach message in a selected "angle"
(networking / sales / job / collab). Message shows in the popup with a Copy button — human
reviews/edits before sending. See `ARCHITECTURE.md` and `DECISIONS.md`.

## Done ✅
- Project scaffold: TypeScript + Vite + `@crxjs/vite-plugin` (stable 2.0.0).
- **Lib layer** (`src/lib/`): `types.ts`, `messages.ts`, `storage.ts`, `prompt.ts`, `providers.ts`.
- **Background** (`src/background/service-worker.ts`): `GENERATE` router.
- **Content** (`src/content/scraper.ts`): `SCRAPE_PROFILE`, defensive DOM scrape.
- **Popup** (`src/popup/`): angle select, provider label, Generate, scraped-profile debug toggle,
  editable result + Copy, guard when not on `linkedin.com/in/*`.
- **Options** (`src/options/`): provider radio, API keys, model overrides, tone, angle editor,
  save/reset, privacy note.
- Placeholder icons in `public/icons/`. `README.md` + MIT `LICENSE`.
- `tsc --noEmit` clean · `eslint .` clean · `npm run build` produces a loadable `dist/`.
- Committed on `main` (`62070b1`).

## Verified in the browser ✅ (2026-07-11)
End-to-end works on a live profile: scrape -> angle -> LLM -> message in the popup.

Two bugs found and fixed during that first real test:
1. **"Receiving end does not exist"** — content scripts only inject on a real page load, so a tab
   already open (or reached via LinkedIn's client-side routing) had no listener. `scrapeProfile()`
   now catches that, injects the content script with `chrome.scripting`, and retries once.
2. **Scraper matched nothing.** LinkedIn redesigned the profile page: hashed class names, name in
   an `h2` (not `h1`), `#about`/`#experience` anchors replaced by random UUIDs, no more
   `aria-hidden` text spans, and Experience/Education/Skills absent from the DOM until **`<main>`**
   (the real scroll container — *not* the window) is scrolled. Scraper now scrolls `<main>`, finds
   sections by `<h2>` heading text, and parses `innerText` lines.

**The scraper is inherently fragile** — it depends on LinkedIn's rendered text layout, because the
markup carries no stable hooks. Expect it to break again on their next redesign. `scripts/probe.mjs`
is the tool for re-deriving selectors when it does.

## Dev harness
`node scripts/launch-browser.mjs` boots headed Chromium with `dist/` loaded as an unpacked
extension and a persistent profile in `.dev-profile/` (LinkedIn login survives restarts), exposing
CDP on `:9222`. `node scripts/probe.mjs` attaches to it and runs a real `SCRAPE_PROFILE` through
the extension's service worker, printing the resulting `Profile`.

## How to resume
```bash
cd /media/qasim/NewVolume/projs/Linkedin-message-generator
npm install          # if node_modules missing
npm run build        # -> dist/
```
Then `chrome://extensions` -> Developer mode -> Load unpacked -> pick `dist/`.

## Open follow-ups
- Provide exact tone/style text -> options "tone" field.
- Replace placeholder icons.
- GitHub: create **public** repo + push. The gating condition (a working browser test) is now met.
- 2 npm audit warnings in transitive build deps — defer, not runtime.
- Optional later: unit tests for `prompt.ts` / `providers.ts` parsing; Web Store zip script.
