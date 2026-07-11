import type { Profile } from './types';

export type ContentRequest = { type: 'SCRAPE_PROFILE' };

export type ContentResponse =
  | { ok: true; profile: Profile }
  | { ok: false; error: string };

export type BgRequest = {
  type: 'GENERATE';
  profile: Profile;
  angleId: string;
};

export type BgResponse =
  | { ok: true; text: string }
  | { ok: false; error: string };

/**
 * The content script is only injected on a real page load. A tab that was already open when the
 * extension loaded, or that reached the profile via LinkedIn's client-side routing, has no
 * listener — sendMessage then rejects with "Receiving end does not exist". Inject and retry.
 */
async function injectScraper(tabId: number): Promise<void> {
  const files = chrome.runtime.getManifest().content_scripts?.[0]?.js;
  if (!files?.length) throw new Error('No content script declared in manifest.');
  await chrome.scripting.executeScript({ target: { tabId }, files });
}

export async function scrapeProfile(tabId: number): Promise<ContentResponse> {
  const msg: ContentRequest = { type: 'SCRAPE_PROFILE' };
  try {
    return await chrome.tabs.sendMessage(tabId, msg);
  } catch {
    await injectScraper(tabId);
    return await chrome.tabs.sendMessage(tabId, msg);
  }
}

export function requestGenerate(
  profile: Profile,
  angleId: string,
): Promise<BgResponse> {
  const msg: BgRequest = { type: 'GENERATE', profile, angleId };
  return chrome.runtime.sendMessage(msg);
}
