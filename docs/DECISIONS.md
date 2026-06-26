# Locked Decisions

Made during planning (2026-06-26). Change only with reason.

| Topic | Decision | Why |
|-------|----------|-----|
| Browser | Chrome only, Manifest V3 | Largest reach, simplest |
| Tech stack | TypeScript + Vite + `@crxjs/vite-plugin` (2.0.0) | Types, HMR, MV3 bundling |
| LLM calls location | Background **service worker** (not popup) | Centralize keys, fetch, errors; keep secrets out of page |
| Scrape depth | Profile page DOM only | No extra tabs/fetch; lower complexity + detection risk |
| Delivery | Popup shows message + Copy button | Human reviews/edits; no auto-insert into LinkedIn box |
| Angles | Dropdown in popup; templates **editable** in options | Flexible tone/intent without code edits |
| Providers | Gemini + DeepSeek, pluggable + selectable | User wants provider choice |
| Default models | `gemini-2.0-flash`, `deepseek-chat` | Cheap, fast defaults |
| Key storage | API keys -> `storage.local`; prefs/angles/tone -> `storage.sync` | Keys device-only (safer); prefs sync across devices |
| Repo | **Public** GitHub, after first working build | User chose public |
| License | MIT | Permissive default |
| Tooling | Prettier + ESLint, README + LICENSE | No unit tests for v1 |
| Git identity | Global `QasimBhb <qbhb2102@gmail.com>` | User confirmed |

## Caveats acknowledged
- Scraping LinkedIn is against their ToS; selectors will drift — scraper kept defensive. Personal-use tool.
- Scraped personal data is sent to a third-party LLM — disclaimer line goes in options page.
- Public repo: **never commit API keys**; they live only in chrome.storage at runtime.
