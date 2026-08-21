<template>
  <survey-creator-component :model="creator" />
</template>

<script lang="ts" setup>
// Style
import 'survey-core/survey-core.min.css';
import 'survey-creator-core/survey-creator-core.min.css';
// JS
import 'survey-core/i18n';
// Json editor
import 'ace-builds/src-noconflict/ace';
import 'ace-builds/src-noconflict/ext-searchbox';
import 'ace-builds/src-noconflict/theme-clouds_midnight';

import { watchEffect } from 'vue';
import {
  type ICreatorOptions,
  localization,
  PropertyGridEditorCollection,
  SurveyCreatorModel,
} from 'survey-creator-core';
import { SurveyCreatorComponent } from 'survey-creator-vue';
import { useI18n } from 'vue-i18n';
import campDataMapping from '@/lib/surveyJs/properties/campDataMapping';
import {
  type Base,
  type ITheme,
  type PageModel,
  type PanelModel,
  type SurveyElement,
  type SurveyModel,
  Serializer,
} from 'survey-core';
import { surveyLocalization } from 'survey-core';
import { createMarkdownConverter } from '@camp-registration/common/utils';
import FileSelectionDialog from '@/components/campManagement/settings/files/FileSelectionDialog.vue';
import type {
  CampDetails,
  ServiceFile,
} from '@camp-registration/common/entities';
import { useQuasar } from 'quasar';
import type { SurveyJSCampData } from '@camp-registration/common/entities';
import {
  fileDynamicTextProcessor,
  setVariables,
} from '@camp-registration/common/form';
import { useAPIService } from '@/services/APIService';
import { surveyCreatorCustomLocaleConfig } from '@/components/campManagement/settings/form/form-editor-translations';
import { AceJsonEditorModel } from 'survey-creator-core';
import { corporateTheme } from '@/lib/surveyJs/theme';

AceJsonEditorModel.aceBasePath =
  'https://unpkg.com/ace-builds/src-min-noconflict/';

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
const api = useAPIService();

// Custom properties
PropertyGridEditorCollection.register(campDataMapping);

function hideProperty(className: string, propertyName: string) {
  const property = Serializer.getProperty(className, propertyName);
  if (!property) {
    // eslint-disable-next-line no-console
    console.warn(`SurveyJS property not found: ${className}.${propertyName}`);
    return;
  }

  property.visible = false;
}

hideProperty('survey', 'cookieName');
hideProperty('survey', 'widthMode');
hideProperty('survey', 'completedBeforeHtml');
hideProperty('survey', 'readOnly');
hideProperty('survey', 'partialSendEnabled');
hideProperty('survey', 'questionOrder');

// Add localization
for (const [locale, sections] of Object.entries(
  surveyCreatorCustomLocaleConfig,
)) {
  const l = localization.getLocale(locale);

  Object.keys(sections).forEach((key) => {
    const target = l[key];
    const source = sections[key as keyof typeof sections];

    if (target && typeof target === 'object' && source) {
      Object.assign(target, source);
    }
  });
}

const creatorOptions: ICreatorOptions = {
  showLogicTab: true,
  showTranslationTab: true,
  showEmbeddedSurveyTab: false,
  showCreatorThemeSettings: false,
  autoSaveEnabled: true,
  showThemeTab: false,
  showJSONEditorTab: !props.restrictedAccess,
};

const mdConverter = createMarkdownConverter();

surveyLocalization.supportedLocales = ['en', ...props.camp.locales];

const creator = new SurveyCreatorModel(creatorOptions);

creator.JSON = props.camp.form;
// The same theme the public camp page applies, so the designer and preview
// render the real thing. Copied because `SurveyCreatorModel.applyTheme` keeps
// the object by reference rather than merging it.
creator.theme = { ...corporateTheme };

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
  creator.locale = locale.value.split(/[-_]/)[0] ?? 'en';
});

// Restrict valueName characters
creator.onPropertyDisplayCustomError.add((_, options) => {
  if (!['name', 'valueName'].includes(options.propertyName)) {
    return;
  }

  // An error was thrown here in production - not sure why it should be nullish
  if (!options.value) {
    return;
  }

  // Internal variables start with _
  if (options.value.startsWith('_')) {
    options.error = 'Underscore is not allowed here.';
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
  // `themeEditor` is the "theme" plugin, which only exists while `showThemeTab`
  // is on. Kept wired so re-enabling the tab is a one-line change, but it must
  // not throw in the meantime.
  if (!creator.themeEditor) {
    callback(saveNo, true);
    return;
  }

  // Autosave fires just for opening the Themes tab, so skip untouched themes —
  // otherwise a camp that never customised anything still ends up with a stored
  // theme that pins it to one colour scheme.
  if (!creator.themeEditor.isModified) {
    callback(saveNo, true);
    return;
  }

  // Store only what the director actually changed, not the fully resolved
  // theme. A complete theme is a snapshot of literal colours that overrides the
  // adapter for every token it names, which freezes the form to one palette and
  // stops it following light/dark. A delta leaves everything untouched falling
  // through to the live `--md3-*` tokens.
  const theme = creator.themeEditor.getCurrentTheme(true);

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

  if (['preview-tab', 'designer-tab', 'theme-tab'].includes(options.area)) {
    // Convert markdown to html
    survey.onTextMarkdown.add((_, options) => {
      options.html = mdConverter.renderInline(options.text);
    });
  }

  if (['preview-tab', 'theme-tab'].includes(options.area)) {
    setVariables(survey, props.camp);
    survey.onLocaleChangedEvent.add((sender) => {
      setVariables(sender, props.camp);
    });
    survey.onProcessDynamicText.add(
      fileDynamicTextProcessor((slot) =>
        api.getCampFileSlotUrl(props.camp.id, slot, survey.locale),
      ),
    );
  }

  if (['preview-tab'].includes(options.area)) {
    function readAsDataURL(
      file: File,
    ): Promise<{ name: string; content: string; type: string; file: File }> {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            name: file.name,
            type: file.type,
            content: reader.result as string,
            file,
          });
        };
        reader.onerror = () => {
          reject(new Error(`Failed to read file "${file.name}"`));
        };
        reader.readAsDataURL(file);
      });
    }

    survey.onUploadFiles.add((_, options) => {
      Promise.all(options.files.map(readAsDataURL))
        .then((value) => {
          options.callback('success', value);
        })
        .catch((reason) => {
          options.callback('error', reason.message);
        });
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

  const file = files[0]!;

  props
    .saveFileFunc(file)
    .then((fileUrl) => options.callback('success', fileUrl))
    .catch(() => options.callback('error', ''));
});

creator.onOpenFileChooser.add((_, options) => {
  const field =
    options.elementType.toString() + '_' + options.propertyName.toString();

  quasar
    .dialog({
      component: FileSelectionDialog,
      componentProps: {
        accept: 'image/*',
        accessLevel: 'public',
        field,
      },
    })
    .onOk((files: ServiceFile[]) => {
      options.callback(files as unknown as File[]);
    })
    .onCancel(() => {
      options.callback([]);
    });
});

creator.onElementAllowOperations.add((_, options) => {
  if (!props.restrictedAccess) {
    return;
  }
  // Disallow restricted users to change question types, delete questions, or copy them
  options.allowChangeType = false;
  options.allowCopy = false;
  const obj = options.element as SurveyElement;
  if (obj.isQuestion) {
    options.allowDelete = false;
  }
  if (obj.isPage || obj.isPanel) {
    options.allowDelete =
      (obj as PanelModel | PageModel).questions.length === 0;
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

creator.onPropertyGetReadOnly.add((_, options) => {
  if (!props.restrictedAccess) {
    return;
  }
  // Disallow restricted users to change cell question type in matrices
  if (options.property.name === 'cellType') {
    options.readOnly = true;
  }
  // Disallow restricted users to modify the `name` property for questions and matrix columns
  const obj = options.element as SurveyElement;
  const disallowedProperties = ['name', 'campDataType'];
  if (disallowedProperties.includes(options.property.name)) {
    options.readOnly = obj.isQuestion || isObjColumn(options.element);
  }
});

function isObjColumn(obj: Base) {
  return !!obj && obj.getType() === 'matrixdropdowncolumn';
}
</script>
