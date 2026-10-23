import { CalculatedValue, type Question, SurveyModel } from 'survey-core';
import type { PerCountry, Translatable } from '../../entities/index.js';
import {
  eventCountry,
  eventCountryFields,
  translate,
} from '../../utils/index.js';

export interface Data {
  countries: string[];
  name: Translatable;
  organizer: PerCountry<string>;
  contactEmail: PerCountry<string>;
  maxParticipants: PerCountry<number>;
  startAt: Date | string;
  endAt: Date | string;
  minAge: number;
  maxAge: number;
  location: Translatable | null;
  price: number;
  freePlaces: PerCountry<number> | null;
  logo?: string | null;
}

// Resolved once per locale.
const EVENT_VARIABLES = [
  'countries',
  'name',
  'startAt',
  'startAtDate',
  'startAtTime',
  'endAt',
  'endAtDate',
  'endAtTime',
  'minAge',
  'maxAge',
  'location',
  'price',
  'logo',
] as const;

// Per-country fields, resolved for the country the registration selects (or
// the event's only one) by `eventCountryFields`.
const COUNTRY_VARIABLES = [
  'organizer',
  'contactEmail',
  'maxParticipants',
  'freePlaces',
] as const;

type EventVariable = (typeof EVENT_VARIABLES)[number];

// Every variable `setVariables` defines. Forms reference them in expressions,
// so the form editor's linter must know them.
export const VARIABLE_NAMES: readonly string[] = [
  ...EVENT_VARIABLES.map((name) => `event.${name}`),
  ...COUNTRY_VARIABLES.map((name) => `event.${name}`),
  'event.country',
  '_validationEnabled',
];

export const setVariables = (model: SurveyModel, data: Data | undefined) => {
  if (!data) {
    return;
  }

  const locale = model.locale || 'en';
  const { toDate, toTime } = converter(locale);

  const values: Record<EventVariable, unknown> = {
    countries: data.countries,
    name: translate(data.name, locale),
    startAt: data.startAt,
    startAtDate: toDate(data.startAt),
    startAtTime: toTime(data.startAt),
    endAt: data.endAt,
    endAtDate: toDate(data.endAt),
    endAtTime: toTime(data.endAt),
    minAge: data.minAge,
    maxAge: data.maxAge,
    location: translate(data.location, locale) ?? null,
    price: data.price,
    logo: data.logo ?? null,
  };

  for (const name of EVENT_VARIABLES) {
    model.setVariable(`event.${name}`, values[name]);
  }

  model.setVariable('_validationEnabled', model.validationEnabled);

  bindSelectedCountry(model, data);
};

// Recomputes on every change of the selected country, however it changes: a
// respondent's answer, `survey.data = …` or `mergeData` alike. Only an
// expression is reactive to all three; `onValueChanged` misses the last two.
// One hidden calculated value per question the country can come from.
const SELECTED_COUNTRY = '__eventCountry';

// SurveyJS reports variable names lower-cased.
const isSelectedCountryValue = (name: string): boolean =>
  name.toLowerCase().startsWith(SELECTED_COUNTRY.toLowerCase());

interface CountryBinding {
  data: Data;
  sources: CountrySource[];
}

interface CountrySource {
  expression: string;
  read: () => unknown;
}

const bindings = new WeakMap<SurveyModel, CountryBinding>();

function bindSelectedCountry(model: SurveyModel, data: Data) {
  let binding = bindings.get(model);
  if (!binding) {
    binding = { data, sources: [] };
    bindings.set(model, binding);
    listenForSelectedCountry(model, binding);
  }

  binding.data = data;
  // Re-derived on every call: the form's questions may have changed since.
  binding.sources = countrySources(model);
  // A design surface is what the editor saves: no runtime wiring belongs there.
  if (!model.isDesignMode) {
    replaceSourceValues(model, binding.sources);
  }

  updateCountryVariables(model, binding);
}

function listenForSelectedCountry(model: SurveyModel, binding: CountryBinding) {
  model.onVariableChanged.add((_, options) => {
    if (isSelectedCountryValue(options.name)) {
      updateCountryVariables(model, binding);
    }
  });

  // The hidden values are runtime wiring, not form content: keep them out of
  // the form's JSON, whoever serializes this model.
  const toJSON = model.toJSON.bind(model);
  model.toJSON = (options) => {
    const json = toJSON(options) as { calculatedValues?: { name: string }[] };
    const own = json.calculatedValues?.filter(
      (value) => !isSelectedCountryValue(value.name),
    );
    if (own?.length) {
      json.calculatedValues = own;
    } else {
      delete json.calculatedValues;
    }

    return json;
  };
}

function replaceSourceValues(model: SurveyModel, sources: CountrySource[]) {
  const values = model.calculatedValues;
  for (let index = values.length - 1; index >= 0; index--) {
    if (isSelectedCountryValue(values[index].name)) {
      values.splice(index, 1);
    }
  }

  sources.forEach((source, index) => {
    values.push(
      new CalculatedValue(SELECTED_COUNTRY + String(index), source.expression),
    );
  });
}

function updateCountryVariables(model: SurveyModel, binding: CountryBinding) {
  const { data } = binding;
  const country = eventCountry(data, selectedCountry(binding.sources));
  const fields = eventCountryFields(data, country);

  model.setVariable('event.country', country);
  for (const name of COUNTRY_VARIABLES) {
    model.setVariable(`event.${name}`, fields[name]);
  }
}

// The first source that holds a country, as the server picks it.
function selectedCountry(sources: CountrySource[]): string | null {
  for (const source of sources) {
    const value = source.read();
    if (typeof value === 'string' && value !== '') {
      return value;
    }
  }

  return null;
}

// The questions holding the registration's country, in the order the server
// extracts it (`RegistrationHelper.country`): a `country` question, then an
// address's country.
function countrySources(model: SurveyModel): CountrySource[] {
  const questions = model.getAllQuestions(false, false, true);
  const tagged = (tag: string): Question | undefined =>
    questions.find(
      (question) => question.getPropertyValue('eventDataType') === tag,
    );

  const sources: CountrySource[] = [];

  const country = tagged('country');
  if (country) {
    const name = country.getValueName();
    sources.push({
      expression: `{${name}}`,
      read: (): unknown => model.getValue(name),
    });
  }

  const address = tagged('address');
  if (address) {
    const name = address.getValueName();
    sources.push({
      expression: `{${name}.country}`,
      read: () =>
        (model.getValue(name) as { country?: unknown } | undefined)?.country,
    });
  }

  return sources;
}

const converter = (locale: string) => {
  const fallbackLocale = 'en-US';

  function toDate(timestamp: Date | string): string | undefined {
    const date =
      typeof timestamp === 'string' ? new Date(timestamp) : timestamp;

    try {
      return toDateString(date, locale);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (ignored) {
      return toDateString(date, fallbackLocale);
    }
  }

  function toDateString(date: Date, locale: string): string {
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  function toTime(timestamp: Date | string): string | undefined {
    const date =
      typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    try {
      return toTimeString(date, locale);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (ignored) {
      return toTimeString(date, fallbackLocale);
    }
  }

  function toTimeString(date: Date, locale: string): string {
    return date.toLocaleTimeString(locale, {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return {
    toDate,
    toTime,
  };
};
