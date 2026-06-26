import type { Angle, Profile } from './types';

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? '');
}

export function buildPrompt(
  profile: Profile,
  angle: Angle,
  tone: string,
): string {
  const head = interpolate(angle.template, {
    tone,
    name: profile.name ?? 'this person',
    currentTitle: profile.currentTitle ?? 'their role',
    currentCompany: profile.currentCompany ?? 'their company',
  });

  const context = JSON.stringify(profile, null, 2);

  return [
    head,
    '',
    'Use this scraped LinkedIn profile data as context. Only use facts present here; do not invent details:',
    '```json',
    context,
    '```',
    '',
    'Return only the message text, ready to paste. No preamble, no quotes, no explanation.',
  ].join('\n');
}
