import standardForm from './forms/standard.js';
import minimalForm from './forms/minimal.js';
import standardTableTemplates from './tableTemplates/standard.js';
import minimalTableTemplates from './tableTemplates/minimal.js';
import { SurveyModel } from 'survey-core';

export type Preset = 'standard' | 'minimal';

interface CampPreset {
  form: Record<string, unknown>;
  tableTemplates: Record<string, unknown>[];
  themes: Record<string, unknown>;
}

export const CAMP_PRESETS: Record<Preset, CampPreset> = {
  minimal: {
    form: minimalForm,
    tableTemplates: minimalTableTemplates,
    themes: {},
  },
  standard: {
    form: standardForm,
    tableTemplates: standardTableTemplates,
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

export function getCampPreset(
  name: Preset | null | undefined,
  locales?: string[],
): CampPreset {
  const preset = name ? CAMP_PRESETS[name] : CAMP_PRESETS.standard;

  if (!locales || locales.length === 0) {
    return preset;
  }

  const model = new SurveyModel(preset.form);
  const form = model.toJSON({ locales }) as Record<string, unknown>;
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
