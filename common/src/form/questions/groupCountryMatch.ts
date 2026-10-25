import {
  ExpressionValidator,
  type ItemValue,
  type PanelModel,
  type IJsonPropertyInfo,
  type Question,
  type QuestionSelectBase,
  type SurveyModel,
} from 'survey-core';
import { APP_LOCALES, type Localized } from '../../locales.js';
import { COUNTRY_CODES, countryName } from '../../utils/index.js';

/**
 * How a country question relates to the group chosen before the form:
 * `strict` shows the group's country, read-only; `warn` prefills it and warns
 * when the answer differs; `free` asks without a default.
 */
const GROUP_COUNTRY_MATCH_MODES = ['strict', 'warn', 'free'] as const;

export type GroupCountryMatch = (typeof GROUP_COUNTRY_MATCH_MODES)[number];

const GROUP_COUNTRY_MATCH = 'groupCountryMatch';

export const groupCountryMatchProperty: IJsonPropertyInfo = {
  name: GROUP_COUNTRY_MATCH,
  choices: [...GROUP_COUNTRY_MATCH_MODES],
  default: 'strict',
  category: 'general',
  visibleIndex: 4,
};

// Every country by its name in every app locale; SurveyJS picks the locale.
export const countryChoices = (): { value: string; text: object }[] =>
  COUNTRY_CODES.map((code) => ({
    value: code,
    text: Object.fromEntries(
      APP_LOCALES.map((locale) => [locale, countryName(code, locale)]),
    ),
  }));

const MESSAGES: Record<'strict' | 'warn', Localized> = {
  strict: {
    en: "This has to be your group's country.",
    de: 'Hier muss das Land deiner Gruppe stehen.',
    fr: 'Il doit s’agir du pays de ton groupe.',
    pl: 'Musi to być kraj Twojej grupy.',
    cs: 'Musí to být země tvé skupiny.',
  },
  warn: {
    en: 'This country differs from the group you are registering for. It does not change your group — to switch, use “Change group” at the top of the page.',
    de: 'Dieses Land weicht von der Gruppe ab, für die du dich anmeldest. Deine Gruppe ändert sich dadurch nicht – wechseln kannst du sie oben über „Gruppe wechseln“.',
    fr: 'Ce pays diffère du groupe pour lequel tu t’inscris. Cela ne change pas ton groupe — pour en changer, utilise « Changer de groupe » en haut de la page.',
    pl: 'Ten kraj różni się od grupy, do której się zapisujesz. Nie zmienia to Twojej grupy — aby ją zmienić, użyj opcji „Zmień grupę” u góry strony.',
    cs: 'Tato země se liší od skupiny, do které se registruješ. Tvou skupinu to nezmění — pro změnu použij „Změnit skupinu“ nahoře na stránce.',
  },
};

/**
 * Wires a country question to the group: the event's countries first among
 * its choices, and the rules of its mode. The rules are expressions over
 * `{event.group}`, so they take effect whenever `setVariables` sets it.
 */
export function applyGroupCountry(question: Question) {
  // An address wires its own country: this hook runs before its mode loads.
  if (parentOf(question)?.getType() !== 'address') {
    wire(question);
  }
}

export function applyAddressCountry(address: Question) {
  const country = (
    address as Question & { contentPanel?: PanelModel }
  ).contentPanel?.getQuestionByName('country');
  if (country) {
    wire(country);
  }
}

function wire(question: Question) {
  const survey = question.survey as SurveyModel | undefined;
  // A design surface is what the editor saves: no runtime wiring belongs there.
  if (!survey || question.isDesignMode) {
    return;
  }

  followSurvey(survey);
  orderChoices(question, survey);
  applyMode(question, matchMode(question));
}

const followedSurveys = new WeakSet<SurveyModel>();

/**
 * Reorders every country question when the event's countries or the locale
 * change — survey events a question type has no hook for. Registered once
 * per survey: questions of dynamic panels come and go, and per-question
 * handlers on the survey would outlive them.
 */
function followSurvey(survey: SurveyModel) {
  if (followedSurveys.has(survey)) {
    return;
  }
  followedSurveys.add(survey);

  const orderAll = () => {
    for (const question of survey.getAllQuestions(false, false, true)) {
      if (question.getType() === 'country') {
        orderChoices(question, survey);
      }
    }
  };

  // SurveyJS reports variable names lower-cased, and skips unchanged values,
  // so a new locale needs its own trigger.
  survey.onVariableChanged.add((_, options) => {
    if (options.name.toLowerCase() === 'event.countries') {
      orderAll();
    }
  });
  survey.onLocaleChangedEvent.add(orderAll);
}

/**
 * A warning never stops navigation, so one checked only on "Next" would never
 * be read: it is shown as soon as the answer changes instead. Called from the
 * country question's own `onValueChanged`, which an address's country shares.
 */
export function showGroupCountryWarning(question: Question) {
  if (!question.isDesignMode && matchMode(question) === 'warn') {
    question.validate(true);
  }
}

function applyMode(question: Question, mode: GroupCountryMatch) {
  if (mode === 'free') {
    return;
  }

  question.defaultValueExpression ??= '{event.group}';

  const value = valueReference(question);
  const validator = new ExpressionValidator(
    `{event.group} empty or ${value} empty or ${value} = {event.group}`,
  );
  validator.locText.setJson(MESSAGES[mode]);
  question.validators.push(validator);

  if (mode === 'warn') {
    validator.notificationType = 'warning';
  }

  if (mode === 'strict') {
    // Editable again when no group is known, rather than stuck empty.
    const locked = '{event.group} empty';
    question.enableIf = question.enableIf
      ? `(${question.enableIf}) and ${locked}`
      : locked;
    // SurveyJS skips the validators of read-only questions; this one is only
    // locked for the respondent, the server must still reject a mismatch.
    (
      question as unknown as { canCollectErrors: () => boolean }
    ).canCollectErrors = () => true;
  }
}

// An address hands its mode to its nested country.
function matchMode(question: Question): GroupCountryMatch {
  const parent = parentOf(question);
  const owner = parent?.getType() === 'address' ? parent : question;
  const mode: unknown = owner.getPropertyValue(GROUP_COUNTRY_MATCH);

  return GROUP_COUNTRY_MATCH_MODES.includes(mode as GroupCountryMatch)
    ? (mode as GroupCountryMatch)
    : 'strict';
}

// How an expression on the question itself reads its value.
function valueReference(question: Question): string {
  const name = question.getValueName();
  switch (parentOf(question)?.getType()) {
    case undefined:
      return `{${name}}`;
    case 'paneldynamic':
      return `{panel.${name}}`;
    default:
      return `{composite.${name}}`;
  }
}

// Typed as always set, but null outside a composite or dynamic panel.
function parentOf(question: Question): Question | null {
  return question.parentQuestion;
}

// The event's countries first, the others by their name in the locale.
function orderChoices(question: Question, survey: SurveyModel) {
  const countries: unknown = survey.getVariable('event.countries');
  const content = (
    question as Question & { contentQuestion?: QuestionSelectBase }
  ).contentQuestion;
  if (!content || !Array.isArray(countries)) {
    return;
  }
  const locale = survey.locale || 'en';

  const own = (item: ItemValue) => countries.indexOf(String(item.value));
  const choices = content.choices as ItemValue[];
  content.choices = [...choices].sort((a, b) => {
    const [ownA, ownB] = [own(a), own(b)];
    if (ownA >= 0 || ownB >= 0) {
      return (ownA < 0 ? Infinity : ownA) - (ownB < 0 ? Infinity : ownB);
    }
    return a.calculatedText.localeCompare(b.calculatedText, locale);
  });
}
