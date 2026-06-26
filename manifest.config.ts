import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: 'LinkedIn Message Generator',
  version: '0.1.0',
  description:
    'Scrape a LinkedIn profile and generate tailored outreach via Gemini or DeepSeek.',
  permissions: ['storage', 'activeTab', 'scripting', 'tabs'],
  host_permissions: [
    'https://www.linkedin.com/*',
    'https://generativelanguage.googleapis.com/*',
    'https://api.deepseek.com/*',
  ],
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['https://www.linkedin.com/in/*'],
      js: ['src/content/scraper.ts'],
    },
  ],
  action: {
    default_popup: 'src/popup/index.html',
  },
  options_page: 'src/options/index.html',
  icons: {
    '16': 'public/icons/icon16.png',
    '48': 'public/icons/icon48.png',
    '128': 'public/icons/icon128.png',
  },
});
