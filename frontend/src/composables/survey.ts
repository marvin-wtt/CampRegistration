import { SurveyModel } from 'survey-core';
import { Camp } from 'src/types/Camp';
import { useI18n } from 'vue-i18n';
import { Ref, watch } from 'vue';
import { setVariables } from '@camp-registration/common/form/variables';

export function startAutoDataUpdate(
  model: Ref<SurveyModel | undefined>,
  data: Ref<Camp | undefined>,
) {
  const { locale } = useI18n();

  watch(locale, (value) => {
    updateVariables(model.value, data.value, value);
  });

  watch(model, (value) => {
    updateVariables(value, data.value, locale.value);
  });

  watch(data, (value) => {
    updateVariables(model.value, value, locale.value);
  });

  const updateVariables = (
    model: SurveyModel | undefined,
    data: Camp | undefined,
    locale: string,
  ) => {
    if (!model) {
      return;
    }

    model.locale = locale;
    setVariables(model, data, locale);
  };

  return {};
}
