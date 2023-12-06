import { CampDataType } from 'src/lib/surveyJs/properties/campDataMapping/CampDataType';
import { IPropertyGridEditor } from 'survey-creator-core';
import waitingList from 'src/lib/surveyJs/properties/campDataMapping/types/waitingList';
import country from 'src/lib/surveyJs/properties/campDataMapping/types/country';
import dateOfBirth from 'src/lib/surveyJs/properties/campDataMapping/types/dateOfBirth';
import email from 'src/lib/surveyJs/properties/campDataMapping/types/email';
import address from 'src/lib/surveyJs/properties/campDataMapping/types/address';
import role from 'src/lib/surveyJs/properties/campDataMapping/types/role';
import firstName from 'src/lib/surveyJs/properties/campDataMapping/types/firstName';
import lastName from 'src/lib/surveyJs/properties/campDataMapping/types/lastName';

const dataTypes: CampDataType[] = [];

dataTypes.push(address);
dataTypes.push(country);
dataTypes.push(dateOfBirth);
dataTypes.push(email);
dataTypes.push(firstName);
dataTypes.push(lastName);
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
    };
  },
};

export default editor;
