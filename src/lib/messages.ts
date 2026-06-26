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

export function scrapeProfile(tabId: number): Promise<ContentResponse> {
  const msg: ContentRequest = { type: 'SCRAPE_PROFILE' };
  return chrome.tabs.sendMessage(tabId, msg);
}

export function requestGenerate(
  profile: Profile,
  angleId: string,
): Promise<BgResponse> {
  const msg: BgRequest = { type: 'GENERATE', profile, angleId };
  return chrome.runtime.sendMessage(msg);
}
