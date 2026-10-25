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
 * `{event.country}`, so they take effect whenever `setVariables` sets it.
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

  followEventCountries(question, survey);
  applyMode(question, survey, matchMode(question));
}

function followEventCountries(question: Question, survey: SurveyModel) {
  const order = () => {
    const countries: unknown = survey.getVariable('event.countries');
    if (!question.isDisposed && Array.isArray(countries)) {
      orderChoices(question, countries as string[], survey.locale || 'en');
    }
  };

  order();
  // SurveyJS reports variable names lower-cased, and skips unchanged values,
  // so a new locale needs its own trigger.
  survey.onVariableChanged.add((_, options) => {
    if (options.name.toLowerCase() === 'event.countries') {
      order();
    }
  });
  survey.onLocaleChangedEvent.add(order);
}

function applyMode(
  question: Question,
  survey: SurveyModel,
  mode: GroupCountryMatch,
) {
  if (mode === 'free') {
    return;
  }

  question.defaultValueExpression ??= '{event.country}';

  const value = valueReference(question);
  const validator = new ExpressionValidator(
    `{event.country} empty or ${value} empty or ${value} = {event.country}`,
  );
  validator.locText.setJson(MESSAGES[mode]);
  question.validators.push(validator);

  if (mode === 'warn') {
    validator.notificationType = 'warning';
    // A warning never stops navigation, so one checked only on "Next" would
    // never be read. Shown as soon as the answer is stored instead; an
    // address reports its country's change as its own.
    const owner = parentOf(question) ?? question;
    survey.onValueChanged.add((_, options) => {
      if (options.question === owner) {
        question.validate(true);
      }
    });
  }

  if (mode === 'strict') {
    // Editable again when no group is known, rather than stuck empty.
    const locked = '{event.country} empty';
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

// The event's countries first, the others by their name in `locale`.
function orderChoices(
  question: Question,
  countries: readonly string[],
  locale: string,
) {
  const content = (
    question as Question & { contentQuestion?: QuestionSelectBase }
  ).contentQuestion;
  if (!content) {
    return;
  }

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
