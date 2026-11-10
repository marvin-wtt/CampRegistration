import { describe, expect, it } from 'vitest';
import { TableTemplateReferenceChecker } from '@camp-registration/common/form';
import {
  EVENT_PRESET_NAMES,
  type TableTemplate,
} from '@camp-registration/common/entities';
import { EVENT_PRESETS } from '#app/event/presets/index';

describe('event preset table templates', () => {
  it.each(EVENT_PRESET_NAMES)(
    '%s templates only reference what its form has',
    (name) => {
      const { form, tableTemplates } = EVENT_PRESETS[name];
      const checker = new TableTemplateReferenceChecker(form);

      const issues = (tableTemplates as unknown as TableTemplate[]).flatMap(
        (template) =>
          checker
            .check(template)
            .map((issue) => ({ template: template.title, ...issue })),
      );

      expect(issues).toEqual([]);
    },
  );
});
