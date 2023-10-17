import { CampDataType } from 'src/lib/surveyJs/properties/campDataMapping/CampDataType';

const type: CampDataType = {
  element: {
    value: 'waiting_list',
    text: {
      en: 'Waiting List',
      de: 'Warteliste',
      fr: "Liste d'attendre",
    },
  },
  fit: (obj) => {
    return obj.getType() === 'checkbox';
  },
};

export default type;
