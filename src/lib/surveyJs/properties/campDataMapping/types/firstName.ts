import { CampDataType } from 'src/lib/surveyJs/properties/campDataMapping/CampDataType';

const type: CampDataType = {
  element: {
    value: 'first_name',
    text: {
      en: 'First Name',
      de: 'Vorname',
      fr: 'Prénom',
    },
  },
  fit: (obj, prop, options) => {
    return (
      obj.getType() === 'text' && obj.getPropertyValue('inputType') === 'text'
    );
  },
};

export default type;
