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
    'Use this scraped LinkedIn profile data as context:',
    '```json',
    context,
    '```',
    '',
    'Every specific claim you make about this person must be traceable to a field above. Do not',
    'invent employers, dates, achievements, mutual connections, or shared interests. If a detail',
    'is null or absent, do not refer to it — write around it rather than guessing.',
    '',
    'Return only the message text, ready to paste. No preamble, no quotes, no explanation.',
  ].join('\n');
}
