import { CampDataType } from 'src/lib/surveyJs/properties/campDataMapping/CampDataType';

const type: CampDataType = {
  element: {
    value: 'last_name',
    text: {
      en: 'Last Name',
      de: 'Nachname',
      fr: 'Nom de Famille',
    },
  },
  fit: (obj, prop, options) => {
    return (
      obj.getType() === 'text' && obj.getPropertyValue('inputType') === 'text'
    );
  },
};

export default type;
