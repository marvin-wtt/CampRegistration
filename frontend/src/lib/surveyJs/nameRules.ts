import {
  type SurveyCreatorModel,
  TabJsonEditorBasePlugin,
} from 'survey-creator-core';
import { MatrixDropdownColumn, Question } from 'survey-core';
import {
  reservedNameIssue,
  reservedNameUses,
  type ReservedNameIssue,
  type ReservedNameUse,
} from '@camp-registration/common/form';

const NAME_PROPERTIES = ['name', 'valueName'];

export interface NameRuleOptions {
  /** Shown under a name typed into the property grid. */
  message: (issue: ReservedNameIssue) => string;
  /** Shown when the JSON tab holds one and can't be left. */
  blocked: (use: ReservedNameUse) => string;
}

/**
 * Keeps reserved names (`reservedNameIssue`) out of the form: in the property
 * grid as it is typed, and in the JSON tab, which applies its text only when
 * it is left — so leaving it is refused while the text adds one.
 */
export function attachNameRules(
  creator: SurveyCreatorModel,
  options: NameRuleOptions,
): void {
  creator.onPropertyDisplayCustomError.add((_, event) => {
    // Only questions and matrix columns key an answer; panels and pages don't.
    const keysAnswer =
      event.element instanceof Question ||
      event.element instanceof MatrixDropdownColumn;
    if (!keysAnswer || !NAME_PROPERTIES.includes(event.propertyName)) {
      return;
    }
    // Typed as a string, but empty while the field is cleared.
    const value: unknown = event.value;
    const issue = typeof value === 'string' ? reservedNameIssue(value) : null;
    if (issue) {
      event.error = options.message(issue);
    }
  });

  // The reserved names the form held as the JSON tab opened: those keep their
  // stored answers, and renaming one would orphan them. Taken on opening, as
  // the tab applies its text to the form before it is left.
  let held = new Set<string>();
  creator.onActiveTabChanged.add((_, event) => {
    if (event.tabName === 'json') {
      held = new Set(reservedNameUses(creator.JSON).map(({ name }) => name));
    }
  });

  creator.onActiveTabChanging.add((_, event) => {
    if (creator.activeTab !== 'json') {
      return;
    }
    const plugin = creator.getPlugin('json');
    if (!(plugin instanceof TabJsonEditorBasePlugin)) {
      return;
    }

    let json: unknown;
    try {
      json = JSON.parse(plugin.model.text);
    } catch {
      // Invalid JSON: the tab reports and refuses it itself.
      return;
    }

    const use = reservedNameUses(json).find(({ name }) => !held.has(name));
    if (use) {
      event.allow = false;
      creator.notify(options.blocked(use), 'error');
    }
  });
}
