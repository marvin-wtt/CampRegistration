import standardForm from './forms/standard.js';
import minimalForm from './forms/minimal.js';
import standardTableTemplates from './tableTemplates/standard.js';
import minimalTableTemplates from './tableTemplates/minimal.js';

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

export function getCampPreset(name: Preset | null | undefined): CampPreset {
  if (name == null) {
    return CAMP_PRESETS.standard;
  }

  return CAMP_PRESETS[name];
}

export { defaultMessageTemplatesForCountries } from './messageTemplates.js';
