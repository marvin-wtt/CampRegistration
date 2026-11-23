import type { SurveyCreatorModel } from 'survey-creator-core';
import type { Base, PageModel, PanelModel, SurveyElement } from 'survey-core';
import { EVENT_DATA_TYPE_PROPERTY } from '@camp-registration/common/form';

/**
 * Restricted access, for a form that already holds registrations: the form
 * may grow, but nothing that keys or tags a stored answer may change, so no
 * answer is orphaned or misread.
 */

// What keys or tags an answer.
const LOCKED_PROPERTIES = ['name', EVENT_DATA_TYPE_PROPERTY];

function isColumn(obj: Base | null | undefined): boolean {
  return obj?.getType() === 'matrixdropdowncolumn';
}

/**
 * Lets only panels be added. A mode preset rebuilds the toolbox, so this goes
 * on top after every preset.
 */
export function restrictToolbox(creator: SurveyCreatorModel): void {
  const panelItem = creator.toolbox.getItemByName('panel');
  creator.toolbox.clearItems();
  creator.toolbox.addItem(panelItem);
  creator.currentAddQuestionType = 'panel';
  creator.showAddQuestionButton = false;
}

/** Refuses every edit that would change what a stored answer means. */
export function addRestrictedAccessRules(creator: SurveyCreatorModel): void {
  creator.onElementAllowOperations.add((_, options) => {
    options.allowChangeType = false;
    options.allowCopy = false;
    const obj = options.element as SurveyElement;
    if (obj.isQuestion) {
      options.allowDelete = false;
    }
    if (obj.isPage || obj.isPanel) {
      options.allowDelete =
        (obj as PanelModel | PageModel).questions.length === 0;
    }
  });

  // Columns on the design surface…
  creator.onCollectionItemAllowOperations.add((_, options) => {
    options.allowDelete = !isColumn(options.item);
  });

  // …and in the property grid.
  creator.onConfigureTablePropertyEditor.add((_, options) => {
    options.allowAddRemoveItems = options.propertyName !== 'columns';
  });

  creator.onPropertyGetReadOnly.add((_, options) => {
    if (options.property.name === 'cellType') {
      options.readOnly = true;
    }
    if (LOCKED_PROPERTIES.includes(options.property.name)) {
      options.readOnly =
        (options.element as SurveyElement).isQuestion ||
        isColumn(options.element);
    }
  });
}
