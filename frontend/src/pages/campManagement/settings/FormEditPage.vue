<template>
  <page-state-handler
    :error="error"
    :loading="loading"
  >
    <div
      id="surveyCreator"
      class="absolute fit"
    />
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
import { PropertyGridEditorCollection, SurveyCreator } from 'survey-creator-knockout';
import { computed, onMounted } from 'vue';
import { localization } from 'survey-creator-core';
import { useI18n } from 'vue-i18n';
import { useSurveyTools } from 'src/composables/survey';
import { useCampDetailsStore } from 'stores/camp-details-store';
import campDataMapping from 'src/lib/surveyJs/properties/campDataMapping';

const campDetailsStore = useCampDetailsStore();
const { locale } = useI18n();
const { setCampVariables } = useSurveyTools();

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
  themeForPreview: 'defaultV2', // TODO Which should be the default?
  showThemeTab: false, // TODO Enable when ready to store themes
};

onMounted(async () => {
  localization.currentLocale = locale.value.split(/[-_]/)[0];

  const creator = new SurveyCreator(creatorOptions);
  creator.onPropertyValidationCustomError.add((sender, options) => {
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

  await campDetailsStore.fetchData();

  if (!campDetailsStore.data) {
    return;
  }

  creator.JSON = campDetailsStore.data.form;

  creator.saveSurveyFunc = (
    saveNo: number,
    callback: (saveNo: number, success: boolean) => void,
  ) => {
    campDetailsStore
      .updateData(
        {
          form: creator.JSON,
        },
        'none',
      )
      .then(() => {
        callback(saveNo, true);
      })
      .catch(() => {
        callback(saveNo, false);
      });
  };

  creator.onPreviewSurveyCreated.add((sender, options) => {
    setCampVariables(options.survey, campDetailsStore.data);

    // TODO Add functions
  });

  setTimeout(() => {
    // FIXME THIS FUNCTIONS BLOCKS THE EVENT LOOP FOR UP TO 10 s. NOT ACCEPTABLE
    creator.render('surveyCreator');
  }, 100);
});
</script>
