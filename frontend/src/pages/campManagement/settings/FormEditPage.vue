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
  // haveCommercialLicense: true, // TODO Enable with licence
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

creator.onPreviewSurveyCreated.add((_, options) => {
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
  campFileStore
    .createEntry({
      name: '',
      field: '',
      file: options.file,
      accessLevel: 'public',
    })
    .then(() => {
      // TODO Get url
      const url = '';
      options.callback('success', url);
    })
    .catch(() => {
      options.callback('error');
    });
});

// TODO Files need to be deleted as well
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
