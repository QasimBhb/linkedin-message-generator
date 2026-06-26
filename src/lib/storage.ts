import type { Angle, Secrets, Settings } from './types';

export const DEFAULT_ANGLES: Angle[] = [
  {
    id: 'networking',
    label: 'Networking',
    template:
      'Write a {tone} LinkedIn connection message to {name}, {currentTitle} at {currentCompany}. Goal: genuine professional networking. Reference something specific from their background. Keep it under 300 characters.',
  },
  {
    id: 'sales',
    label: 'Sales / Pitch',
    template:
      'Write a {tone} LinkedIn message to {name}, {currentTitle} at {currentCompany}. Goal: open a sales conversation. Lead with relevance to their role/company, not a hard pitch. Keep it short.',
  },
  {
    id: 'job',
    label: 'Job / Recruiting',
    template:
      'Write a {tone} LinkedIn message to {name}, {currentTitle} at {currentCompany}. Goal: explore a job or recruiting opportunity. Respect their time and be specific about why them.',
  },
  {
    id: 'collab',
    label: 'Collaboration',
    template:
      'Write a {tone} LinkedIn message to {name}, {currentTitle} at {currentCompany}. Goal: propose a partnership or collaboration. Make the mutual benefit clear and concrete.',
  },
];

export const DEFAULT_SETTINGS: Settings = {
  provider: 'gemini',
  geminiModel: 'gemini-2.0-flash',
  deepseekModel: 'deepseek-chat',
  tone: 'warm, concise, professional, no fluff',
  angles: DEFAULT_ANGLES,
};

const DEFAULT_SECRETS: Secrets = { geminiKey: '', deepseekKey: '' };

export async function getSettings(): Promise<Settings> {
  const stored = await chrome.storage.sync.get(
    DEFAULT_SETTINGS as unknown as Record<string, unknown>,
  );
  return { ...DEFAULT_SETTINGS, ...stored } as Settings;
}

export async function setSettings(patch: Partial<Settings>): Promise<void> {
  await chrome.storage.sync.set(patch);
}

export async function getSecrets(): Promise<Secrets> {
  const stored = await chrome.storage.local.get(
    DEFAULT_SECRETS as unknown as Record<string, unknown>,
  );
  return { ...DEFAULT_SECRETS, ...stored } as Secrets;
}

export async function setSecrets(patch: Partial<Secrets>): Promise<void> {
  await chrome.storage.local.set(patch);
}
