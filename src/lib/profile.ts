import type { Profile } from './types';

/**
 * The scraper reads LinkedIn's rendered text, which they redesign without warning. A partial
 * scrape is the dangerous failure: the LLM will invent whatever is missing and the message reads
 * fine, so nobody notices it is wrong. Treat an incomplete profile as a hard failure instead —
 * never generate from one.
 */

export interface ProfileCheck {
  ok: boolean;
  missing: string[];
}

export function checkProfile(profile: Profile): ProfileCheck {
  const missing: string[] = [];

  if (!profile.name) missing.push('name');
  if (!profile.currentTitle) missing.push('current title');
  if (!profile.currentCompany) missing.push('current company');

  // Something to actually personalise from — otherwise the message is generic filler.
  if (!profile.about && profile.experiences.length === 0) {
    missing.push('about or experience');
  }

  return { ok: missing.length === 0, missing };
}

export function profileErrorMessage(missing: string[]): string {
  return (
    `Could not read this profile properly — missing: ${missing.join(', ')}. ` +
    'No message was generated, because generating from a partial profile invites the AI to ' +
    'make things up. LinkedIn may have changed their page layout; the scraper needs updating.'
  );
}
