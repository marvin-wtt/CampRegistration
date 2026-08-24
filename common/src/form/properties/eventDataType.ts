import { IJsonPropertyInfo } from 'survey-core';

// `name`/`type` are wire-level keys serialized into already-saved form JSON
// (`Event.form`) and read back by `getPropertyValue('campDataType')` at
// runtime — kept stable across the camp->event rename to avoid silently
// breaking existing forms' field mappings.
const propertyInfo: IJsonPropertyInfo = {
  name: 'campDataType',
  className: 'question',
  type: 'campDataMapping',
  default: undefined,
  isRequired: false,
  category: 'general',
  visibleIndex: 3,
};

export default {
  className: propertyInfo.className ?? '',
  propertyInfo: propertyInfo,
};
