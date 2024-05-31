import { CampDataType } from 'src/lib/surveyJs/properties/campDataMapping/CampDataType';
import { IPropertyGridEditor } from 'survey-creator-core';
import {
  waitingList,
  country,
  dateOfBirth,
  email,
  address,
  role,
  firstName,
  lastName,
  name,
} from 'src/lib/surveyJs/properties/campDataMapping/types';

const dataTypes: CampDataType[] = [];

dataTypes.push(address);
dataTypes.push(country);
dataTypes.push(dateOfBirth);
dataTypes.push(email);
dataTypes.push(firstName);
dataTypes.push(lastName);
dataTypes.push(name);
dataTypes.push(role);
dataTypes.push(waitingList);

const editor: IPropertyGridEditor = {
  fit: (prop) => {
    return prop.type === 'campDataMapping';
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
