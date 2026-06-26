# Architecture

## Three runtime contexts
```
content/scraper.ts        scrapes profile DOM, replies to SCRAPE_PROFILE
background/service-worker  owns API keys + LLM fetch, handles GENERATE
popup + options           UI only
```

## Structure
```
manifest.config.ts        # CRXJS defineManifest()
vite.config.ts
src/
  background/service-worker.ts   # message router + LLM fetch       (TODO)
  content/scraper.ts             # scrape profile DOM               (TODO)
  popup/   index.html popup.ts popup.css                            (TODO)
  options/ index.html options.ts options.css                       (TODO)
  lib/
    types.ts      # Profile, Angle, Settings, Secrets, ProviderId   (done)
    messages.ts   # typed message protocol + helpers                (done)
    storage.ts    # storage.local (keys) + storage.sync (prefs)     (done)
    providers.ts  # generate() for gemini/deepseek                  (done)
    prompt.ts     # buildPrompt(profile, angle, tone)               (done)
public/icons/     # 16/48/128 png placeholders                      (TODO)
```

## Message protocol (`src/lib/messages.ts`)
- Popup -> content (`chrome.tabs.sendMessage`): `{type:'SCRAPE_PROFILE'}`
  -> `ContentResponse = {ok:true, profile} | {ok:false, error}`. Helper: `scrapeProfile(tabId)`.
- Popup -> service worker (`chrome.runtime.sendMessage`):
  `{type:'GENERATE', profile, angleId}` -> `BgResponse = {ok:true, text} | {ok:false, error}`.
  Helper: `requestGenerate(profile, angleId)`.

## Data flow
1. User on `linkedin.com/in/<name>` opens popup.
2. Popup -> content `SCRAPE_PROFILE` -> `Profile`
   `{ name, headline, location, about, currentCompany, currentTitle, experiences[], education[], skills[] }`.
3. Popup -> service worker `GENERATE` (profile + angleId).
4. Service worker: `getSettings()` + `getSecrets()` -> `buildPrompt()` -> `generate()` -> text.
5. Popup renders text in editable `<textarea>` + Copy.

## manifest (key parts)
- `permissions: ['storage','activeTab','scripting','tabs']`
- `host_permissions: linkedin.com/*, generativelanguage.googleapis.com/*, api.deepseek.com/*`
- background service_worker (module), content_scripts match `linkedin.com/in/*`,
  action.default_popup, options_page, icons.

## Providers (`src/lib/providers.ts`)
- `generate({provider, apiKey, model}, prompt) -> Promise<string>`.
- Gemini: `POST .../v1beta/models/<model>:generateContent?key=` ->
  `candidates[0].content.parts[0].text`.
- DeepSeek: `POST api.deepseek.com/chat/completions` (OpenAI-compatible, Bearer auth) ->
  `choices[0].message.content`.

## Prompt (`src/lib/prompt.ts`)
- Angle template placeholders: `{tone} {name} {currentTitle} {currentCompany}`.
- Interpolate + append compact JSON of profile. Instruct: return only message text.

## Scraper plan (TODO — `src/content/scraper.ts`)
- Listen `SCRAPE_PROFILE`. Read top card (`<h1>` name, headline), about, experience, education,
  skills via section anchors / aria attributes. Each field try/catch -> `null`; never throw.
  Normalize whitespace; cap `about` ~1500 chars.

## Verification (manual, after build)
1. `npm run build` (or `npm run dev`).
2. `chrome://extensions` -> Developer mode -> Load unpacked -> `dist/`.
3. Options: paste Gemini key, select Gemini, save.
4. Visit `linkedin.com/in/<profile>`, open popup, confirm scraped name/company (debug view).
5. Pick angle -> Generate -> message appears -> Copy -> paste.
6. Switch to DeepSeek (with key), regenerate -> both work.
7. Edit an angle in options, reopen popup -> dropdown + output reflect it.
