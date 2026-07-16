import type { ITheme, SurveyModel } from 'survey-core';
import type { CampDetails } from '@camp-registration/common/entities';
import { useI18n } from 'vue-i18n';
import { nextTick, type Ref, watch, watchEffect } from 'vue';
import {
  fileDynamicTextProcessor,
  setVariables,
} from '@camp-registration/common/form';
import { useQuasar } from 'quasar';
import type { useAPIService } from '@/services/APIService';
import { md3SurveyThemes } from '@/lib/surveyJs/themes/md3';

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
 * Resolves {_file.<slot>} placeholders to a deterministic, locale-aware URL that
 * the backend redirects to the matching file. No file list is fetched up front;
 * the browser only requests a file when a link/image actually renders.
 */
export function addFileSlotResolver(
  model: SurveyModel,
  campId: string,
  api: ReturnType<typeof useAPIService>,
) {
  model.onProcessDynamicText.add(
    fileDynamicTextProcessor((slot) =>
      api.getCampFileSlotUrl(campId, slot, model.locale),
    ),
  );

  model.onProcessDynamicText.add((sender, options) => {
    if (options.isExists) {
      return;
    }
    if (!options.name.startsWith('_file.')) {
      return;
    }
    const slot = options.name.slice('_file.'.length);
    options.value = api.getCampFileSlotUrl(campId, slot, sender.locale);
  });
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
