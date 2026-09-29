import type { SurveyModel } from 'survey-core';
import type { EventDetails } from '@camp-registration/common/entities';
import { useI18n } from 'vue-i18n';
import { nextTick, type Ref, watch, watchEffect } from 'vue';
import { setVariables } from '@camp-registration/common/form';
import { useQuasar } from 'quasar';
import { resolveMd3Theme } from '@/lib/surveyJs/theme';

export function startAutoDataUpdate(
  model: SurveyModel,
  data: Ref<EventDetails | undefined>,
) {
  const { locale } = useI18n();

  watch(
    [locale, data],
    ([locale, data]) => {
      model.locale = locale;
      setVariables(model, data);
    },
    { immediate: true },
  );
}

export const startAutoThemeUpdate = (
  model: SurveyModel,
  data: Ref<EventDetails | undefined>,
  bgColor?: Ref<string | undefined>,
) => {
  const quasar = useQuasar();

  watchEffect(() => {
    if (!data.value) {
      return;
    }

    const colorPalette = quasar.dark.isActive ? 'dark' : 'light';
    model.applyTheme(resolveMd3Theme(data.value.themes, colorPalette));

    // Update background color of entire page if reference is provided
    if (!bgColor) {
      return;
    }

    void nextTick(() => {
      const element = document.getElementById('survey');
      if (element) {
        bgColor.value = window.getComputedStyle(element).backgroundColor;
      }
    });
  });
};
