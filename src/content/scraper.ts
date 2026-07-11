import type { ContentRequest, ContentResponse } from '../lib/messages';
import type { Education, Experience, Profile } from '../lib/types';

const ABOUT_MAX = 1500;
const MAX_SKILLS = 25;

const EMPLOYMENT_TYPES = [
  'Full-time',
  'Part-time',
  'Contract',
  'Freelance',
  'Internship',
  'Self-employed',
  'Apprenticeship',
  'Seasonal',
];

/**
 * LinkedIn's profile redesign ships hashed class names (`.e6590096`) and no `aria-hidden` text
 * spans, so element-level selectors are worthless. The only stable anchors are the section <h2>
 * headings and the rendered text layout, so we parse innerText lines per section.
 */

function lines(el: Element | null): string[] {
  const text = (el as HTMLElement | null)?.innerText ?? '';
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

function normalize(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

/** Sections are only identifiable by their heading text, e.g. "Skills (26)". */
function sectionByHeading(prefix: string): Element | null {
  const sections = Array.from(document.querySelectorAll('main section'));
  return (
    sections.find((s) =>
      normalize(s.querySelector('h2')?.textContent ?? '')
        .toLowerCase()
        .startsWith(prefix.toLowerCase()),
    ) ?? null
  );
}

/** "… more" expanders sit between entries and would shift the title lookback. */
function isNoise(line: string): boolean {
  return /^(…\s*more|see more|show all|…)$/i.test(line);
}

function sectionLines(prefix: string): string[] {
  const body = lines(sectionByHeading(prefix));
  return body.slice(1).filter((l) => !isNoise(l)); // drop the heading itself
}

/** "Apr 2026 - Present · 4 mos", "Nov 2015 - Nov 2019", "2001 – 2004" */
function isDateRange(line: string): boolean {
  return /\d{4}/.test(line) && /[-–]/.test(line);
}

/** "10 yrs 9 mos" — the grouped-company total, not a role. */
function isDurationOnly(line: string): boolean {
  return /^\d+\s*(yr|yrs|mo|mos)\b/.test(line) && !/\d{4}/.test(line);
}

function isEmploymentType(line: string): boolean {
  return EMPLOYMENT_TYPES.includes(line);
}

function isBullet(line: string): boolean {
  return /^[•·▪-]/.test(line);
}

/**
 * The <main> element — not the window — is the scroll container, and Experience/Education/Skills
 * are not in the DOM until it is scrolled. Scroll to the bottom, then restore the user's position.
 */
async function loadLazySections(): Promise<void> {
  const main = document.querySelector('main');
  if (!main) return;
  const original = main.scrollTop;
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  for (let i = 0; i < 30; i++) {
    main.scrollTop += 800;
    await sleep(250);
    if (main.scrollTop + main.clientHeight >= main.scrollHeight - 5) break;
  }
  await sleep(600);
  main.scrollTop = original;
}

function scrapeTopCard(): {
  name: string | null;
  headline: string | null;
  location: string | null;
} {
  const card = lines(document.querySelector('main section'));
  const name = card[0] ?? null;

  // Layout: name / "· 1st" / headline / location / "·" / "Contact info" / ...
  const degreeIdx = card.findIndex((l) => /^·\s*\d?(st|nd|rd|th)$/i.test(l));
  const headlineIdx = degreeIdx >= 0 ? degreeIdx + 1 : 1;
  const headline = card[headlineIdx] ?? null;

  const after = card[headlineIdx + 1];
  const location = after && after !== '·' && after !== 'Contact info' ? after : null;

  return { name, headline, location };
}

function scrapeAbout(): string | null {
  const body = sectionLines('About');
  if (!body.length) return null;
  return body.join(' ').slice(0, ABOUT_MAX);
}

function scrapeExperiences(): Experience[] {
  const body = sectionLines('Experience');
  const out: Experience[] = [];

  // Roles at one company are grouped under a company header followed by a total duration.
  let groupCompany: string | null = null;

  for (let i = 0; i < body.length; i++) {
    const line = body[i];

    if (isDurationOnly(line) && i > 0) {
      groupCompany = body[i - 1];
      continue;
    }

    if (!isDateRange(line) || isBullet(line)) continue;

    const prev = body[i - 1];
    const prev2 = body[i - 2];
    if (!prev) continue;

    let title: string | null;
    let company: string | null = groupCompany;

    if (isEmploymentType(prev)) {
      // Title / Full-time / Dates  (company came from the group header)
      title = prev2 ?? null;
    } else if (prev.includes('·')) {
      // Title / Company · Full-time / Dates
      company = normalize(prev.split('·')[0]) || groupCompany;
      title = prev2 ?? null;
    } else if (prev2 && !isDateRange(prev2) && !isBullet(prev2)) {
      // Title / Company / Dates
      company = prev;
      title = prev2;
    } else {
      // Title / Dates
      title = prev;
    }

    if (title && !isBullet(title)) {
      out.push({ title, company, duration: line });
    }
  }

  return out;
}

function scrapeEducation(): Education[] {
  const body = sectionLines('Education');
  const out: Education[] = [];

  for (let i = 0; i < body.length; i++) {
    if (!isDateRange(body[i])) continue;
    const degree = body[i - 1] ?? null;
    const school = body[i - 2] ?? null;
    if (school) out.push({ school, degree });
  }

  // Schools without a listed date range: fall back to the first line.
  if (!out.length && body.length) {
    out.push({ school: body[0], degree: body[1] ?? null });
  }

  return out;
}

function scrapeSkills(): string[] {
  return sectionLines('Skills')
    .filter((l) => !/^\d+\s+endorsement/i.test(l) && l !== 'Endorse')
    .slice(0, MAX_SKILLS);
}

/** Headline reads "Chief Architect at Gallagher Bassett" — usable when Experience is missing. */
function fromHeadline(headline: string | null): {
  title: string | null;
  company: string | null;
} {
  if (!headline) return { title: null, company: null };
  const m = /^(.+?)\s+at\s+(.+)$/i.exec(headline);
  return m ? { title: m[1], company: m[2] } : { title: null, company: null };
}

async function scrapeProfileFromDom(): Promise<Profile> {
  await loadLazySections();

  const top = safe(scrapeTopCard, {
    name: null,
    headline: null,
    location: null,
  });
  const experiences = safe(scrapeExperiences, [] as Experience[]);
  const current = experiences[0];
  const fallback = fromHeadline(top.headline);

  return {
    name: top.name ?? document.title.split('|')[0].trim() ?? null,
    headline: top.headline,
    location: top.location,
    about: safe(scrapeAbout, null),
    currentTitle: current?.title ?? fallback.title,
    currentCompany: current?.company ?? fallback.company,
    experiences,
    education: safe(scrapeEducation, [] as Education[]),
    skills: safe(scrapeSkills, [] as string[]),
  };
}

chrome.runtime.onMessage.addListener(
  (msg: ContentRequest, _sender, sendResponse: (r: ContentResponse) => void) => {
    if (msg?.type !== 'SCRAPE_PROFILE') return false;

    void scrapeProfileFromDom()
      .then((profile) => {
        if (!profile.name) {
          sendResponse({
            ok: false,
            error:
              'Could not read this profile. Make sure the page has finished loading, then try again.',
          });
          return;
        }
        sendResponse({ ok: true, profile });
      })
      .catch((err: unknown) => {
        sendResponse({
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        });
      });

    return true; // async response
  },
);
