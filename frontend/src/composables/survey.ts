import type { SurveyModel } from 'survey-core';
import type { CampDetails } from '@camp-registration/common/entities';
import { useI18n } from 'vue-i18n';
import { nextTick, type Ref, watch, watchEffect } from 'vue';
import { setVariables } from '@camp-registration/common/form';
import { useQuasar } from 'quasar';

export function startAutoDataUpdate(
  model: SurveyModel,
  data: Ref<CampDetails | undefined>,
) {
  const { locale } = useI18n();

  watch(locale, (value) => {
    updateVariables(model, data.value, value);
  });

  watch(data, (value) => {
    updateVariables(model, value, locale.value);
  });

  const updateVariables = (
    model: SurveyModel | undefined,
    data: CampDetails | undefined,
    locale: string,
  ) => {
    if (!model) {
      return;
    }

    model.locale = locale;
    setVariables(model, data);
  };

  updateVariables(model, data.value, locale.value);
}

/**
 * Reports the survey's resolved background colour so the page behind it can
 * match.
 *
 * No theme is applied here. Every form renders in the one corporate MD3 look
 * that `md3-adapter.scss` supplies through the `.sjs-theme-overrides` class,
 * which is what keeps the Survey Creator's designer and preview identical to
 * the public camp page. A camp's stored `themes` are left untouched in the
 * database, but nothing reads them while the Themes tab is disabled.
 *
 * The colour still has to be re-measured when the viewer toggles dark mode,
 * since the adapter resolves it live from `--md3-*`.
 */
export const startAutoBackgroundUpdate = (bgColor: Ref<string | undefined>) => {
  const quasar = useQuasar();

  const measure = async () => {
    // Let the survey paint before reading back the resolved colour.
    await nextTick();

    const element = document.getElementById('survey');
    if (element) {
      bgColor.value = window.getComputedStyle(element).backgroundColor;
    }
  };

  watchEffect(() => {
    void quasar.dark.isActive;
    void measure();
  });
};
