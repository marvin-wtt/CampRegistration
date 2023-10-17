import { CampDataType } from 'src/lib/surveyJs/properties/campDataMapping/CampDataType';

const type: CampDataType = {
  element: {
    value: 'date_of_birth',
    text: {
      en: 'Date of Birth',
      de: 'Geburtsdatun',
      fr: 'Date de naissance',
    },
  },
  fit: (obj, prop, options) => {
    return (
      obj.getType() === 'date_of_birth' ||
      (obj.getType() === 'text' && obj.getPropertyValue('inputType') === 'date')
    );
  },
};

export default type;
