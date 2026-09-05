import { ConditionRunner } from 'survey-core';

// Filter/showIf/hideIf expressions authored before the ConditionRunner
// migration reference variables as `$name` instead of the native `{name}`
// syntax. Rewrite them so those expressions keep working unchanged.
const LEGACY_VARIABLE = /(?<![\w{])\$([A-Za-z]\w*(?:\.\w+)*)/g;

export class ExpressionEvaluator {
  private readonly runner: ConditionRunner;

  constructor(expression: string) {
    this.runner = new ConditionRunner(
      expression.replace(LEGACY_VARIABLE, '{$1}'),
    );
  }

  evaluate(data: object): boolean {
    return this.runner.runValues(data as Record<string, unknown>);
  }
}
