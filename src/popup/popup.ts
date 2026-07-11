import { getSettings } from '../lib/storage';
import { requestGenerate, scrapeProfile } from '../lib/messages';
import type { Profile, Settings } from '../lib/types';

const LINKEDIN_PROFILE_RE = /^https:\/\/www\.linkedin\.com\/in\/.+/;

const guardEl = document.getElementById('guard') as HTMLDivElement;
const mainEl = document.getElementById('main') as HTMLElement;
const providerLabelEl = document.getElementById(
  'provider-label',
) as HTMLSpanElement;
const angleSelectEl = document.getElementById(
  'angle-select',
) as HTMLSelectElement;
const generateBtnEl = document.getElementById(
  'generate-btn',
) as HTMLButtonElement;
const debugLineEl = document.getElementById('debug-line') as HTMLDivElement;
const debugToggleEl = document.getElementById(
  'debug-toggle',
) as HTMLButtonElement;
const debugContentEl = document.getElementById(
  'debug-content',
) as HTMLDivElement;
const errorAreaEl = document.getElementById('error-area') as HTMLDivElement;
const resultTextareaEl = document.getElementById(
  'result-textarea',
) as HTMLTextAreaElement;
const copyBtnEl = document.getElementById('copy-btn') as HTMLButtonElement;
const copyFeedbackEl = document.getElementById(
  'copy-feedback',
) as HTMLSpanElement;
const optionsLinkEl = document.getElementById(
  'options-link',
) as HTMLButtonElement;

let activeTabId: number | null = null;

function showError(message: string): void {
  errorAreaEl.textContent = message;
  errorAreaEl.classList.remove('hidden');
}

function clearError(): void {
  errorAreaEl.textContent = '';
  errorAreaEl.classList.add('hidden');
}

function providerDisplayName(provider: Settings['provider']): string {
  return provider === 'gemini' ? 'Gemini' : 'DeepSeek';
}

function populateAngles(settings: Settings): void {
  angleSelectEl.innerHTML = '';
  for (const angle of settings.angles) {
    const option = document.createElement('option');
    option.value = angle.id;
    option.textContent = angle.label;
    angleSelectEl.appendChild(option);
  }
}

function showDebugLine(profile: Profile): void {
  debugContentEl.textContent =
    `name: ${profile.name ?? '(none)'}\n` +
    `title: ${profile.currentTitle ?? '(none)'}\n` +
    `company: ${profile.currentCompany ?? '(none)'}`;
  debugLineEl.classList.remove('hidden');
  debugContentEl.classList.add('hidden');
  debugToggleEl.textContent = 'Scraped profile ▸';
}

function setGenerating(isGenerating: boolean): void {
  generateBtnEl.disabled = isGenerating;
  generateBtnEl.textContent = isGenerating ? 'Generating...' : 'Generate';
}

async function init(): Promise<void> {
  const settings = await getSettings();
  populateAngles(settings);
  providerLabelEl.textContent = `via ${providerDisplayName(settings.provider)}`;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab?.url ?? '';

  if (!tab?.id || !LINKEDIN_PROFILE_RE.test(url)) {
    guardEl.classList.remove('hidden');
    mainEl.classList.add('hidden');
    generateBtnEl.disabled = true;
    return;
  }

  activeTabId = tab.id;
}

debugToggleEl.addEventListener('click', () => {
  const isHidden = debugContentEl.classList.contains('hidden');
  debugContentEl.classList.toggle('hidden', !isHidden);
  debugToggleEl.textContent = isHidden
    ? 'Scraped profile ▾'
    : 'Scraped profile ▸';
});

generateBtnEl.addEventListener('click', async () => {
  if (activeTabId === null) {
    showError('No active LinkedIn tab found.');
    return;
  }

  clearError();
  debugLineEl.classList.add('hidden');
  copyBtnEl.disabled = true;
  setGenerating(true);

  try {
    const scrapeResult = await scrapeProfile(activeTabId);
    if (!scrapeResult.ok) {
      showError(scrapeResult.error);
      return;
    }
    showDebugLine(scrapeResult.profile);

    const angleId = angleSelectEl.value;
    const genResult = await requestGenerate(scrapeResult.profile, angleId);
    if (!genResult.ok) {
      showError(genResult.error);
      return;
    }

    resultTextareaEl.value = genResult.text;
    copyBtnEl.disabled = false;
  } catch (err) {
    showError(err instanceof Error ? err.message : String(err));
  } finally {
    setGenerating(false);
  }
});

copyBtnEl.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(resultTextareaEl.value);
    copyFeedbackEl.classList.remove('hidden');
    setTimeout(() => copyFeedbackEl.classList.add('hidden'), 1500);
  } catch (err) {
    showError(
      err instanceof Error ? err.message : 'Failed to copy to clipboard.',
    );
  }
});

optionsLinkEl.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

void init();
