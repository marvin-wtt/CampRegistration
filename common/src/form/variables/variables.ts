import type { SurveyModel } from 'survey-core';
import type { PerCountry, Translatable } from '../../entities/index.js';
import {
  eventCountry,
  eventCountryFields,
  translate,
  utcCarrierToNaiveDateTime,
} from '../../utils/index.js';

export interface Data {
  countries: string[];
  name: Translatable;
  organizer: PerCountry<string>;
  contactEmail: PerCountry<string>;
  maxParticipants: PerCountry<number>;
  // Naive local datetimes, or the backend's UTC carriers of them.
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

type EventVariable = (typeof EVENT_VARIABLES)[number];

type CountryVariable = keyof ReturnType<typeof eventCountryFields>;

// Resolved for the group. A record, so a field added to `eventCountryFields`
// can't be forgotten here.
const COUNTRY_FIELDS: Record<CountryVariable, true> = {
  organizer: true,
  contactEmail: true,
  maxParticipants: true,
  freePlaces: true,
};

const COUNTRY_VARIABLES = Object.keys(COUNTRY_FIELDS) as CountryVariable[];

// Every variable `setVariables` defines. Forms reference them in expressions,
// so the form editor's linter must know them.
export const VARIABLE_NAMES: readonly string[] = [
  ...EVENT_VARIABLES.map((name) => `event.${name}`),
  ...COUNTRY_VARIABLES.map((name) => `event.${name}`),
  'event.country',
  '_validationEnabled',
];

export interface VariableOptions {
  // The group chosen before the form, by its country code. Without one, only
  // a single-country event resolves its per-country fields.
  country?: string | null | undefined;
}

export const setVariables = (
  model: SurveyModel,
  data: Data | undefined,
  options: VariableOptions = {},
) => {
  if (!data) {
    return;
  }

  const locale = model.locale || 'en';
  const { toDate, toTime } = converter(locale);
  // One representation on every side, so expressions over them agree.
  const startAt = naiveDateTime(data.startAt);
  const endAt = naiveDateTime(data.endAt);

  const values: Record<EventVariable, unknown> = {
    countries: data.countries,
    name: translate(data.name, locale),
    startAt,
    startAtDate: toDate(startAt),
    startAtTime: toTime(startAt),
    endAt,
    endAtDate: toDate(endAt),
    endAtTime: toTime(endAt),
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

  const country = eventCountry(data, options.country);
  const fields = eventCountryFields(data, country);
  model.setVariable('event.country', country);
  for (const name of COUNTRY_VARIABLES) {
    model.setVariable(`event.${name}`, fields[name]);
  }
};

// Naive digits as written; a `Date` is the backend's UTC carrier of them.
const naiveDateTime = (value: Date | string): string =>
  typeof value === 'string' ? value : utcCarrierToNaiveDateTime(value);

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
