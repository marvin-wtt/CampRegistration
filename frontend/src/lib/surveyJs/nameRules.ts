import {
  type SurveyCreatorModel,
  TabJsonEditorBasePlugin,
} from 'survey-creator-core';
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
 * it is left — so leaving it is refused until the name is changed.
 */
export function attachNameRules(
  creator: SurveyCreatorModel,
  options: NameRuleOptions,
): void {
  creator.onPropertyDisplayCustomError.add((_, event) => {
    if (!NAME_PROPERTIES.includes(event.propertyName)) {
      return;
    }
    // Typed as a string, but empty while the field is cleared.
    const value: unknown = event.value;
    const issue = typeof value === 'string' ? reservedNameIssue(value) : null;
    if (issue) {
      event.error = options.message(issue);
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

    const [use] = reservedNameUses(json);
    if (use) {
      event.allow = false;
      creator.notify(options.blocked(use), 'error');
    }
  });
}
