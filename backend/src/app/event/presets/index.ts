import camp from './camp/index.js';
import seminar from './seminar/index.js';
import general from './general/index.js';
import type { EventPreset } from './types.js';
import { localeForCountry } from './locales.js';
import { SurveyModel } from 'survey-core';
import type { EventPresetName } from '@camp-registration/common/entities';

export const EVENT_PRESETS: Record<EventPresetName, EventPreset> = {
  camp,
  seminar,
  general,
};

function filterTranslatedValue(value: unknown, locales: string[]): unknown {
  if (typeof value !== 'object' || value === null) {
    return value;
  }

  const entries = Object.entries(value as Record<string, unknown>).filter(
    ([locale]) => locales.includes(locale),
  );

  // Never drop every translation - fall back to the untouched value instead.
  return entries.length > 0 ? Object.fromEntries(entries) : value;
}

function filterTableTemplateLocales(
  tableTemplates: Record<string, unknown>[],
  locales: string[],
): Record<string, unknown>[] {
  return tableTemplates.map((template) => {
    const columns = Array.isArray(template.columns)
      ? template.columns.map((column: unknown) => {
          if (typeof column !== 'object' || column === null) {
            return column;
          }

          return {
            ...column,
            label: filterTranslatedValue(
              (column as Record<string, unknown>).label,
              locales,
            ),
          };
        })
      : template.columns;

    return {
      ...template,
      title: filterTranslatedValue(template.title, locales),
      columns,
    };
  });
}

export function getEventPreset(
  name: EventPresetName | null | undefined,
  locales?: string[],
): EventPreset {
  const preset = name ? EVENT_PRESETS[name] : EVENT_PRESETS.camp;

  if (!locales || locales.length === 0) {
    return preset;
  }

  const model = new SurveyModel(preset.form);
  const form = model.toJSON({ locales: ['default', ...locales] }) as Record<
    string,
    unknown
  >;

  const tableTemplates = filterTableTemplateLocales(
    preset.tableTemplates,
    locales,
  );

  return {
    ...preset,
    form,
    tableTemplates,
  };
}

export function defaultMessageTemplatesForCountries(
  countries: string[],
  presetName?: EventPresetName | null,
) {
  const templates = getEventPreset(presetName).messageTemplates;

  return countries.flatMap((country) => {
    const code = localeForCountry(country);

    return Object.entries(templates).map(([trigger, { subject, body }]) => ({
      trigger,
      country,
      subject: subject[code],
      body: body[code],
    }));
  });
}

export function defaultSettingsForPreset(preset: EventPreset) {
  return Object.entries(preset.settings ?? {}).map(([key, data]) => ({
    key,
    data,
  }));
}

export { localesForCountries } from './locales.js';
