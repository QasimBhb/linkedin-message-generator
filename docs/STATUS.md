# Project Status — resume here

_Last updated: 2026-06-26_

## What this is
Chrome extension (MV3): on a LinkedIn **profile page**, scrape visible profile data, send to a
chosen LLM (Gemini or DeepSeek), generate a tailored outreach message in a selected "angle"
(networking / sales / job / collab). Message shows in the popup with a Copy button — human
reviews/edits before sending. See `ARCHITECTURE.md` and `DECISIONS.md`.

## Done ✅
- Project scaffold: TypeScript + Vite + `@crxjs/vite-plugin` (stable 2.0.0).
- Config: `package.json`, `tsconfig.json`, `vite.config.ts`, `manifest.config.ts`,
  `eslint.config.js`, `.prettierrc`, `.gitignore`.
- **Lib layer** (`src/lib/`): `types.ts`, `messages.ts`, `storage.ts`, `prompt.ts`, `providers.ts`.
- `tsc --noEmit` clean · `eslint .` clean.
- Git: `init` on `main`. Identity = global `QasimBhb <qbhb2102@gmail.com>`.
- **Not committed yet** — files are staged only.

## Not built yet ⬜ (next session, in order)
1. `src/background/service-worker.ts` — message router; handles `GENERATE`: load settings+secrets,
   `buildPrompt()`, call `generate()`, return `{ok,text}` | `{ok:false,error}`.
2. `src/content/scraper.ts` — listen for `SCRAPE_PROFILE`, scrape profile DOM -> `Profile`,
   defensive per-field try/catch, never throw.
3. `src/popup/` — `index.html` + `popup.ts` + `popup.css`. Angle `<select>`, provider label,
   Generate button, editable result `<textarea>` + Copy. Guard when not on `linkedin.com/in/*`.
4. `src/options/` — `index.html` + `options.ts` + `options.css`. Provider radio, API key inputs
   (-> storage.local), model overrides, tone textarea, angle editor, privacy disclaimer line.
5. `public/icons/` — placeholder 16/48/128 png.
6. `README.md` + `LICENSE` (MIT).
7. `npm run build` -> load `dist/` unpacked -> manual verify (see ARCHITECTURE.md verification).

## How to resume
```bash
cd /media/qasim/NewVolume/projs/Linkedin-message-generator
npm install          # if node_modules missing
npx tsc --noEmit     # should be clean
npm run dev          # vite + HMR  (or: npm run build -> dist/)
```
Then continue with step 1 above. The lib layer is the stable contract — build the 3 contexts
(background / content / popup+options) against the types in `src/lib/`.

## Open follow-ups
- Provide your exact tone/style text -> goes in options "tone" field (default placeholder for now).
- Replace placeholder icons.
- GitHub: create **public** repo + push **after** first working build (decided).
- 2 npm audit warnings in transitive build deps — defer, not runtime.
- Optional later: unit tests for `prompt.ts` / `providers.ts` parsing; Web Store zip script.
