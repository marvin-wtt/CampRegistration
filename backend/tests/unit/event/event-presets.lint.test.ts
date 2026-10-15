import { describe, expect, it } from 'vitest';
// Registers the survey locales; without them every `locale` is reported invalid.
import 'survey-core/i18n';
import { lintSurvey, type ISuppression } from 'survey-core/linter';
import { formLintOptions } from '@camp-registration/common/form';
import { EVENT_PRESET_NAMES } from '@camp-registration/common/entities';
import { EVENT_PRESETS } from '#app/event/presets/index';

// The linter reports a valueName inside a dynamic-panel template as shadowing
// a root question of that name, but the template field stores per row
// (`guardian[0].first_name`), so nothing collides. Linter bug, not ours.
const SUPPRESS: ISuppression[] = [
  { ruleId: 'name/shadowing', elementName: 'guardian_first_name' },
  { ruleId: 'name/shadowing', elementName: 'guardian_last_name' },
  { ruleId: 'name/shadowing', elementName: 'guardian_phone_number' },
];

function lint(form: unknown) {
  const { findings } = lintSurvey(
    form,
    formLintOptions({ suppress: SUPPRESS }),
  );

  return findings.map(
    ({ severity, ruleId, path, message }) =>
      `[${severity}] ${ruleId} @ ${path}: ${message}`,
  );
}

describe('event preset forms', () => {
  it.each(EVENT_PRESET_NAMES)('%s form passes the SurveyJS linter', (name) => {
    expect(lint(EVENT_PRESETS[name].form)).toEqual([]);
  });

  it('reports an unresolved reference', () => {
    const form = {
      elements: [{ type: 'address', name: 'address' }],
      calculatedValues: [
        {
          name: 'waitingList',
          expression: 'isWaitingList({event.freePlaces}, {country})',
        },
      ],
    };

    expect(lint(form)).toEqual([expect.stringContaining('reference/unknown')]);
  });
});
