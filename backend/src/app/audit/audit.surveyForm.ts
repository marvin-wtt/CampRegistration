import { isDeepStrictEqual } from 'node:util';
import { SurveyModel } from 'survey-core';

// Generic SurveyJS form diffing, shared by any entity that embeds a SurveyJS
// form definition (currently only `Camp.form`).

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
 * between two SurveyJS form definitions.
 */
export function formFieldChanges(before: unknown, after: unknown): string[] {
  const beforeFields = formFieldSnapshot(before);
  const afterFields = formFieldSnapshot(after);
  const names = new Set([...beforeFields.keys(), ...afterFields.keys()]);

  return [...names]
    .filter(
      (name) =>
        !isDeepStrictEqual(beforeFields.get(name), afterFields.get(name)),
    )
    .map((name) => `form.${name}`);
}
