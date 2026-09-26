import campForm from './forms/camp.js';
import seminarForm from './forms/seminar.js';
import campTableTemplates from './tableTemplates/camp.js';
import seminarTableTemplates from './tableTemplates/seminar.js';
import { SurveyModel } from 'survey-core';

export type Preset = 'camp' | 'seminar';

interface EventPreset {
  form: Record<string, unknown>;
  tableTemplates: Record<string, unknown>[];
  themes: Record<string, unknown>;
}

export const EVENT_PRESETS: Record<Preset, EventPreset> = {
  camp: {
    form: campForm,
    tableTemplates: campTableTemplates,
    themes: {},
  },
  seminar: {
    form: seminarForm,
    tableTemplates: seminarTableTemplates,
    themes: {},
  },
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
  name: Preset | null | undefined,
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

export { defaultMessageTemplatesForCountries } from './messageTemplates.js';
export { localesForCountries } from './locales.js';
