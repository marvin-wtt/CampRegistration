import type { SurveyModel } from 'survey-core';
import type { EventDetails } from '@camp-registration/common/entities';
import { useI18n } from 'vue-i18n';
import { nextTick, type Ref, watch, watchEffect } from 'vue';
import { setVariables } from '@camp-registration/common/form';
import { useQuasar } from 'quasar';
import type { useAPIService } from '@/services/APIService';
import { resolveMd3Theme } from '@/lib/surveyJs/theme';

export function startAutoDataUpdate(
  model: SurveyModel,
  data: Ref<EventDetails | undefined>,
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
    data: EventDetails | undefined,
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
  eventId: string,
  api: ReturnType<typeof useAPIService>,
) {
  model.onProcessDynamicText.add((sender, options) => {
    if (options.isExists) {
      return;
    }
    if (!options.name.startsWith('_file.')) {
      return;
    }
    const slot = options.name.slice('_file.'.length);
    options.value = api.getEventFileSlotUrl(eventId, slot, sender.locale);
  });
}

// Anchored: an image link is the placeholder alone. Text that merely contains
// one (a markdown link in a description) is inline-editable on the design
// surface, which saves what it displays — resolving it would bake in the URL.
const DESIGN_IMAGE_PLACEHOLDER =
  /^\s*\{\s?(_file\.[a-z0-9_-]+|event\.logo)\s?}\s*$/;

/**
 * The designer runs in design mode, where SurveyJS skips text processing, so
 * a `{_file.<slot>}` image or the `{event.logo}` header logo would render its
 * raw placeholder. Resolves just those; other placeholders stay visible.
 */
export function addDesignerFileSlotResolver(
  model: SurveyModel,
  event: EventDetails,
  api: ReturnType<typeof useAPIService>,
) {
  const processTextEx = model.processTextEx.bind(model);

  model.processTextEx = (params) => {
    const result = processTextEx(params);
    if (!model.isDesignMode || params.runAtDesign) {
      return result;
    }

    return {
      ...result,
      text: result.text.replace(DESIGN_IMAGE_PLACEHOLDER, (_, name: string) =>
        name === 'event.logo'
          ? (event.logo ?? '')
          : api.getEventFileSlotUrl(
              event.id,
              name.slice('_file.'.length),
              model.locale || undefined,
            ),
      ),
    };
  };
}

export const startAutoThemeUpdate = (
  model: SurveyModel,
  data: Ref<EventDetails | undefined>,
  bgColor?: Ref<string | undefined>,
) => {
  const quasar = useQuasar();

  const applyTheme = async (
    model: SurveyModel | undefined,
    data: EventDetails | undefined,
    dark: boolean,
  ) => {
    if (!model || !data) {
      return;
    }

    const colorPlatte = dark ? 'dark' : 'light';
    const theme = resolveMd3Theme(data.themes, colorPlatte);

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
