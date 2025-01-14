<template>
  <survey-creator-component :model="creator" />
</template>

<script lang="ts" setup>
// Style
import 'survey-core/defaultV2.min.css';
import 'survey-creator-core/survey-creator-core.min.css';
// JS
import 'survey-core/survey.i18n';
import 'survey-creator-core/survey-creator-core.i18n';

import { watchEffect } from 'vue';
import {
  type ICreatorOptions,
  localization,
  PropertyGridEditorCollection,
  SurveyCreatorModel,
} from 'survey-creator-core';
import { useI18n } from 'vue-i18n';
import campDataMapping from 'src/lib/surveyJs/properties/campDataMapping';
import {
  type Base,
  type ITheme,
  type PageModel,
  type SurveyElement,
  type SurveyModel,
} from 'survey-core';
import showdown from 'showdown';
import FileSelectionDialog from 'components/campManagement/settings/files/FileSelectionDialog.vue';
import type { Panel } from 'survey-core/typings/knockout/kopage';
import type {
  CampDetails,
  ServiceFile,
} from '@camp-registration/common/entities';
import { useQuasar } from 'quasar';
import type { SurveyJSCampData } from '@camp-registration/common/entities';
import { setVariables } from '@camp-registration/common/form';

const props = defineProps<{
  camp: CampDetails;
  files: ServiceFile[];
  restrictedAccess: boolean;
  saveFormFunc: (form: SurveyJSCampData) => Promise<void>;
  saveThemeFunc: (theme: ITheme) => Promise<void>;
  saveFileFunc: (file: File) => Promise<string>;
}>();

const quasar = useQuasar();
const { locale } = useI18n();

// Custom properties
PropertyGridEditorCollection.register(campDataMapping);

// Add localization
const deLocale = localization.getLocale('de');
deLocale.qt.address = 'Adresse';
deLocale.qt.country = 'Land';
deLocale.qt.date_of_birth = 'Geburtstag';
deLocale.qt.role = 'Rolle';
deLocale.p.campDataType = 'Daten-Tag';
deLocale.pehelp.campDataType =
  'Wählen Sie aus, welche Art von Daten der Benutzer eingibt. ' +
  'Die Informationen werden dem Dienst unabhängig vom ' +
  'Feldnamen zur Verfügung gestellt.';

const enLocale = localization.getLocale('en');
enLocale.qt.address = 'Address';
enLocale.qt.country = 'Country';
enLocale.qt.date_of_birth = 'Birthday';
enLocale.qt.rolle = 'Role';
enLocale.p.campDataType = 'Data Tag';
enLocale.pehelp.campDataType =
  'Select what type of data the user enters. ' +
  'The information makes information available to the service regardless of the ' +
  'field name.';

const frLocale = localization.getLocale('fr');
frLocale.qt.address = 'Adresse';
frLocale.qt.country = 'Pays';
frLocale.qt.date_of_birth = 'Date de Naissance';
frLocale.qt.role = 'Rôle';
frLocale.p.campDataType = 'Étiquette de données';
frLocale.pehelp.campDataType =
  'Sélectionnez le type de données que l’utilisateur saisit. ' +
  'Les informations sont mises à la disposition du service indépendamment du ' +
  'nom du champ.';

const creatorOptions: ICreatorOptions = {
  showLogicTab: true,
  showTranslationTab: true,
  showEmbeddedSurveyTab: false,
  isAutoSave: true,
  themeForPreview: 'defaultV2',
  showThemeTab: true,
  showJSONEditorTab: !props.restrictedAccess,
};

const markdownConverter = new showdown.Converter({
  openLinksInNewWindow: true,
});

const creator = new SurveyCreatorModel(creatorOptions);

creator.JSON = props.camp.form;
creator.theme = props.camp.themes['light'];

if (props.restrictedAccess) {
  const panelItem = creator.toolbox.getItemByName('panel');
  // Allow restricted users to add only panels. If you want to hide the entire Toolbox, set `creator.showToolbox = false;`
  creator.toolbox.clearItems();
  creator.toolbox.addItem(panelItem);

  // Change the default question type to "panel"
  creator.currentAddQuestionType = 'panel';

  creator.showAddQuestionButton = false;
}

watchEffect(() => {
  creator.locale = locale.value.split(/[-_]/)[0];
});

creator.onPropertyValidationCustomError.add((_, options) => {
  if (!['name', 'valueName'].includes(options.propertyName)) {
    return;
  }

  // Internal variables start with _
  if (options.value.startsWith('_')) {
    options.error = 'Zero is not allowed here.';
    return;
  }

  if (options.value === 0) {
    options.error = 'Zero is not allowed here.';
    return;
  }

  // Dots are used to access objects
  if (options.value.includes('.')) {
    options.error = 'Dots are not allowed here.';
    return;
  }
});

creator.saveSurveyFunc = (
  saveNo: number,
  callback: (saveNo: number, success: boolean) => void,
) => {
  props
    .saveFormFunc(creator.JSON)
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

  props
    .saveThemeFunc(theme)
    .then(() => {
      callback(saveNo, true);
    })
    .catch(() => {
      callback(saveNo, false);
    });
};

creator.onSurveyInstanceCreated.add((_, options) => {
  const survey: SurveyModel = options.survey;

  if (options.area === 'preview-tab' || options.area === 'designer-tab') {
    // Convert markdown to html
    survey.onTextMarkdown.add((_, options) => {
      const str = markdownConverter.makeHtml(options.text);
      // Remove root paragraphs <p></p>
      options.html = str.substring(3, str.length - 4);
    });
  }

  if (options.area === 'preview-tab' || options.area === 'theme-tab') {
    // Set surveyID for dynamic link generation
    survey.surveyId = props.camp.id;

    setVariables(survey, props.camp);
    survey.onLocaleChangedEvent.add((sender) => {
      setVariables(sender, props.camp);
    });
  }
});

creator.onUploadFile.add((_, options) => {
  const files = options.files;

  const campId = props.camp.id;
  if (!campId || files.length == 0) {
    options.callback('error', '');
    return;
  }

  const file = files[0];

  props
    .saveFileFunc(file)
    .then((fileUrl) => options.callback('success', fileUrl))
    .catch(() => options.callback('error', ''));
});

creator.onOpenFileChooser.add((_, options) => {
  quasar
    .dialog({
      component: FileSelectionDialog,
      componentProps: {
        accept: 'image/*',
        accessLevel: 'public',
      },
    })
    .onOk((files) => {
      options.callback(files);
    })
    .onCancel(() => {
      options.callback([]);
    });
});

let previousColorPalette: string | undefined;
creator.themeEditor.onThemeSelected.add((_, options) => {
  const colorPalette = options.theme.colorPalette;
  if (colorPalette === previousColorPalette) {
    return;
  }
  previousColorPalette = colorPalette;

  const themes = props.camp.themes;
  if (themes && colorPalette && colorPalette in themes) {
    const mewTheme = themes[colorPalette];
    creator.themeEditor.model.setTheme(colorPalette, mewTheme);
  }
});

creator.onElementAllowOperations.add((_, options) => {
  if (!props.restrictedAccess) {
    return;
  }
  // Disallow restricted users to change question types, delete questions, or copy them
  options.allowChangeType = false;
  options.allowCopy = false;
  const obj = options.obj as SurveyElement;
  if (obj.isQuestion) {
    options.allowDelete = false;
  }
  if (obj.isPage || obj.isPanel) {
    options.allowDelete = (obj as Panel | PageModel).questions.length === 0;
  }
});

creator.onCollectionItemAllowOperations.add((_, options) => {
  if (!props.restrictedAccess) {
    return;
  }
  // Disallow restricted users to delete columns via adorers on the design surface
  options.allowDelete = !isObjColumn(options.item);
});

creator.onConfigureTablePropertyEditor.add((_, options) => {
  if (!props.restrictedAccess) {
    return;
  }
  // Disallow restricted users to add or delete matrix columns via the Property Grid
  options.allowAddRemoveItems = options.propertyName !== 'columns';
});

creator.onGetPropertyReadOnly.add((_, options) => {
  if (!props.restrictedAccess) {
    return;
  }
  // Disallow restricted users to change cell question type in matrices
  if (options.property.name === 'cellType') {
    options.readOnly = true;
  }
  // Disallow restricted users to modify the `name` property for questions and matrix columns
  const obj = options.obj as SurveyElement;
  const disallowedProperties = ['name', 'campDataType'];
  if (disallowedProperties.includes(options.property.name)) {
    options.readOnly = obj.isQuestion || isObjColumn(options.obj);
  }
});

function isObjColumn(obj: Base) {
  return !!obj && obj.getType() === 'matrixdropdowncolumn';
}
</script>

<style scoped></style>
