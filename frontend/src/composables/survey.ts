import type { ITheme, SurveyModel } from 'survey-core';
import type {
  CampDetails,
  ServiceFile,
} from '@camp-registration/common/entities';
import { useI18n } from 'vue-i18n';
import { nextTick, type Ref, watch, watchEffect } from 'vue';
import { setVariables } from '@camp-registration/common/form';
import { useQuasar } from 'quasar';
import { PlainLight, PlainDark } from 'survey-core/themes';
import { useAPIService } from 'src/services/APIService';

export function startAutoDataUpdate(
  model: Ref<SurveyModel | undefined>,
  data: Ref<CampDetails | undefined>,
  files: Ref<ServiceFile[] | undefined>,
) {
  const api = useAPIService();
  const { locale } = useI18n();

  watch(locale, (value) => {
    updateVariables(model.value, data.value, files.value, value);
  });

  watch(model, (value) => {
    updateVariables(value, data.value, files.value, locale.value);
  });

  watch(data, (value) => {
    updateVariables(model.value, value, files.value, locale.value);
  });

  watch(files, (value) => {
    updateVariables(model.value, data.value, value, locale.value);
  });

  const updateVariables = (
    model: SurveyModel | undefined,
    data: CampDetails | undefined,
    files: ServiceFile[] | undefined,
    locale: string,
  ) => {
    if (!model) {
      return;
    }

    model.locale = locale;
    setVariables(model, data);

    // Set file variables
    files?.forEach((file) => {
      if (!file.field) {
        return;
      }

      const name = `_file:${file.field}`;
      const url = api.getCampFileUrl(model.surveyId, file.id);

      model.setVariable(name, url);
    });
  };
}

export const startAutoThemeUpdate = (
  model: Ref<SurveyModel | undefined>,
  data: Ref<CampDetails | undefined>,
  bgColor?: Ref<string | undefined> | undefined,
) => {
  const quasar = useQuasar();

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
      theme = themes[colorPlatte]!;
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

  watchEffect(() => {
    applyTheme(model.value, data.value, quasar.dark.isActive);
  });
};
