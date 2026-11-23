import {
  QuestionPanelDynamicModel,
  type Question,
  type SurveyModel,
} from 'survey-core';
import { SPECIAL_CATEGORY_DATA_KEYS } from '../privacy/catalogue.js';
import {
  consentCategoriesOf,
  consentPurposesOf,
  isConsent,
  privacyCategoryOf,
} from './properties/accessors.js';
import { answerPathOf } from './answerPaths.js';

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
  privacyConsentPurpose?: unknown;
}

export interface PrivacyTaggedQuestion {
  name: string;
  /** The key its answer is stored under, when it differs from `name`. */
  valueName?: string;
  /** In a dynamic panel or matrix, whose entries each hold a copy. */
  nested?: true;
  category: string;
}

export interface ConsentQuestion {
  name: string;
  /** The special categories it unlocks; empty for a consent about other things. */
  categories: string[];
  /** What it is asked for: catalogue purposes such as `newsletter`. */
  purposes: string[];
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

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((key): key is string => typeof key === 'string')
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

  const tag = (element: ElementJson, name: string, nested: boolean) => {
    if (
      typeof element.privacyCategory === 'string' &&
      element.privacyCategory
    ) {
      const valueName = valueNameOf(element);
      tags.tagged.push({
        name,
        ...(valueName ? { valueName } : {}),
        ...(nested ? { nested: true as const } : {}),
        category: element.privacyCategory,
      });
    }
  };

  // A plain panel stores nothing of its own; a dynamic panel or matrix keeps
  // a copy of its questions per entry.
  const walk = (elements: ElementJson[], nested: boolean) => {
    for (const element of elements) {
      const type = element.type;
      const name = nameOf(element);

      if (type === 'panel') {
        walk(asElements(element.elements), nested);
        continue;
      }
      if (type === 'paneldynamic' && name) {
        walk(asElements(element.templateElements), true);
      }
      // A column takes the question properties, the tag among them: SurveyJS
      // gives it to every cell, so the purge clears the cells too.
      if ((type === 'matrixdynamic' || type === 'matrixdropdown') && name) {
        for (const column of asElements(element.columns)) {
          const columnName = nameOf(column);
          if (columnName) {
            tag(column, columnName, true);
          }
        }
      }
      if (!name) {
        continue;
      }

      tag(element, name, nested);
      if (type === 'boolean' && element.privacyConsent === true) {
        tags.consents.push({
          name,
          categories: strings(element.privacyConsentFor),
          purposes: strings(element.privacyConsentPurpose),
        });
      }
    }
  };

  const json = form as { pages?: unknown; elements?: unknown };
  for (const page of asElements(json.pages)) {
    walk(asElements(page.elements), false);
  }
  walk(asElements(json.elements), false);

  return tags;
}

/** The special categories the form's questions are tagged with. */
export function taggedSpecialCategories(form: unknown): string[] {
  return [
    ...new Set(
      extractPrivacyTags(form)
        .tagged.map((question) => question.category)
        .filter(isSpecialCategory),
    ),
  ];
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

/**
 * The answers of every consent asked for `purpose`, one per copy of the
 * question — a dynamic panel holds one per entry. Empty when the form never
 * asks for it.
 */
export function consentAnswers(
  survey: SurveyModel,
  purpose: string,
): unknown[] {
  return survey
    .getAllQuestions(false, false, true)
    .filter(
      (question) =>
        isConsent(question) && consentPurposesOf(question).includes(purpose),
    )
    .map((question) => question.value as unknown);
}

/** The dynamic panel entries holding `question`, innermost first. */
function entriesOf(question: Question): unknown[] {
  const entries: unknown[] = [];
  let current = question;
  while (current.parentQuestion instanceof QuestionPanelDynamicModel) {
    const owner = current.parentQuestion;
    const entry = owner.panels.find((panel) =>
      panel.questions.includes(current),
    );
    if (entry) {
      entries.push(entry);
    }
    current = owner;
  }

  return entries;
}

/**
 * Whether a consent covering `category` was given for `question`. A consent
 * in the question's own panel entry, an enclosing one or at the top level
 * counts on its own; one asked in other entries only when given in all of them.
 */
function consentGiven(
  question: Question,
  category: string,
  consents: Question[],
): boolean {
  const scope = new Set(entriesOf(question));
  const covering = consents.filter((consent) =>
    consentCategoriesOf(consent).includes(category),
  );

  const inScope = (consent: Question) => {
    const [entry] = entriesOf(consent);
    return entry === undefined || scope.has(entry);
  };
  if (covering.some((consent) => inScope(consent) && consent.value === true)) {
    return true;
  }

  // A consent with a copy in scope was decided above, declined or not.
  const byName = new Map<string, Question[]>();
  for (const consent of covering) {
    const name = consent.getValueName();
    byName.set(name, [...(byName.get(name) ?? []), consent]);
  }
  return [...byName.values()].some(
    (copies) =>
      !copies.some(inScope) &&
      copies.every((consent) => consent.value === true),
  );
}

export interface UnconsentedOptions {
  /**
   * Skip answers the person cannot see: SurveyJS drops a hidden question's
   * value only on completion, after the form's own check ran. The server reads
   * the data as sent, so it checks everything.
   */
  visibleOnly?: boolean;
}

/**
 * Questions answered although no consent covering their category was given,
 * read through the survey model — which knows where every answer lives.
 * Categories outside `consentCategories` rest on another basis and are never
 * reported; without it, every category some consent question covers counts.
 * A hidden consent question still counts as not given.
 */
export function unconsentedQuestions(
  survey: SurveyModel,
  consentCategories?: ReadonlySet<string>,
  options: UnconsentedOptions = {},
): Question[] {
  const questions = survey.getAllQuestions(false, false, true);
  const consents = questions.filter(isConsent);
  const relying =
    consentCategories ?? new Set(consents.flatMap(consentCategoriesOf));

  return questions.filter((question) => {
    const category = privacyCategoryOf(question);

    return (
      category !== undefined &&
      relying.has(category) &&
      !question.isEmpty() &&
      (!options.visibleOnly || isShown(question)) &&
      !consentGiven(question, category, consents)
    );
  });
}

/** Whether the person can see the question: itself and every panel above it. */
function isShown(question: Question): boolean {
  return question.isVisible && question.isParentVisible;
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
      !isConsent(question) ||
      (options.givenOnly && question.value !== true)
    ) {
      continue;
    }

    texts[answerPathOf(question)] = [question.title, question.description]
      .filter((part): part is string => !!part)
      // The question's own processor: inside a dynamic panel it fills
      // `{panel.*}` from its entry too.
      .map((part) => question.getProcessedText(part))
      .join('\n\n');
  }

  return texts;
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
        isSpecialCategory(privacyCategoryOf(question)) && !question.isEmpty(),
    );
}

/**
 * Clears every answer to a question tagged with a special category, through
 * SurveyJS itself: it knows where a value lives — "Other" text and comments,
 * dynamic panel entries, `valueName` — so the platform keeps no rules of its own.
 */
export function clearSpecialCategoryAnswers(survey: SurveyModel): void {
  for (const question of survey.getAllQuestions(false, false, true)) {
    if (isSpecialCategory(privacyCategoryOf(question))) {
      question.clearValue();
    }
  }
}
