import { CampDataType } from 'src/lib/surveyJs/properties/campDataMapping/CampDataType';

const type: CampDataType = {
  element: {
    value: 'role',
    text: {
      en: 'Role',
      de: 'Rolle',
      fr: 'Rôle',
    },
  },
  fit: (obj, prop, options) => {
    return ['role', 'dropdown'].includes(obj.getType());
  },
};

export default type;
