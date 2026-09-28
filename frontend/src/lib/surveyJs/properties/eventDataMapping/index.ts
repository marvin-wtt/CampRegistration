import type { EventDataType } from '@/lib/surveyJs/properties/eventDataMapping/EventDataType';
import { type IPropertyGridEditor } from 'survey-creator-core';
import {
  waitingList,
  newsletterConsent,
  country,
  dateOfBirth,
  email,
  address,
  role,
  firstName,
  gender,
  lastName,
  name,
} from '@/lib/surveyJs/properties/eventDataMapping/types';

const dataTypes: EventDataType[] = [];

dataTypes.push(address);
dataTypes.push(country);
dataTypes.push(dateOfBirth);
dataTypes.push(email);
dataTypes.push(firstName);
dataTypes.push(gender);
dataTypes.push(lastName);
dataTypes.push(name);
dataTypes.push(newsletterConsent);
dataTypes.push(role);
dataTypes.push(waitingList);

const editor: IPropertyGridEditor = {
  fit: (prop) => {
    return prop.type === 'eventDataMapping';
  },
  getJSON: (obj, prop, options) => {
    const isExpression = obj.getType() === 'expression';

    const types = isExpression
      ? dataTypes
      : dataTypes.filter((value) => value.fit(obj, prop, options));
    const choices = types.map((value) => value.element);

    return {
      type: 'dropdown',
      choices,
      showOtherItem: true,
      storeOthersAsComment: false,
    };
  },
};

export default editor;
