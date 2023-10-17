import { CampDataType } from 'src/lib/surveyJs/properties/campDataMapping/CampDataType';

const type: CampDataType = {
  element: {
    value: 'address',
    text: {
      en: 'Address',
      de: 'Adresse',
      fr: 'Adresse',
    },
  },
  fit: (obj, prop, options) => {
    return obj.getType() === 'address';
  },
};

export default type;
