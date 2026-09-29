<template>
  <survey-creator-component :model="creator" />
</template>

<script lang="ts" setup>
import 'survey-core/survey-core.min.css';
import 'survey-creator-core/survey-creator-core.min.css';
import '@/lib/surveyJs/creatorSetup';
import type { Ace } from 'ace-builds';
import { config as aceConfig } from 'ace-builds';
import { onBeforeUnmount, ref, watch, watchEffect } from 'vue';
import { type ICreatorOptions, SurveyCreatorModel } from 'survey-creator-core';
import { SurveyCreatorComponent } from 'survey-creator-vue';
import { useI18n } from 'vue-i18n';
import {
  Base,
  type ITheme,
  type PageModel,
  type PanelModel,
  type SurveyElement,
  type SurveyModel,
  Serializer,
} from 'survey-core';
import FileSelectionDialog from '@/components/event/settings/files/FileSelectionDialog.vue';
import type {
  EventDetails,
  ServiceFile,
  SurveyJSEventData,
} from '@camp-registration/common/entities';
import { useQuasar } from 'quasar';
import { setVariables } from '@camp-registration/common/form';
import {
  addDesignerFileSlotResolver,
  addFileSlotResolver,
  addMarkdownRenderer,
} from '@/lib/surveyJs/textProcessing';
import { useAPIService } from '@/services/APIService';
import { buildMd3LiteralTheme, resolveMd3Theme } from '@/lib/surveyJs/theme';
import {
  addConditionBadge,
  applyEditorMode,
  conditionProperty,
  createEditorModeAction,
  EDITOR_MODES,
  type EditorMode,
  resetEditorModeGlobals,
} from '@/lib/surveyJs/editorModes';
import { fieldFromParts } from '@/utils/fileField';
import { emphasizeForwardNavigation } from '@/lib/surveyJs/navigation';
import { readAsDataURL } from '@/utils/readAsDataURL';

const props = defineProps<{
  event: EventDetails;
  restrictedAccess: boolean;
  saveFormFunc: (form: SurveyJSEventData) => Promise<void>;
  saveThemeFunc: (theme: ITheme) => Promise<void>;
  // Resolves to the file's slot (its `field`).
  saveFileFunc: (file: File) => Promise<string>;
}>();

const quasar = useQuasar();
const { t, locale } = useI18n();
const api = useAPIService();

// Tabs and survey locales come from the mode preset (see `applyMode`).
const creatorOptions: ICreatorOptions = {
  showCreatorThemeSettings: false,
  autoSaveEnabled: true,
};

const creator = new SurveyCreatorModel(creatorOptions);

// Resolved MD3 snapshot used as the editable default whenever an event has no
// saved theme. The editor parses color values back into its pickers, so it
// must be fed literals — not the var()-based runtime themes.
const md3DefaultThemes = {
  light: buildMd3LiteralTheme('light'),
  dark: buildMd3LiteralTheme('dark'),
};
creator.themeEditor.addTheme(md3DefaultThemes.light);
creator.themeEditor.addTheme(md3DefaultThemes.dark);

creator.JSON = props.event.form;

// The chosen mode is a per-user convenience, so browser storage is enough.
const MODE_STORAGE_KEY = 'formEditor.mode';

const mode = ref<EditorMode>(readStoredMode());

// On narrow screens the creator hides its top toolbar and shows a footer bar
// instead, so the dropdown goes into both — one instance each, as a container
// restyles the actions it holds. The footer one is icon-only to save width.
const modeActions = (
  [
    [creator.toolbar, false],
    [creator.footerToolbar, true],
  ] as const
).map(([toolbar, compact]) => {
  const modeAction = createEditorModeAction({
    mode: mode.value,
    title: (value) => t(`mode.${value}`),
    tooltip: (value) => `${t('mode.label')}: ${t(`mode.${value}`)}`,
    onSelect: selectMode,
    compact,
    verticalPosition: compact ? 'top' : 'bottom',
  });
  toolbar.actions.unshift(modeAction.action);
  return modeAction;
});

// Re-translates the dropdowns on locale changes.
watchEffect(() => {
  modeActions.forEach((action) => action.update(mode.value));
});

addConditionBadge(creator, {
  title: () => t('mode.condition'),
  onEdit: (element) => {
    selectMode('standard');
    creator.selectElement(element, conditionProperty(element));
  },
});

function creatorLocale(): string {
  return locale.value.split(/[-_]/)[0] ?? 'en';
}

function applyMode() {
  applyEditorMode(creator, mode.value, {
    creatorLocale: creatorLocale(),
    eventLocales: props.event.locales,
    restrictedAccess: props.restrictedAccess,
  });
  // A preset rebuilds the toolbox, so the restriction goes on top every time.
  applyRestrictedToolbox();
}

function selectMode(value: EditorMode) {
  if (value === mode.value) {
    return;
  }
  mode.value = value;
  try {
    localStorage.setItem(MODE_STORAGE_KEY, value);
  } catch {
    // Storage unavailable: the choice just won't be remembered.
  }
  applyMode();
}

function readStoredMode(): EditorMode {
  try {
    const stored = localStorage.getItem(MODE_STORAGE_KEY);
    return EDITOR_MODES.find((value) => value === stored) ?? 'simple';
  } catch {
    return 'simple';
  }
}

function applyRestrictedToolbox() {
  if (!props.restrictedAccess) {
    return;
  }

  const panelItem = creator.toolbox.getItemByName('panel');
  // Allow restricted users to add only panels. If you want to hide the entire Toolbox, set `creator.showToolbox = false;`
  creator.toolbox.clearItems();
  creator.toolbox.addItem(panelItem);

  // Change the default question type to "panel"
  creator.currentAddQuestionType = 'panel';

  creator.showAddQuestionButton = false;
}

applyMode();

watchEffect(() => {
  creator.locale = creatorLocale();
});

watch(
  () => quasar.dark.isActive,
  (isDark) => {
    applySurveyTheme(isDark);
    jsonEditor?.setTheme(aceTheme(isDark));
  },
);

// The JSON tab creates a new Ace editor each time it opens.
let jsonEditor: Ace.Editor | undefined;
const onAceEditorCreated = (editor: Ace.Editor) => {
  jsonEditor = editor;
  editor.setTheme(aceTheme(quasar.dark.isActive));
};
aceConfig.on('editor', onAceEditorCreated);
onBeforeUnmount(() => {
  aceConfig.off('editor', onAceEditorCreated);
  resetEditorModeGlobals();
});

function aceTheme(isDark: boolean): string {
  return isDark ? 'ace/theme/clouds_midnight' : 'ace/theme/textmate';
}

// Creator chrome is themed by `.sjs-theme-overrides` (md3-adapter.scss),
// which survey-creator-core stamps on the creator root itself — no JS theme
// object needed. Only the survey's own theme (design/preview/theme tabs)
// still has to be applied explicitly.
applySurveyTheme(quasar.dark.isActive);

// Keeps the survey rendered inside the creator on the same theme the
// registration page would pick for the same event and mode, so the designer
// and preview tabs stop drifting from what registrants actually see.
function applySurveyTheme(isDark: boolean) {
  creator.theme = resolveMd3Theme(
    props.event.themes,
    isDark ? 'dark' : 'light',
  );

  // TODO This is a workaround for the issue with the theme not being applied correctly
  // The value is null because the backend middleware
  // converts empty strings to null
  // See https://github.com/surveyjs/survey-creator/issues/5552
  if (creator.theme.backgroundImage === null) {
    creator.theme.backgroundImage = '';
  }
}

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
  const resolveFileSlot = (slot: string, locale: string) =>
    api.getEventFileSlotUrl(props.event.id, slot, locale);

  if (['preview-tab', 'designer-tab', 'theme-tab'].includes(options.area)) {
    addMarkdownRenderer(survey);
  }

  // Design mode skips text processing, so file slots need their own resolver.
  if (options.area === 'designer-tab') {
    addDesignerFileSlotResolver(survey, resolveFileSlot, props.event.logo);
  }

  if (['preview-tab', 'theme-tab'].includes(options.area)) {
    emphasizeForwardNavigation(survey);
    setVariables(survey, props.event);
    addFileSlotResolver(survey, resolveFileSlot);
    survey.onLocaleChangedEvent.add((sender) => {
      setVariables(sender, props.event);
    });
  }

  if (options.area === 'preview-tab') {
    // Nothing is uploaded from the preview; files stay in memory.
    survey.onUploadFiles.add((_, options) => {
      Promise.all(
        options.files.map(async (file) => ({
          file,
          content: await readAsDataURL(file),
        })),
      )
        .then((files) => options.callback(files))
        .catch((reason: Error) => options.callback([], [reason.message]));
    });
  }
});

creator.onUploadFile.add((_, options) => {
  const files = options.files;

  const eventId = props.event.id;
  if (!eventId || files.length == 0) {
    options.callback('error', '');
    return;
  }

  const file = files[0]!;

  props
    .saveFileFunc(file)
    .then((slot) =>
      options.callback(
        'success',
        isTextProcessed(options.element, options.propertyName.toString())
          ? `{_file.${slot}}`
          : api.getEventFileSlotUrl(props.event.id, slot),
      ),
    )
    .catch(() => options.callback('error', ''));
});

// Only localizable strings (logo, image links) go through text processing, so
// only they can hold a `{_file.<slot>}` placeholder. Everything else — theme
// and header backgrounds among them — is used verbatim and needs a real URL.
function isTextProcessed(element: Base | ITheme, propertyName: string) {
  return (
    element instanceof Base &&
    !!Serializer.findProperty(element.getType(), propertyName)?.isLocalizable
  );
}

// Named survey elements (pages, panels, questions) share their type with
// every other instance of it, so `elementType` alone would give every page's
// backgroundImage the same field. Theme/header targets have no `name` and
// stay one field per survey, which is what's wanted there anyway.
function elementInstanceName(element: Base | ITheme): string | undefined {
  return 'name' in element && typeof element.name === 'string'
    ? element.name
    : undefined;
}

creator.onOpenFileChooser.add((_, options) => {
  const baseField = fieldFromParts([
    options.elementType.toString(),
    elementInstanceName(options.element),
    options.propertyName.toString(),
  ]);

  quasar
    .dialog({
      component: FileSelectionDialog,
      componentProps: {
        accept: 'image/*',
        accessLevel: 'public',
        field: baseField,
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
  const disallowedProperties = ['name', 'eventDataType'];
  if (disallowedProperties.includes(options.property.name)) {
    options.readOnly = obj.isQuestion || isObjColumn(options.element);
  }
});

function isObjColumn(obj: Base) {
  return !!obj && obj.getType() === 'matrixdropdowncolumn';
}
</script>

<style lang="scss">
// Mirrors the toolbar clearance EventLayout gives the header on the
// registration page, so the preview header is as tall as the real one.
// Unscoped: the creator root doesn't carry this component's scope attribute.
.svc-test-tab__content .sv-header {
  padding-top: 4rem;
}
</style>

<i18n lang="yaml" locale="en">
mode:
  label: 'Editor mode'
  simple: 'Simple'
  standard: 'Standard'
  expert: 'Expert'
  condition: 'Has conditions — edit them in Standard mode'
</i18n>

<i18n lang="yaml" locale="de">
mode:
  label: 'Editormodus'
  simple: 'Einfach'
  standard: 'Standard'
  expert: 'Experte'
  condition: 'Hat Bedingungen – im Standardmodus bearbeiten'
</i18n>

<i18n lang="yaml" locale="fr">
mode:
  label: "Mode de l'éditeur"
  simple: 'Simple'
  standard: 'Standard'
  expert: 'Expert'
  condition: 'Contient des conditions – modifiables en mode standard'
</i18n>

<i18n lang="yaml" locale="pl">
mode:
  label: 'Tryb edytora'
  simple: 'Prosty'
  standard: 'Standardowy'
  expert: 'Ekspert'
  condition: 'Ma warunki – edytuj je w trybie standardowym'
</i18n>

<i18n lang="yaml" locale="cs">
mode:
  label: 'Režim editoru'
  simple: 'Jednoduchý'
  standard: 'Standardní'
  expert: 'Expert'
  condition: 'Obsahuje podmínky – upravte je ve standardním režimu'
</i18n>
