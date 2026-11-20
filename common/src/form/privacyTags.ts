import {
  QuestionPanelDynamicModel,
  type Question,
  type SurveyModel,
} from 'survey-core';
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
  columns?: unknown;
  privacyCategory?: unknown;
  privacyConsent?: unknown;
  privacyConsentFor?: unknown;
}

export interface PrivacyTaggedQuestion {
  name: string;
  /** The key its answer is stored under, when it differs from `name`. */
  valueName?: string;
  /**
   * The value path of the dynamic panel or matrix holding it (`kids`; `kids.*`
   * in a dropdown matrix, whose rows are stored by name), whose entries each
   * hold a copy; absent at the top level.
   */
  within?: string;
  category: string;
}

/** A tagged question's answer key, prefixed by where it lives: `kids.meds`. */
export function answerPath(question: PrivacyTaggedQuestion): string {
  const key = question.valueName ?? question.name;
  return question.within ? `${question.within}.${key}` : key;
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

  const valueNameOf = (element: ElementJson) =>
    typeof element.valueName === 'string' && element.valueName
      ? element.valueName
      : undefined;

  const tag = (element: ElementJson, name: string, within?: string) => {
    if (
      typeof element.privacyCategory === 'string' &&
      element.privacyCategory
    ) {
      const valueName = valueNameOf(element);
      tags.tagged.push({
        name,
        ...(valueName ? { valueName } : {}),
        ...(within ? { within } : {}),
        category: element.privacyCategory,
      });
    }
  };

  // `within`: the value path entries of a dynamic panel or matrix live under.
  // A plain panel stores nothing of its own, so it adds no step.
  const walk = (elements: ElementJson[], within?: string) => {
    for (const element of elements) {
      const type = element.type;
      const name = nameOf(element);
      const path = (key: string) => (within ? `${within}.${key}` : key);

      if (type === 'panel') {
        walk(asElements(element.elements), within);
        continue;
      }
      if (type === 'paneldynamic' && name) {
        walk(
          asElements(element.templateElements),
          path(valueNameOf(element) ?? name),
        );
      }
      // A column takes the question properties, the tag among them: SurveyJS
      // gives it to every cell, so the purge clears the cells too.
      if ((type === 'matrixdynamic' || type === 'matrixdropdown') && name) {
        const matrix = path(valueNameOf(element) ?? name);
        // A dropdown matrix stores its rows by name: `kids.anna.meds`.
        const rows = type === 'matrixdropdown' ? `${matrix}.*` : matrix;
        for (const column of asElements(element.columns)) {
          const columnName = nameOf(column);
          if (columnName) {
            tag(column, columnName, rows);
          }
        }
      }
      if (!name) {
        continue;
      }

      tag(element, name, within);
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
 * Where the answers of special-category questions are stored, as paths without
 * entry indices (`allergies`, `kids.meds`; `kids.*.meds` for a dropdown
 * matrix's rows) — those "Delete sensitive data" clears (docs/privacy.md, 8).
 */
export function specialCategoryAnswerKeys(form: unknown): Set<string> {
  return new Set(
    extractPrivacyTags(form)
      .tagged.filter((question) => isSpecialCategory(question.category))
      .map(answerPath),
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

  // Nested too: the consent gate counts a consent inside a dynamic panel, so
  // its wording is proof like any other.
  for (const question of survey.getAllQuestions(false, false, true)) {
    if (
      question.getType() !== 'boolean' ||
      question.getPropertyValue('privacyConsent') !== true ||
      (options.givenOnly && question.value !== true)
    ) {
      continue;
    }

    texts[consentKey(question)] = [question.title, question.description]
      .filter((part): part is string => !!part)
      // The question's own processor: inside a dynamic panel it fills
      // `{panel.*}` from its entry too.
      .map((part) => question.getProcessedText(part))
      .join('\n\n');
  }

  return texts;
}

/**
 * Where a consent's answer lives: its value name, or `kids[1].consent` inside
 * a dynamic panel, where every entry has its own copy of the question; nested
 * panels prefix their own path.
 */
function consentKey(question: Question): string {
  const owner = question.parentQuestion;
  if (owner instanceof QuestionPanelDynamicModel) {
    const index = owner.panels.findIndex((panel) =>
      panel.questions.includes(question),
    );
    return `${consentKey(owner)}[${index.toString()}].${question.getValueName()}`;
  }

  return question.getValueName();
}

const SPECIAL_CATEGORIES = new Set<unknown>(SPECIAL_CATEGORY_DATA_KEYS);

/** Whether a `privacyCategory` tag names an Art. 9 special category. */
export function isSpecialCategory(category: unknown): boolean {
  return SPECIAL_CATEGORIES.has(category);
}

/** Questions tagged with a special category that hold an answer. */
export function answeredSpecialCategoryQuestions(
  survey: SurveyModel,
): Question[] {
  return survey
    .getAllQuestions(false, false, true)
    .filter(
      (question) =>
        isSpecialCategory(question.getPropertyValue('privacyCategory')) &&
        !question.isEmpty(),
    );
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
