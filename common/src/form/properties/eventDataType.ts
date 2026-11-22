import type { IJsonPropertyInfo } from 'survey-core';
import type { PropertyDefinition } from './PropertyDefinition.js';
import {
  REGISTRATION_PROPERTY_CATEGORY,
  REGISTRATION_PROPERTY_CATEGORY_INDEX,
} from './category.js';
import { EVENT_DATA_TYPE_PROPERTY } from './accessors.js';

/** The property grid editor the frontend registers for the tag. */
export const EVENT_DATA_TYPE_EDITOR = 'eventDataMapping';

// Existing forms' former `campDataType` keys were rewritten by the data
// migration co-located with the `rename_camp_tables_to_event` migration.
const propertyInfo: IJsonPropertyInfo = {
  name: EVENT_DATA_TYPE_PROPERTY,
  type: EVENT_DATA_TYPE_EDITOR,
  default: undefined,
  isRequired: false,
  category: REGISTRATION_PROPERTY_CATEGORY,
  categoryIndex: REGISTRATION_PROPERTY_CATEGORY_INDEX,
  visibleIndex: 0,
};

export const questionDataType: PropertyDefinition = {
  className: 'question',
  propertyInfo,
};

// Calculated values take the tag too: one tagged `payment_amount` adjusts the
// price without a question the registrant sees.
export const calculatedValueDataType: PropertyDefinition = {
  className: 'calculatedvalue',
  propertyInfo: { ...propertyInfo },
};
