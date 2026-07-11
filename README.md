# LinkedIn Message Generator

A Chrome extension (MV3) that reads the LinkedIn profile you're viewing and drafts a tailored
outreach message with an LLM of your choice — Google Gemini or DeepSeek. The draft lands in an
editable box with a Copy button, so **you** review and send it. Nothing is sent on your behalf.

## How it works

1. Open a profile at `linkedin.com/in/<name>` and click the extension icon.
2. The content script scrapes the visible profile (name, headline, about, experience, education,
   skills) from the page DOM.
3. Pick an **angle** — Networking, Sales, Job/Recruiting, Collaboration, or one you wrote yourself.
4. The background service worker builds a prompt and calls your chosen provider.
5. The message appears in an editable textarea. Edit it, copy it, send it yourself.

## Install (development)

```bash
npm install
npm run build
```

Then in Chrome: `chrome://extensions` → enable **Developer mode** → **Load unpacked** → select the
`dist/` folder.

For live reload during development use `npm run dev` and load `dist/` the same way.

## Setup

Open the extension's **Options** page and:

- pick your provider (Gemini or DeepSeek),
- paste that provider's API key,
- optionally override the model, set your preferred tone, and edit the angle templates.

Get a key from [Google AI Studio](https://aistudio.google.com/apikey) (Gemini) or the
[DeepSeek platform](https://platform.deepseek.com/) (DeepSeek).

## Privacy

- API keys live in `chrome.storage.local` on this machine. They are only ever sent to the provider
  you selected, in the generate request.
- Preferences (provider, models, tone, angles) live in `chrome.storage.sync`.
- Scraped profile data is sent to your selected LLM provider as prompt context, and nowhere else.
  There is no backend server — the extension talks directly to the provider's API.

## Project layout

```
src/
  background/service-worker.ts   message router; owns API keys + LLM calls
  content/scraper.ts             scrapes the profile DOM
  popup/                         angle picker, Generate, editable result, Copy
  options/                       provider, API keys, models, tone, angle editor
  lib/                           types, message protocol, storage, prompt, providers
```

See `docs/ARCHITECTURE.md` for the message protocol and data flow, and `docs/DECISIONS.md` for
why things are the way they are.

## License

MIT — see [LICENSE](LICENSE).
