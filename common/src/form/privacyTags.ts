import type { Question, SurveyModel } from 'survey-core';
import { SPECIAL_CATEGORY_DATA_KEYS } from '../privacy/catalogue.js';

/**
 * Reads the privacy tags of a form (docs/privacy.md, section 5): which
 * questions collect which data category, and which consent question covers
 * which special category. The tags are the platform's own properties, so they
 * are read off the saved form JSON — in the browser and on the server, without
 * building a survey. Answers are only ever read through the survey model.
 */

interface ElementJson {
  type?: unknown;
  name?: unknown;
  valueName?: unknown;
  elements?: unknown;
  templateElements?: unknown;
  privacyCategory?: unknown;
  privacyConsent?: unknown;
  privacyConsentFor?: unknown;
}

export interface PrivacyTaggedQuestion {
  name: string;
  /** The key its answer is stored under, when it differs from `name`. */
  valueName?: string;
  category: string;
}

export interface ConsentQuestion {
  name: string;
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

function nameOf(element: ElementJson): string | null {
  return typeof element.name === 'string' && element.name ? element.name : null;
}

export function extractPrivacyTags(form: unknown): FormPrivacyTags {
  const tags: FormPrivacyTags = { tagged: [], consents: [] };
  if (!form || typeof form !== 'object') {
    return tags;
  }

  const walk = (elements: ElementJson[]) => {
    for (const element of elements) {
      const type = element.type;
      const name = nameOf(element);

      if (type === 'panel') {
        walk(asElements(element.elements));
        continue;
      }
      if (type === 'paneldynamic') {
        walk(asElements(element.templateElements));
      }
      if (!name) {
        continue;
      }

      if (
        typeof element.privacyCategory === 'string' &&
        element.privacyCategory
      ) {
        tags.tagged.push({
          name,
          ...(typeof element.valueName === 'string' && element.valueName
            ? { valueName: element.valueName }
            : {}),
          category: element.privacyCategory,
        });
      }
      if (type === 'boolean' && element.privacyConsent === true) {
        tags.consents.push({
          name,
          categories: Array.isArray(element.privacyConsentFor)
            ? element.privacyConsentFor.filter(
                (key): key is string => typeof key === 'string',
              )
            : [],
        });
      }
    }
  };

  const json = form as { pages?: unknown; elements?: unknown };
  for (const page of asElements(json.pages)) {
    walk(asElements(page.elements));
  }
  walk(asElements(json.elements));

  return tags;
}

/**
 * The keys the answers of special-category questions are stored under —
 * those "Delete sensitive data" clears (docs/privacy.md, 8).
 */
export function specialCategoryAnswerKeys(form: unknown): Set<string> {
  return new Set(
    extractPrivacyTags(form)
      .tagged.filter((question) => isSpecialCategory(question.category))
      .map((question) => question.valueName ?? question.name),
  );
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

function categoriesOf(question: Question): string[] {
  const value: unknown = question.getPropertyValue('privacyConsentFor');

  return Array.isArray(value)
    ? value.filter((key): key is string => typeof key === 'string')
    : [];
}

/**
 * Special categories with a given consent. A consent asked once per dynamic
 * panel entry counts only when given in every entry.
 */
function consentedCategories(questions: Question[]): Set<string> {
  const byName = new Map<string, Question[]>();
  for (const question of questions) {
    if (
      question.getType() === 'boolean' &&
      question.getPropertyValue('privacyConsent') === true
    ) {
      const name = question.getValueName();
      byName.set(name, [...(byName.get(name) ?? []), question]);
    }
  }

  const given = new Set<string>();
  for (const instances of byName.values()) {
    if (instances.every((question) => question.value === true)) {
      for (const category of categoriesOf(instances[0])) {
        given.add(category);
      }
    }
  }

  return given;
}

/**
 * Questions answered although no consent covering their category was given,
 * read through the survey model — which knows where every answer lives.
 * Categories outside `consentCategories` rest on another basis and are never
 * reported; without it, every category some consent question covers counts.
 */
export function unconsentedQuestions(
  survey: SurveyModel,
  consentCategories?: ReadonlySet<string>,
): Question[] {
  const questions = survey.getAllQuestions(false, false, true);
  const given = consentedCategories(questions);
  const relying =
    consentCategories ??
    new Set(
      questions
        .filter((question) => question.getPropertyValue('privacyConsent'))
        .flatMap(categoriesOf),
    );

  return questions.filter((question) => {
    const category: unknown = question.getPropertyValue('privacyCategory');

    return (
      typeof category === 'string' &&
      relying.has(category) &&
      !given.has(category) &&
      !question.isEmpty()
    );
  });
}

/**
 * Clears the answers a declined consent does not cover, so they are never
 * sent (docs/privacy.md, 5). The form calls it before submitting.
 */
export function clearUnconsentedAnswers(
  survey: SurveyModel,
  consentCategories?: ReadonlySet<string>,
): void {
  for (const question of unconsentedQuestions(survey, consentCategories)) {
    question.clearValue();
  }
}

/**
 * The wording of the form's consent questions as the survey shows them:
 * title and description with placeholders filled, before Markdown. Client and
 * server render the same way, so the two can be compared.
 */
export function consentTexts(
  survey: SurveyModel,
  options: { givenOnly?: boolean } = {},
): Record<string, string> {
  const texts: Record<string, string> = {};

  for (const question of survey.getAllQuestions()) {
    if (
      question.getType() !== 'boolean' ||
      question.getPropertyValue('privacyConsent') !== true ||
      (options.givenOnly && question.value !== true)
    ) {
      continue;
    }

    texts[question.getValueName()] = [question.title, question.description]
      .filter((part): part is string => !!part)
      .map((part) => survey.processText(part, true))
      .join('\n\n');
  }

  return texts;
}

const SPECIAL_CATEGORIES = new Set<unknown>(SPECIAL_CATEGORY_DATA_KEYS);

/** Whether a `privacyCategory` tag names an Art. 9 special category. */
export function isSpecialCategory(category: unknown): boolean {
  return SPECIAL_CATEGORIES.has(category);
}

/**
 * Clears every answer to a question tagged with a special category, through
 * SurveyJS itself: it knows where a value lives — "Other" text and comments,
 * dynamic panel entries, `valueName` — so the platform keeps no rules of its own.
 */
export function clearSpecialCategoryAnswers(survey: SurveyModel): void {
  for (const question of survey.getAllQuestions(false, false, true)) {
    if (isSpecialCategory(question.getPropertyValue('privacyCategory'))) {
      question.clearValue();
    }
  }
}
