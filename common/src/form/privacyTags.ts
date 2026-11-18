/**
 * Reads the privacy tags of a form (docs/privacy.md, section 5): which
 * questions collect which data category, and which consent question covers
 * which special category. Works on the saved form JSON, so the server can check
 * a form without building a survey.
 */

interface ElementJson {
  type?: unknown;
  name?: unknown;
  valueName?: unknown;
  elements?: unknown;
  templateElements?: unknown;
  privacyCategory?: unknown;
  consent?: unknown;
  consentFor?: unknown;
}

/** Marks a step into each entry of a dynamic panel. */
export const REPEATED = '*';

export interface PrivacyTaggedQuestion {
  name: string;
  /** Where the answer sits in the form data; `REPEATED` steps into each entry. */
  path: string[];
  category: string;
}

export interface ConsentQuestion {
  name: string;
  path: string[];
  /** The special categories it unlocks; empty for a consent about other things. */
  categories: string[];
}

export interface FormPrivacyTags {
  tagged: PrivacyTaggedQuestion[];
  consents: ConsentQuestion[];
}

function asElements(value: unknown): ElementJson[] {
  return Array.isArray(value)
    ? value.filter(
        (element): element is ElementJson =>
          !!element && typeof element === 'object',
      )
    : [];
}

function valueName(element: ElementJson): string | null {
  const name =
    typeof element.valueName === 'string' && element.valueName
      ? element.valueName
      : element.name;

  return typeof name === 'string' && name ? name : null;
}

export function extractPrivacyTags(form: unknown): FormPrivacyTags {
  const tags: FormPrivacyTags = { tagged: [], consents: [] };
  if (!form || typeof form !== 'object') {
    return tags;
  }

  const walk = (elements: ElementJson[], prefix: string[]) => {
    for (const element of elements) {
      const type = element.type;
      const name = valueName(element);

      // A plain panel groups questions without nesting their answers.
      if (type === 'panel') {
        walk(asElements(element.elements), prefix);
        continue;
      }
      if (type === 'paneldynamic' && name) {
        walk(asElements(element.templateElements), [...prefix, name, REPEATED]);
      }
      if (!name) {
        continue;
      }

      const path = [...prefix, name];
      if (
        typeof element.privacyCategory === 'string' &&
        element.privacyCategory
      ) {
        tags.tagged.push({ name, path, category: element.privacyCategory });
      }
      if (type === 'boolean' && element.consent === true) {
        tags.consents.push({
          name,
          path,
          categories: Array.isArray(element.consentFor)
            ? element.consentFor.filter(
                (key): key is string => typeof key === 'string',
              )
            : [],
        });
      }
    }
  };

  const json = form as { pages?: unknown; elements?: unknown };
  for (const page of asElements(json.pages)) {
    walk(asElements(page.elements), []);
  }
  walk(asElements(json.elements), []);

  return tags;
}

/**
 * Categories that rely on consent, are collected by a tagged question, and
 * have no consent question covering them.
 */
export function uncoveredConsentCategories(
  tags: FormPrivacyTags,
  consentCategories: ReadonlySet<string>,
): string[] {
  const covered = new Set(tags.consents.flatMap((entry) => entry.categories));

  return [
    ...new Set(
      tags.tagged
        .map((question) => question.category)
        .filter(
          (category) =>
            consentCategories.has(category) && !covered.has(category),
        ),
    ),
  ];
}

function valuesAt(data: unknown, path: readonly string[]): unknown[] {
  if (path.length === 0) {
    return [data];
  }

  const [step, ...rest] = path;
  if (step === REPEATED) {
    return Array.isArray(data)
      ? data.flatMap((entry) => valuesAt(entry, rest))
      : [];
  }
  if (!data || typeof data !== 'object') {
    return [];
  }

  return valuesAt((data as Record<string, unknown>)[step], rest);
}

function isAnswered(value: unknown): boolean {
  if (value === undefined || value === null || value === '') {
    return false;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  if (typeof value === 'object') {
    return Object.keys(value).length > 0;
  }

  return true;
}

/** Given when the question holds `true` — in every entry, if repeated. */
function isGiven(consent: ConsentQuestion, data: unknown): boolean {
  const values = valuesAt(data, consent.path);

  return values.length > 0 && values.every((value) => value === true);
}

/**
 * Tagged questions answered although no consent covering their category was
 * given. Categories outside `consentCategories` rest on another basis and are
 * never reported.
 */
export function unconsentedAnswers(
  tags: FormPrivacyTags,
  consentCategories: ReadonlySet<string>,
  data: unknown,
): PrivacyTaggedQuestion[] {
  return tags.tagged.filter(
    (question) =>
      consentCategories.has(question.category) &&
      valuesAt(data, question.path).some(isAnswered) &&
      !tags.consents.some(
        (consent) =>
          consent.categories.includes(question.category) &&
          isGiven(consent, data),
      ),
  );
}
