import type { ContentRequest, ContentResponse } from '../lib/messages';
import type { Education, Experience, Profile } from '../lib/types';

const ABOUT_MAX = 1500;

function clean(text: string | null | undefined): string | null {
  if (!text) return null;
  const normalized = text.replace(/\s+/g, ' ').trim();
  return normalized.length ? normalized : null;
}

/** LinkedIn duplicates visible text in a hidden a11y sibling; take the visible copy. */
function visibleText(el: Element | null): string | null {
  if (!el) return null;
  const aria = el.querySelector('span[aria-hidden="true"]');
  return clean((aria ?? el).textContent);
}

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

/** Sections are identified by an anchor div (#about, #experience, ...) inside them. */
function sectionFor(anchorId: string): Element | null {
  const anchor = document.querySelector(`div#${anchorId}`);
  return anchor?.closest('section') ?? null;
}

function sectionItems(anchorId: string): Element[] {
  const section = sectionFor(anchorId);
  if (!section) return [];
  return Array.from(section.querySelectorAll('li.artdeco-list__item'));
}

function scrapeName(): string | null {
  return safe(() => clean(document.querySelector('main h1')?.textContent), null);
}

function scrapeHeadline(): string | null {
  return safe(
    () =>
      clean(
        document.querySelector('main .text-body-medium.break-words')
          ?.textContent,
      ),
    null,
  );
}

function scrapeLocation(): string | null {
  return safe(
    () =>
      clean(
        document.querySelector(
          'main .text-body-small.inline.t-black--light.break-words',
        )?.textContent,
      ),
    null,
  );
}

function scrapeAbout(): string | null {
  return safe(() => {
    const section = sectionFor('about');
    if (!section) return null;
    const spans = Array.from(
      section.querySelectorAll('span[aria-hidden="true"]'),
    );
    // First span is the "About" heading itself; the body is the longest one.
    const body = spans
      .map((s) => clean(s.textContent))
      .filter((t): t is string => t !== null && t.toLowerCase() !== 'about')
      .sort((a, b) => b.length - a.length)[0];
    return body ? body.slice(0, ABOUT_MAX) : null;
  }, null);
}

function scrapeExperiences(): Experience[] {
  return safe(
    () =>
      sectionItems('experience')
        .map((li) => {
          const lines = Array.from(
            li.querySelectorAll('span[aria-hidden="true"]'),
          )
            .map((s) => clean(s.textContent))
            .filter((t): t is string => t !== null);
          const [title = null, company = null, duration = null] = lines;
          return {
            title,
            company: company ? company.split('·')[0].trim() : null,
            duration,
          };
        })
        .filter((e) => e.title !== null),
    [] as Experience[],
  );
}

function scrapeEducation(): Education[] {
  return safe(
    () =>
      sectionItems('education')
        .map((li) => {
          const lines = Array.from(
            li.querySelectorAll('span[aria-hidden="true"]'),
          )
            .map((s) => clean(s.textContent))
            .filter((t): t is string => t !== null);
          const [school = null, degree = null] = lines;
          return { school, degree };
        })
        .filter((e) => e.school !== null),
    [] as Education[],
  );
}

function scrapeSkills(): string[] {
  return safe(
    () =>
      sectionItems('skills')
        .map((li) => visibleText(li.querySelector('a, div')))
        .filter((s): s is string => s !== null),
    [] as string[],
  );
}

function scrapeProfileFromDom(): Profile {
  const experiences = scrapeExperiences();
  const current = experiences[0];

  return {
    name: scrapeName(),
    headline: scrapeHeadline(),
    location: scrapeLocation(),
    about: scrapeAbout(),
    currentCompany: current?.company ?? null,
    currentTitle: current?.title ?? null,
    experiences,
    education: scrapeEducation(),
    skills: scrapeSkills(),
  };
}

chrome.runtime.onMessage.addListener(
  (msg: ContentRequest, _sender, sendResponse: (r: ContentResponse) => void) => {
    if (msg?.type !== 'SCRAPE_PROFILE') return false;
    try {
      const profile = scrapeProfileFromDom();
      if (!profile.name) {
        sendResponse({
          ok: false,
          error:
            'Could not read this profile. Scroll the page so it loads fully, then try again.',
        });
        return false;
      }
      sendResponse({ ok: true, profile });
    } catch (err) {
      sendResponse({
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
    return false;
  },
);
