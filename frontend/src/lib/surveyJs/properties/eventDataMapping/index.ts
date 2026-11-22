import {
  editorLocalization,
  type IPropertyGridEditor,
} from 'survey-creator-core';
import {
  EVENT_DATA_TYPE_EDITOR,
  EVENT_DATA_TYPE_PROPERTY,
  eventDataTagsFor,
  eventDataTypeOf,
  isEventDataTag,
} from '@camp-registration/common/form';

// The tags come from the registry in `common`; their labels are the creator's
// `pv.eventDataType.<tag>` strings (`form-editor-translations.ts`).
const editor: IPropertyGridEditor = {
  fit: (prop) => prop.type === EVENT_DATA_TYPE_EDITOR,
  getJSON: (obj) => {
    const tags: string[] = eventDataTagsFor(obj);
    // A legacy tag the element still carries stays selectable as itself.
    const current = eventDataTypeOf(obj);
    if (current && isEventDataTag(current) && !tags.includes(current)) {
      tags.push(current);
    }

    return {
      type: 'dropdown',
      choices: tags.map((tag) => ({
        value: tag,
        text: editorLocalization.getPropertyValueInEditor(
          EVENT_DATA_TYPE_PROPERTY,
          tag,
        ),
      })),
      showOtherItem: true,
      storeOthersAsComment: false,
    };
  },
};

export default editor;
