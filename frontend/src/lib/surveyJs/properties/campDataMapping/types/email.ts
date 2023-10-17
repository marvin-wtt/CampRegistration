import { CampDataType } from 'src/lib/surveyJs/properties/campDataMapping/CampDataType';

const type: CampDataType = {
  element: {
    value: 'email',
    text: {
      en: 'E-Mail',
      de: 'E-Mail',
      fr: 'E-Mail',
    },
  },
  fit: (obj, prop, options) => {
    return (
      obj.getType() === 'text' && obj.getPropertyValue('inputType') === 'email'
    );
  },
};

export default type;
