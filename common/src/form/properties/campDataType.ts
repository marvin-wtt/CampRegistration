import { IJsonPropertyInfo } from 'survey-core';

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
  className: propertyInfo.className,
  propertyInfo: propertyInfo,
};
