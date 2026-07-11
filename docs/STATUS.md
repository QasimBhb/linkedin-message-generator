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

## Not verified yet ⬜ (next session)
**Manual browser test has not been run.** Load `dist/` unpacked and walk the checklist in
`ARCHITECTURE.md` → Verification. Expect the scraper selectors to need tuning — LinkedIn's DOM
changes often and the current selectors are a best guess, not observed-and-confirmed.

Known likely issues to watch for:
- **SPA navigation**: content scripts inject on page load. Navigating feed -> profile without a
  reload may leave the tab with no content script, so `SCRAPE_PROFILE` fails with a connection
  error. Workaround: hard-reload the profile page. Real fix: fallback inject via
  `chrome.scripting.executeScript` from the popup.
- Scraper field mapping (`currentTitle`/`currentCompany` come from the first experience entry;
  about/skills selectors are anchor-based and may miss).

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
- GitHub: create **public** repo + push **after** first working browser test (decided).
- 2 npm audit warnings in transitive build deps — defer, not runtime.
- Optional later: unit tests for `prompt.ts` / `providers.ts` parsing; Web Store zip script.
