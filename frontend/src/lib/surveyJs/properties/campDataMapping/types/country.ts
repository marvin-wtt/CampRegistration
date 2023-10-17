import { CampDataType } from 'src/lib/surveyJs/properties/campDataMapping/CampDataType';

const type: CampDataType = {
  element: {
    value: 'country',
    text: {
      en: 'Country',
      de: 'Land',
      fr: 'Pays',
    },
  },
  fit: (obj, prop, options) => {
    return obj.getType() === 'dropdown';
  },
};

export default type;
