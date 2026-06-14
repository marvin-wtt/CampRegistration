import type { ITheme, SurveyModel } from 'survey-core';
import type {
  CampDetails,
  ServiceFile,
} from '@camp-registration/common/entities';
import { useI18n } from 'vue-i18n';
import { nextTick, type Ref, watch, watchEffect } from 'vue';
import {
  setVariables,
  selectFilesByLocale,
} from '@camp-registration/common/form';
import { useQuasar } from 'quasar';
import { useAPIService } from 'src/services/APIService';
import { md3SurveyThemes } from 'src/lib/surveyJs/themes/md3';

export function startAutoDataUpdate(
  model: SurveyModel,
  data: Ref<CampDetails | undefined>,
  files: Ref<ServiceFile[] | undefined>,
) {
  const api = useAPIService();
  const { locale } = useI18n();

  watch(locale, (value) => {
    updateVariables(model, data.value, files.value, value);
  });

  watch(data, (value) => {
    updateVariables(model, value, files.value, locale.value);
  });

  watch(files, (value) => {
    updateVariables(model, data.value, value, locale.value);
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

    // Build locale-aware _file variable object: {_file.rules}, {_file.toc}, etc.
    if (data && files) {
      const selected = selectFilesByLocale(files, locale);
      const fileVars: Record<string, string> = {};
      for (const [field, file] of Object.entries(selected)) {
        fileVars[field] = api.getFileUrl(file.id);
      }
      model.setVariable('_file', fileVars);
    }
  };

  updateVariables(model, data.value, files.value, locale.value);
}

export const startAutoThemeUpdate = (
  model: SurveyModel,
  data: Ref<CampDetails | undefined>,
  bgColor?: Ref<string | undefined>,
) => {
  const quasar = useQuasar();

  const applyTheme = async (
    model: SurveyModel | undefined,
    data: CampDetails | undefined,
    dark: boolean,
  ) => {
    if (!model || !data) {
      return;
    }

    const themes = data.themes;
    const colorPlatte = dark ? 'dark' : 'light';

    let theme: ITheme;
    if (colorPlatte in themes) {
      theme = themes[colorPlatte]!;
    } else if (colorPlatte === 'dark' && 'light' in themes) {
      // Try light mode first
      theme = themes.light;
    } else {
      // Apply default theme
      theme = md3SurveyThemes[colorPlatte];
    }

    model.applyTheme(theme);

    // Update background color of entire page if reference is provided
    if (!bgColor) {
      return;
    }

    await nextTick(() => {
      const element = document.getElementById('survey');
      if (element) {
        bgColor.value = window.getComputedStyle(element).backgroundColor;
      }
    });
  };

  watchEffect(() => {
    void applyTheme(model, data.value, quasar.dark.isActive);
  });
};
