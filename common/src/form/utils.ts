import type { SurveyModel } from 'survey-core';

export type Handler = Parameters<SurveyModel['onProcessDynamicText']['add']>[0];

export const fileDynamicTextProcessor = (
  resolver: (slot: string) => string,
): Handler => {
  return (_sender, options) => {
    if (options.isExists) {
      return;
    }
    if (!options.name.startsWith('_file.')) {
      return;
    }
    const slot = options.name.slice('_file.'.length);
    options.value = resolver(slot);
  };
};
