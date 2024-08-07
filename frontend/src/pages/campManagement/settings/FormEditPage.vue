<template>
  <page-state-handler
    :error="error"
    :loading="loading"
  >
    <survey-creator-component :model="creator" />
  </page-state-handler>
</template>

<script lang="ts" setup>
// Style
import 'survey-core/defaultV2.min.css';
import 'survey-creator-core/survey-creator-core.min.css';
// JS
import 'survey-core/survey.i18n';
import 'survey-creator-core/survey-creator-core.i18n';

import PageStateHandler from 'components/common/PageStateHandler.vue';
import { computed, onMounted, ref, watchEffect } from 'vue';
import {
  localization,
  PropertyGridEditorCollection,
  SurveyCreatorModel,
} from 'survey-creator-core';
import { useI18n } from 'vue-i18n';
import {
  startAutoDataUpdate,
  startAutoThemeUpdate,
} from 'src/composables/survey';
import { useCampDetailsStore } from 'stores/camp-details-store';
import campDataMapping from 'src/lib/surveyJs/properties/campDataMapping';
import { useCampFilesStore } from 'stores/camp-files-store';
import { SurveyModel } from 'survey-core';
import { storeToRefs } from 'pinia';
import showdown from 'showdown';
import { useAPIService } from 'src/services/APIService';

const api = useAPIService();
const campDetailsStore = useCampDetailsStore();
const campFileStore = useCampFilesStore();
const { data: campData } = storeToRefs(campDetailsStore);
const { locale } = useI18n();

// Custom properties
PropertyGridEditorCollection.register(campDataMapping);

// Add localization
// TODO campData property
const deLocale = localization.getLocale('de');
deLocale.qt.address = 'Adresse';
deLocale.qt.country = 'Land';
deLocale.qt.date_of_birth = 'Geburtstag';
deLocale.qt.role = 'Rolle';

const enLocale = localization.getLocale('en');
enLocale.qt.address = 'Address';
enLocale.qt.country = 'Country';
enLocale.qt.date_of_birth = 'Birthday';
enLocale.qt.rolle = 'Role';

const frLocale = localization.getLocale('fr');
frLocale.qt.address = 'Adresse';
frLocale.qt.country = 'Pays';
frLocale.qt.date_of_birth = 'Date de Naissance';
frLocale.qt.role = 'Rôle';

const loading = computed<boolean>(() => {
  return campDetailsStore.isLoading;
});

const error = computed(() => {
  return campDetailsStore.error;
});

const creatorOptions = {
  showLogicTab: true,
  showTranslationTab: true,
  showEmbeddedSurveyTab: false,
  isAutoSave: true, // Survey is currently only saved when pressing the button.
  themeForPreview: 'defaultV2',
  showThemeTab: true,
};

const markdownConverter = new showdown.Converter({
  openLinksInNewWindow: true,
});

const creator = new SurveyCreatorModel(creatorOptions);
const previewModel = ref<SurveyModel>();

startAutoDataUpdate(previewModel, campData);
startAutoThemeUpdate(previewModel, campData);

watchEffect(() => {
  creator.locale = locale.value.split(/[-_]/)[0];
});

onMounted(async () => {
  await campDetailsStore.fetchData();

  if (!campDetailsStore.data) {
    return;
  }

  creator.JSON = campDetailsStore.data.form;
  creator.theme = campDetailsStore.data.themes['light'];
});

creator.onPropertyValidationCustomError.add((_, options) => {
  if (!['name', 'valueName'].includes(options.propertyName)) {
    return;
  }

  if (options.value === 0) {
    options.error = 'Zero is not allowed here.';
  }

  if (options.value.includes('.')) {
    options.error = 'Dots are not allowed here.';
  }
});

creator.saveSurveyFunc = (
  saveNo: number,
  callback: (saveNo: number, success: boolean) => void,
) => {
  const data = {
    form: creator.JSON,
  };

  campDetailsStore
    .updateData(data, 'none')
    .then(() => {
      callback(saveNo, true);
    })
    .catch(() => {
      callback(saveNo, false);
    });
};

creator.saveThemeFunc = (
  saveNo: number,
  callback: (saveNo: number, success: boolean) => void,
) => {
  const theme = creator.theme;
  const colorPlatte = theme.colorPalette ?? 'light';

  const data = {
    themes: {
      ...campDetailsStore.data?.themes,
      [colorPlatte]: theme,
    },
  };

  campDetailsStore
    .updateData(data, 'none')
    .then(() => {
      callback(saveNo, true);
    })
    .catch(() => {
      callback(saveNo, false);
    });
};

creator.onSurveyInstanceCreated.add((_, options) => {
  const survey: SurveyModel = options.survey;

  // Convert markdown to html
  survey.onTextMarkdown.add((survey, options) => {
    const str = markdownConverter.makeHtml(options.text);
    // Remove root paragraphs <p></p>
    options.html = str.substring(3, str.length - 4);
  });

  previewModel.value = survey;
});

creator.onUploadFile.add((_, options) => {
  const files = options.files;

  const campId = campData.value?.id;
  if (!campId || files.length == 0) {
    options.callback('error', '');
    return;
  }

  // TODO Why is it an array and not a single file? The callback only accepts a single link as parameter
  const file = files[0];

  api
    .createCampFile(campId, {
      name: file.name.replace(/\.[^/.]+$/, ''),
      field: 'form-file',
      file,
      accessLevel: 'public',
    })
    .then((file) => {
      const url = campFileStore.getUrl(file.id, campId);
      options.callback('success', url);
    })
    .catch(() => {
      options.callback('error', '');
    });
});

// TODO Files need to be deleted as well

let previousColorPalette: string | undefined;
creator.themeEditor.onThemeSelected.add((sender, options) => {
  const colorPalette = options.theme.colorPalette;
  if (colorPalette === previousColorPalette) {
    return;
  }
  previousColorPalette = colorPalette;

  const themes = campDetailsStore.data?.themes;
  if (themes && colorPalette && colorPalette in themes) {
    const mewTheme = themes[colorPalette];
    creator.themeEditor.model.setTheme(colorPalette, mewTheme);
  }
});
</script>

<style>
.svc-creator {
  position: absolute;
}
/* Creator popups should be over navigation bar */
.sv-popup {
  z-index: 5000;
}
</style>
