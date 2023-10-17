import { useObjectTranslation } from 'src/composables/objectTranslation';
import { SurveyModel } from 'survey-core';
import { Camp } from 'src/types/Camp';
import { useI18n } from 'vue-i18n';

export function useSurveyTools() {
  const { to } = useObjectTranslation();
  const { locale } = useI18n();

  function setCampVariables(model: SurveyModel, camp: Partial<Camp>) {
    model.setVariable('camp.countries', camp.countries);
    model.setVariable('camp.name', to(camp.name));
    model.setVariable('camp.organization', to(camp.organization));
    model.setVariable('camp.startAt', camp.startAt);
    model.setVariable('camp.startAtDate', toDate(camp.startAt));
    model.setVariable('camp.startAtTime', toTime(camp.startAt));
    model.setVariable('camp.endAt', camp.endAt);
    model.setVariable('camp.endAtDate', toDate(camp.endAt));
    model.setVariable('camp.endAtTime', toTime(camp.endAt));
    model.setVariable('camp.minAge', camp.minAge);
    model.setVariable('camp.maxAge', camp.maxAge);
    model.setVariable('camp.location', to(camp.location));
    model.setVariable('camp.price', camp.price);
  }

  function toDate(timestamp?: string): string | undefined {
    if (!timestamp) {
      return undefined;
    }

    const date = new Date(timestamp);
    return date.toLocaleDateString(locale.value, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  function toTime(timestamp?: string): string | undefined {
    if (!timestamp) {
      return undefined;
    }

    const date = new Date(timestamp);
    return date.toLocaleTimeString(locale.value, {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return {
    setCampVariables,
  };
}
