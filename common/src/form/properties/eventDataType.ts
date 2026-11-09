import { IJsonPropertyInfo } from 'survey-core';

// `name`/`type` are wire-level keys serialized into saved form JSON
// (`Event.form`). A data migration rewrites existing forms' `campDataType`
// keys to `eventDataType` in lockstep with this rename — see the data
// migration co-located with the `rename_camp_tables_to_event` schema
// migration.
const propertyInfo: IJsonPropertyInfo = {
  name: 'eventDataType',
  className: 'question',
  type: 'eventDataMapping',
  default: undefined,
  isRequired: false,
  category: 'general',
  visibleIndex: 3,
};

export default {
  className: propertyInfo.className ?? '',
  propertyInfo: propertyInfo,
};

// Calculated values take the tag too: one tagged `payment_amount` adjusts the
// price without a question the registrant sees.
export const calculatedValueDataType = {
  className: 'calculatedvalue',
  propertyInfo: { ...propertyInfo, className: undefined },
};
