import { SurveyModel } from 'survey-core';

type Translatable<T = string> = T | Record<string, T>;

export type Data = {
  countries: string[];
  name: Translatable;
  organizer: Translatable;
  contactEmail: Translatable;
  maxParticipants: Translatable<number>;
  startAt: Date | string;
  endAt: Date | string;
  minAge: number;
  maxAge: number;
  location: Translatable;
  price: number;
  freePlaces: Translatable<number> | null;
};

export const setVariables = (model: SurveyModel, data: Data | undefined) => {
  if (!data) {
    return;
  }

  const { t, toDate, toTime } = converter(model.locale);

  model.setVariable('camp.countries', data.countries);
  model.setVariable('camp.name', t(data.name));
  model.setVariable('camp.organizer', t(data.organizer));
  model.setVariable('camp.contactEmail', t(data.contactEmail));
  model.setVariable('camp.startAt', data.startAt);
  model.setVariable('camp.startAtDate', toDate(data.startAt));
  model.setVariable('camp.startAtTime', toTime(data.startAt));
  model.setVariable('camp.endAt', data.endAt);
  model.setVariable('camp.endAtDate', toDate(data.endAt));
  model.setVariable('camp.endAtTime', toTime(data.endAt));
  model.setVariable('camp.minAge', data.minAge);
  model.setVariable('camp.maxAge', data.maxAge);
  model.setVariable('camp.location', t(data.location));
  model.setVariable('camp.price', data.price);
  model.setVariable('camp.freePlaces', data.freePlaces);

  model.setVariable('_validationEnabled', model.validationEnabled);
};

const converter = (locale: string) => {
  const fallbackLocale = 'en-US';

  function toDate(timestamp: Date | string): string | undefined {
    const date =
      typeof timestamp === 'string' ? new Date(timestamp) : timestamp;

    try {
      return toDateString(date, locale);
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
    value: Record<string, unknown> | string,
    fallback?: string,
  ): unknown => {
    // Expected input: [value: object | string, locale: string, fallback?: string]
    const defaultFallback = 'en-US';

    if (typeof value === 'string') {
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
