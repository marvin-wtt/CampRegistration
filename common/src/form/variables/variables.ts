import type { SurveyModel } from 'survey-core';
import type { PerGroup, Translatable } from '../../entities/index.js';
import {
  eventGroup,
  eventGroupFields,
  translate,
  utcCarrierToNaiveDateTime,
} from '../../utils/index.js';

export interface Data {
  countries: string[];
  name: Translatable;
  organizer: PerGroup<string>;
  contactEmail: PerGroup<string>;
  maxParticipants: PerGroup<number>;
  // Naive local datetimes, or the backend's UTC carriers of them.
  startAt: Date | string;
  endAt: Date | string;
  minAge: number;
  maxAge: number;
  location: Translatable | null;
  price: number;
  freePlaces: PerGroup<number> | null;
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

type GroupVariable = keyof ReturnType<typeof eventGroupFields>;

// Resolved for the group. A record, so a field added to `eventGroupFields`
// can't be forgotten here.
const GROUP_FIELDS: Record<GroupVariable, true> = {
  organizer: true,
  contactEmail: true,
  maxParticipants: true,
  freePlaces: true,
};

const GROUP_VARIABLES = Object.keys(GROUP_FIELDS) as GroupVariable[];

// Every variable `setVariables` defines. Forms reference them in expressions,
// so the form editor's linter must know them.
export const VARIABLE_NAMES: readonly string[] = [
  ...EVENT_VARIABLES.map((name) => `event.${name}`),
  ...GROUP_VARIABLES.map((name) => `event.${name}`),
  'event.group',
  '_validationEnabled',
];

export interface VariableOptions {
  // The group chosen before the form, by its country code. Without one, only
  // a single-group event resolves its per-group fields.
  group?: string | null | undefined;
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

  const group = eventGroup(data, options.group);
  const fields = eventGroupFields(data, group);
  model.setVariable('event.group', group);
  for (const name of GROUP_VARIABLES) {
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
