import { isDeepStrictEqual } from 'node:util';
import { SurveyModel } from 'survey-core';

// Generic SurveyJS form diffing, shared by any entity that embeds a SurveyJS
// form definition (currently only `Event.form`).

/**
 * Snapshots every question in a SurveyJS form by name, keyed to its full
 * serialized shape — so a question that keeps its name but changes type,
 * choices, required-ness, etc. is still detected as different.
 */
function formFieldSnapshot(form: unknown): Map<string, unknown> {
  try {
    return new Map(
      new SurveyModel(form ?? {})
        .getAllQuestions(false, undefined, true)
        .map((question) => [question.name, question.toJSON()]),
    );
  } catch {
    return new Map();
  }
}

/**
 * Names (as `form.<name>` paths) of questions added, removed, or changed
 * between two SurveyJS form definitions — or just `form` when the change is
 * outside any question (page/panel titles, survey settings, logic).
 */
export function formFieldChanges(before: unknown, after: unknown): string[] {
  const beforeFields = formFieldSnapshot(before);
  const afterFields = formFieldSnapshot(after);
  const names = new Set([...beforeFields.keys(), ...afterFields.keys()]);

  const changed = [...names]
    .filter(
      (name) =>
        !isDeepStrictEqual(beforeFields.get(name), afterFields.get(name)),
    )
    .map((name) => `form.${name}`);

  if (changed.length === 0 && !isDeepStrictEqual(before, after)) {
    return ['form'];
  }
  return changed;
}
