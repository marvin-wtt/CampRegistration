import { useObjectTranslation } from 'src/composables/objectTranslation';
import { SurveyModel } from 'survey-core';
import { Camp } from 'src/types/Camp';

export function useSurveyTools() {
  const { to } = useObjectTranslation();

  function setCampVariables(camp: Partial<Camp>, model: SurveyModel) {
    model.setVariable('camp.name', to(camp.name));
    model.setVariable('camp.startAt', camp.startAt); // TODO Format datetime
    model.setVariable('camp.endAt', camp.endAt); // TODO Format datetime
    model.setVariable('camp.minAge', camp.minAge);
    model.setVariable('camp.maxAge', camp.maxAge);
    model.setVariable('camp.location', to(camp.location));
    model.setVariable('camp.price', to(camp.price));
  }

  return {
    setCampVariables,
  };
}
