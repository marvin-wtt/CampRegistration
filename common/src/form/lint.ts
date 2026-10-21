import type { ISurveyLintOptions } from 'survey-core/linter';
import { FILE_VARIABLE } from './files.js';
import { VARIABLE_NAMES } from './variables/index.js';

/**
 * Linter options for event forms. Event variables and file slots are resolved
 * at runtime, so the linter can't see them in the schema and would report every
 * reference as unknown. A known root (`_file`) covers all of its sub-paths.
 *
 * Custom questions, properties and functions need no entry: importing
 * `@camp-registration/common/form` registers them globally, where the linter
 * finds them.
 */
export function formLintOptions(
  base: ISurveyLintOptions = {},
): ISurveyLintOptions {
  return {
    ...base,
    knownVariables: [
      ...(base.knownVariables ?? []),
      ...VARIABLE_NAMES,
      FILE_VARIABLE,
    ],
  };
}
