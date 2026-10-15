import { SurveyModel } from 'survey-core';

type Translatable<T = string> = T | Record<string, T>;

export interface Data {
  countries: string[];
  name: Translatable;
  organizer: Translatable;
  contactEmail: Translatable;
  maxParticipants: Translatable<number>;
  startAt: Date | string;
  endAt: Date | string;
  minAge: number;
  maxAge: number;
  location: Translatable | null;
  price: Translatable<number>;
  freePlaces: Translatable<number> | null;
  logo?: string | null;
}

const EVENT_VARIABLES = [
  'countries',
  'name',
  'organizer',
  'contactEmail',
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
  'freePlaces',
  'logo',
] as const;

type EventVariable = (typeof EVENT_VARIABLES)[number];

// Every variable `setVariables` defines. Forms reference them in expressions,
// so the form editor's linter must know them.
export const VARIABLE_NAMES: readonly string[] = [
  ...EVENT_VARIABLES.map((name) => `event.${name}`),
  '_validationEnabled',
];

export const setVariables = (model: SurveyModel, data: Data | undefined) => {
  if (!data) {
    return;
  }

  const { t, toDate, toTime } = converter(model.locale);

  const values: Record<EventVariable, unknown> = {
    countries: data.countries,
    name: t(data.name),
    organizer: t(data.organizer),
    contactEmail: t(data.contactEmail),
    startAt: data.startAt,
    startAtDate: toDate(data.startAt),
    startAtTime: toTime(data.startAt),
    endAt: data.endAt,
    endAtDate: toDate(data.endAt),
    endAtTime: toTime(data.endAt),
    minAge: data.minAge,
    maxAge: data.maxAge,
    location: data.location ? t(data.location) : null,
    price: t(data.price),
    freePlaces: data.freePlaces,
    logo: data.logo ?? null,
  };

  for (const name of EVENT_VARIABLES) {
    model.setVariable(`event.${name}`, values[name]);
  }

  model.setVariable('_validationEnabled', model.validationEnabled);
};

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

  const t = (
    value: Record<string, unknown> | string | number,
    fallback?: string,
  ): unknown => {
    // Expected input: [value: object | string, locale: string, fallback?: string]
    const defaultFallback = 'en-US';

    if (typeof value === 'string' || typeof value === 'number') {
      return value;
    }

    if (locale in value) {
      return value[locale];
    }

    const shortLocale = locale.split('-')[0];
    if (shortLocale in value) {
      return value[shortLocale];
    }

    fallback ??= defaultFallback;
    if (fallback in value) {
      return value[fallback];
    }

    const shortFallback = fallback.split('-')[0];
    if (shortFallback in value) {
      return value[shortFallback];
    }

    return Object.values(value)[0];
  };

  return {
    t,
    toDate,
    toTime,
  };
};
