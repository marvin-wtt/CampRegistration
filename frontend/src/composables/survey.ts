import { ITheme, SurveyModel } from 'survey-core';
import type { CampDetails } from '@camp-registration/common/entities';
import { useI18n } from 'vue-i18n';
import { nextTick, Ref, watch } from 'vue';
import { setVariables } from '@camp-registration/common/form';
import { useQuasar } from 'quasar';

import { PlainLight, PlainDark } from 'survey-core/themes';

export function startAutoDataUpdate(
  model: Ref<SurveyModel | undefined>,
  data: Ref<CampDetails | undefined>,
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
    data: CampDetails | undefined,
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

export const startAutoThemeUpdate = (
  model: Ref<SurveyModel | undefined>,
  data: Ref<CampDetails | undefined>,
  bgColor?: Ref<string | undefined> | undefined,
) => {
  const quasar = useQuasar();

  watch(
    () => quasar.dark.isActive,
    (value) => {
      applyTheme(model.value, data.value, value);
    },
  );

  watch(data, (value) => {
    applyTheme(model.value, value, quasar.dark.isActive);
  });

  watch(model, (value) => {
    applyTheme(value, data.value, quasar.dark.isActive);
  });

  const applyTheme = (
    model: SurveyModel | undefined,
    data: CampDetails | undefined,
    dark: boolean,
  ) => {
    if (!model || !data) {
      return;
    }

    const themes = data?.themes;
    const colorPlatte = dark ? 'dark' : 'light';

    let theme: ITheme;
    if (colorPlatte in themes) {
      theme = themes[colorPlatte];
    } else if (colorPlatte === 'dark' && 'light' in themes) {
      // Try light mode first
      theme = themes.light;
    } else {
      // Apply default theme
      theme = colorPlatte === 'dark' ? PlainDark : PlainLight;
    }

    model.applyTheme(theme);

    // Update background color of entire page if reference is provided
    if (!bgColor) {
      return;
    }
    nextTick(() => {
      const element = document.getElementById('survey');
      if (element) {
        bgColor.value = window.getComputedStyle(element).backgroundColor;
      }
    });
  };
};
