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
import { useRouter } from 'vue-router';
import {
  type ICreatorOptions,
  showConfirmDialog,
  SurveyCreatorModel,
} from 'survey-creator-core';
import { SurveyCreatorComponent } from 'survey-creator-vue';
import { useI18n } from 'vue-i18n';
import type { ITheme, SurveyModel } from 'survey-core';
import FileSelectionDialog from '@/components/event/settings/files/FileSelectionDialog.vue';
import type {
  EventDetails,
  ServiceFile,
  FormJson,
} from '@camp-registration/common/entities';
import { useQuasar } from 'quasar';
import {
  formLintOptions,
  prepareEventSurvey,
} from '@camp-registration/common/form';
import { usePrivacyNoticeService } from '@/services/PrivacyNoticeService';
import type { ConsentQuestionTexts } from '@/lib/surveyJs/consentQuestion';
import { attachPrivacyIssues } from '@/lib/surveyJs/privacyIssues';
import { lostSensitiveQuestions } from '@/lib/surveyJs/sensitiveAnswers';
import { isSensitiveDataCleared } from '@camp-registration/common/privacy';
import { APP_LOCALES } from '@/i18n/locales';
import { allGroupValues } from '@camp-registration/common/utils';
import {
  addDesignerFileSlotResolver,
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
import { createPreviewGroupAction } from '@/lib/surveyJs/previewGroup';
import { countryName } from '@/utils/countries';
import { addToBothToolbars } from '@/lib/surveyJs/creatorToolbars';
import { attachCreatorFiles } from '@/lib/surveyJs/creatorFiles';
import { attachNameRules } from '@/lib/surveyJs/nameRules';
import {
  addRestrictedAccessRules,
  restrictToolbox,
} from '@/lib/surveyJs/restrictedAccess';
import { emphasizeForwardNavigation } from '@/lib/surveyJs/navigation';
import { setCompleteTextDefault } from '@/lib/surveyJs/completeText';
import { addAmountSummary, trackAmountDue } from '@/lib/surveyJs/amountDue';
import { showPricesOnlyWhenTagged } from '@/lib/surveyJs/pricedQuestions';
import { readAsDataURL } from '@/utils/readAsDataURL';

const props = defineProps<{
  event: EventDetails;
  restrictedAccess: boolean;
  /** Whether submitted registrations exist, whose answers the form reads. */
  hasRegistrations: boolean;
  saveFormFunc: (form: FormJson) => Promise<void>;
  saveThemeFunc: (theme: ITheme) => Promise<void>;
  // Resolves to the file's slot (its `field`).
  saveFileFunc: (file: File) => Promise<string>;
}>();

const quasar = useQuasar();
const { t, locale } = useI18n();
const { t: gt } = useI18n({ useScope: 'global' });
const api = useAPIService();

// Tabs and survey locales come from the mode preset (see `applyMode`).
const creatorOptions: ICreatorOptions = {
  showCreatorThemeSettings: false,
  autoSaveEnabled: true,
};

const creator = new SurveyCreatorModel(creatorOptions);
showPricesOnlyWhenTagged(creator);

// Same options the preset lint test uses (see `formLintOptions`).
creator.onLintSurvey.add((_, options) => {
  options.lintOptions = formLintOptions(options.lintOptions);
});

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

const modeActions = addToBothToolbars(
  creator,
  (placement) =>
    createEditorModeAction({
      mode: mode.value,
      title: (value) => t(`mode.${value}`),
      tooltip: (value) => `${t('mode.label')}: ${t(`mode.${value}`)}`,
      onSelect: selectMode,
      ...placement,
    }),
  'start',
);

// Re-translates the dropdowns on locale changes.
watchEffect(() => {
  modeActions.forEach((action) => action.update(mode.value));
});

// The group the preview and theme tabs answer the form for, as the group step
// does on the event page. A form keeps its group, so a change rebuilds it.
const previewGroup = ref<string | null>(props.event.countries[0] ?? null);

if (props.event.countries.length > 1) {
  const groupActions = addToBothToolbars(
    creator,
    (placement) =>
      createPreviewGroupAction(creator, {
        countries: props.event.countries,
        group: previewGroup.value ?? '',
        title: (country) => countryName(country, locale.value),
        tooltip: (country) =>
          t('preview.group', { group: countryName(country, locale.value) }),
        onSelect: (country) => {
          previewGroup.value = country;
          // Rebuilds the open tab's survey, now answered for the new group.
          creator.getPlugin(creator.activeTab)?.update?.();
        },
        ...placement,
      }),
    'end',
  );

  watchEffect(() => {
    groupActions.forEach((action) => action.update(previewGroup.value ?? ''));
  });
}

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
  if (props.restrictedAccess) {
    restrictToolbox(creator);
  }
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

if (props.restrictedAccess) {
  addRestrictedAccessRules(creator);
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

attachNameRules(creator, {
  message: (issue) => t(`names.${issue}`),
  blocked: ({ name, issue }) =>
    t('names.blocked', { name, reason: t(`names.${issue}`) }),
});

// Each question keeping the event from taking registrations says what to do
// (docs/privacy.md, 5); the event dashboard says it for the event as a whole.
const router = useRouter();
const privacyIssues = attachPrivacyIssues(creator, {
  message: ({ kind, category, column }) => {
    const message = t(`privacy.${kind}`, { category: categoryName(category) });
    return column ? t('privacy.inColumn', { column, message }) : message;
  },
  action: (kind) =>
    t(kind === 'uncovered' ? 'privacy.addConsent' : 'privacy.openNotice'),
  consentTexts,
  openPrivacySettings: () => {
    void router.push({ name: 'management.event.settings.privacy' });
  },
});

usePrivacyNoticeService()
  .fetchEventNotice(props.event.id)
  .then(({ notice }) => privacyIssues.setNotice(notice))
  .catch(() => {
    // Without the notice there is nothing to compare; the server still gates.
  });

function categoryName(category: string, locale?: string): string {
  const key = `privacy.dataCategory.${category}`;
  return locale ? gt(key, {}, { locale }) : gt(key);
}

/** A consent question's wording in every form locale, the presets' way. */
function consentTexts(category: string): ConsentQuestionTexts {
  const inEveryLocale = (text: (locale: string) => string) =>
    Object.fromEntries(APP_LOCALES.map((locale) => [locale, text(locale)]));
  // Mid-sentence: lowercased, except in German, where nouns keep the capital.
  const nameIn = (locale: string) => {
    const name = categoryName(category, locale);
    return locale === 'de'
      ? name
      : name.charAt(0).toLowerCase() + name.slice(1);
  };

  return {
    title: inEveryLocale((locale) =>
      t('privacy.consent.title', { category: nameIn(locale) }, { locale }),
    ),
    description: inEveryLocale((locale) =>
      t('privacy.consent.description', {}, { locale }),
    ),
    error: inEveryLocale((locale) =>
      t('privacy.consent.error', {}, { locale }),
    ),
  };
}

type SaveCallback = (saveNo: number, success: boolean) => void;

// The form registrations' answers are read against: the email filter and
// "Delete sensitive data" follow its tags (docs/privacy.md, 5).
let savedForm: FormJson = props.event.form;

function saveForm(form: FormJson, saveNo: number, callback: SaveCallback) {
  props
    .saveFormFunc(form)
    .then(() => {
      savedForm = form;
      callback(saveNo, true);
      privacyIssues.refresh();
    })
    .catch(() => {
      callback(saveNo, false);
    });
}

// An edit leaving stored sensitive answers unrecognized asks first. Undoing
// restores the saved form, so it reverts any kind of edit, JSON tab included.
creator.saveSurveyFunc = (saveNo: number, callback: SaveCallback) => {
  const form: FormJson = creator.JSON;
  const lost =
    props.hasRegistrations && !isSensitiveDataCleared(props.event)
      ? lostSensitiveQuestions(savedForm, form, creatorLocale())
      : [];
  if (lost.length === 0) {
    saveForm(form, saveNo, callback);
    return;
  }

  // The Creator's own confirmation, as its plugins ask theirs.
  const questions = lost
    .map((question) => `“${question.title || question.name}”`)
    .join(', ');
  showConfirmDialog(creator, {
    category: 'danger',
    iconName: 'icon-warning-24x24',
    title: t('privacy.lost.title'),
    message: t('privacy.lost.message', { questions }),
    applyText: t('privacy.lost.keep'),
    cancelText: t('privacy.lost.undo'),
    showCloseButton: false,
    onApply: () => {
      saveForm(form, saveNo, callback);
      return true;
    },
    onCancel: () => {
      creator.JSON = savedForm;
      // Nothing to send: the editor shows the saved form again.
      callback(saveNo, true);
      privacyIssues.refresh();
    },
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
  const resolveFileSlot = (
    slot: string,
    locale: string,
    group: string | null = null,
  ) => api.getEventFileSlotUrl(props.event.id, slot, locale, group);

  if (['preview-tab', 'designer-tab', 'theme-tab'].includes(options.area)) {
    addMarkdownRenderer(survey);
    // Shows the default the registration form will use until the form sets
    // its own Complete button text; the preview follows its answers below.
    setCompleteTextDefault(
      survey,
      allGroupValues(props.event.price).some((price) => price > 0),
    );
  }

  // Design mode skips text processing, so file slots need their own resolver.
  if (options.area === 'designer-tab') {
    addDesignerFileSlotResolver(survey, resolveFileSlot, props.event.logo);
  }

  if (['preview-tab', 'theme-tab'].includes(options.area)) {
    emphasizeForwardNavigation(survey);
    prepareEventSurvey(survey, props.event, {
      group: previewGroup.value,
      resolveFileSlot,
    });
  }

  if (options.area === 'preview-tab') {
    addAmountSummary(survey, trackAmountDue(survey, props.event));
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

attachCreatorFiles(creator, {
  upload: (file) => props.saveFileFunc(file),
  slotUrl: (slot) => api.getEventFileSlotUrl(props.event.id, slot),
  choose: (field) =>
    new Promise((resolve) => {
      quasar
        .dialog({
          component: FileSelectionDialog,
          componentProps: {
            accept: 'image/*',
            accessLevel: 'public',
            field,
          },
        })
        // Event files stand in for uploads: the creator only reads their URL.
        .onOk((files: ServiceFile[]) => resolve(files as unknown as File[]))
        .onCancel(() => resolve([]));
    }),
});
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
names:
  underscore: 'Names starting with an underscore are reserved for the platform.'
  separator: 'Names cannot contain a dot.'
  variable: 'This name is reserved for the event details.'
  blocked: 'The name “{name}” cannot be used. {reason} Change it before leaving the JSON editor.'
preview:
  group: 'Preview as group: {group}'
mode:
  label: 'Editor mode'
  simple: 'Simple'
  standard: 'Standard'
  expert: 'Expert'
  condition: 'Has conditions — edit them in Standard mode'
privacy:
  required: 'Required: registering then depends on consent to “{category}”, which needs a valid justification. If a law requires this data, set another legal basis for it in the privacy settings.'
  undeclared: 'Add “{category}” to the privacy information. Until then, nobody can register.'
  uncovered: 'Add a consent question for “{category}”. Until then, nobody can register.'
  openNotice: 'Open privacy settings'
  inColumn: 'Column “{column}”: {message}'
  addConsent: 'Add consent question'
  lost:
    title: 'Existing answers would no longer count as sensitive'
    message: 'Registrations already hold answers to {questions}. After this change they are no longer treated as sensitive data: they can appear in emails, and “Delete sensitive data” no longer removes them. If a question is no longer needed, hide it instead and keep its name and privacy category. Only keep the change if the question never collected sensitive data.'
    undo: 'Undo change'
    keep: 'Keep change'
  consent:
    title: 'I agree that the information on {category} given in this form is used to look after the participant during the event and shared with the event team.'
    description: 'Voluntary – otherwise leave these fields empty. You can withdraw it at any time via the organizer.'
    error: 'Please agree, or leave those fields empty.'
</i18n>

<i18n lang="yaml" locale="de">
names:
  underscore: 'Namen, die mit einem Unterstrich beginnen, sind für die Plattform reserviert.'
  separator: 'Namen dürfen keinen Punkt enthalten.'
  variable: 'Dieser Name ist für die Veranstaltungsdaten reserviert.'
  blocked: 'Der Name „{name}“ kann nicht verwendet werden. {reason} Ändere ihn, bevor du den JSON-Editor verlässt.'
preview:
  group: 'Vorschau als Gruppe: {group}'
mode:
  label: 'Editormodus'
  simple: 'Einfach'
  standard: 'Standard'
  expert: 'Experte'
  condition: 'Hat Bedingungen – im Standardmodus bearbeiten'
privacy:
  required: 'Pflichtfeld: Die Anmeldung hängt dann von der Einwilligung zu „{category}“ ab, und dafür braucht es eine tragfähige Begründung. Schreibt ein Gesetz diese Angaben vor, wähle in den Datenschutzeinstellungen eine andere Rechtsgrundlage.'
  undeclared: 'Ergänze „{category}“ in den Datenschutzinformationen. Bis dahin kann sich niemand anmelden.'
  uncovered: 'Füge eine Einwilligungsfrage für „{category}“ hinzu. Bis dahin kann sich niemand anmelden.'
  openNotice: 'Datenschutzeinstellungen öffnen'
  inColumn: 'Spalte „{column}“: {message}'
  addConsent: 'Einwilligungsfrage hinzufügen'
  lost:
    title: 'Vorhandene Antworten gälten nicht mehr als sensibel'
    message: 'Anmeldungen enthalten bereits Antworten auf {questions}. Nach dieser Änderung werden sie nicht mehr als sensible Daten behandelt: Sie können in E-Mails erscheinen, und „Sensible Daten löschen“ entfernt sie nicht mehr. Wenn du eine Frage nicht mehr brauchst, blende sie stattdessen aus und behalte ihren Namen und ihre Datenschutzkategorie. Behalte die Änderung nur, wenn die Frage nie sensible Daten erhoben hat.'
    undo: 'Änderung rückgängig machen'
    keep: 'Änderung behalten'
  consent:
    title: 'Ich willige ein, dass die Angaben zu {category} aus diesem Formular zur Betreuung während der Veranstaltung genutzt und an das Veranstaltungsteam weitergegeben werden.'
    description: 'Freiwillig – sonst lass diese Felder leer. Jederzeit beim Veranstalter widerrufbar.'
    error: 'Bitte willige ein oder lass diese Felder leer.'
</i18n>

<i18n lang="yaml" locale="fr">
names:
  underscore: 'Les noms commençant par un tiret bas sont réservés à la plateforme.'
  separator: 'Les noms ne peuvent pas contenir de point.'
  variable: 'Ce nom est réservé aux informations de l’événement.'
  blocked: 'Le nom « {name} » ne peut pas être utilisé. {reason} Modifie-le avant de quitter l’éditeur JSON.'
preview:
  group: 'Aperçu pour le groupe : {group}'
mode:
  label: "Mode de l'éditeur"
  simple: 'Simple'
  standard: 'Standard'
  expert: 'Expert'
  condition: 'Contient des conditions – modifiables en mode standard'
privacy:
  required: 'Obligatoire : l’inscription dépend alors du consentement pour « {category} », ce qui exige une justification valable. Si une loi impose ces données, choisis une autre base juridique dans les paramètres de confidentialité.'
  undeclared: 'Ajoute « {category} » aux informations sur la protection des données. D’ici là, personne ne peut s’inscrire.'
  uncovered: 'Ajoute une question de consentement pour « {category} ». D’ici là, personne ne peut s’inscrire.'
  openNotice: 'Ouvrir les paramètres de confidentialité'
  inColumn: 'Colonne « {column} » : {message}'
  addConsent: 'Ajouter une question de consentement'
  lost:
    title: 'Les réponses existantes ne seraient plus traitées comme sensibles'
    message: 'Des inscriptions contiennent déjà des réponses à {questions}. Après cette modification, elles ne sont plus traitées comme des données sensibles : elles peuvent apparaître dans les e-mails, et « Supprimer les données sensibles » ne les supprime plus. Si une question n’est plus nécessaire, masque-la plutôt et conserve son nom et sa catégorie de confidentialité. Ne garde la modification que si la question n’a jamais collecté de données sensibles.'
    undo: 'Annuler la modification'
    keep: 'Garder la modification'
  consent:
    title: 'J’accepte que les informations sur {category} données dans ce formulaire servent à la prise en charge du participant pendant l’événement et soient transmises à l’équipe.'
    description: 'Facultatif – sinon laisse ces champs vides. Révocable à tout moment auprès de l’organisateur.'
    error: 'Donne ton accord ou laisse ces champs vides.'
</i18n>

<i18n lang="yaml" locale="pl">
names:
  underscore: 'Nazwy zaczynające się od podkreślnika są zarezerwowane dla platformy.'
  separator: 'Nazwy nie mogą zawierać kropki.'
  variable: 'Ta nazwa jest zarezerwowana dla danych wydarzenia.'
  blocked: 'Nazwy „{name}” nie można użyć. {reason} Zmień ją przed opuszczeniem edytora JSON.'
preview:
  group: 'Podgląd dla grupy: {group}'
mode:
  label: 'Tryb edytora'
  simple: 'Prosty'
  standard: 'Standardowy'
  expert: 'Ekspert'
  condition: 'Ma warunki – edytuj je w trybie standardowym'
privacy:
  required: 'Pole obowiązkowe: rejestracja zależy wtedy od zgody dotyczącej kategorii „{category}”, co wymaga ważnego uzasadnienia. Jeśli te dane są wymagane przez prawo, wybierz dla nich inną podstawę prawną w ustawieniach prywatności.'
  undeclared: 'Dodaj kategorię „{category}” do informacji o ochronie danych. Do tego czasu nikt nie może się zarejestrować.'
  uncovered: 'Dodaj pytanie o zgodę obejmujące kategorię „{category}”. Do tego czasu nikt nie może się zarejestrować.'
  openNotice: 'Otwórz ustawienia prywatności'
  inColumn: 'Kolumna „{column}”: {message}'
  addConsent: 'Dodaj pytanie o zgodę'
  lost:
    title: 'Istniejące odpowiedzi przestałyby być traktowane jako wrażliwe'
    message: 'Zgłoszenia zawierają już odpowiedzi na pytania {questions}. Po tej zmianie nie będą już traktowane jako dane wrażliwe: mogą pojawiać się w e-mailach, a „Usuń dane wrażliwe” przestanie je usuwać. Jeśli pytanie nie jest już potrzebne, ukryj je zamiast tego i zachowaj jego nazwę oraz kategorię prywatności. Zachowaj zmianę tylko wtedy, gdy pytanie nigdy nie zbierało danych wrażliwych.'
    undo: 'Cofnij zmianę'
    keep: 'Zachowaj zmianę'
  consent:
    title: 'Zgadzam się na wykorzystanie podanych w tym formularzu informacji ({category}) do opieki nad uczestnikiem podczas wydarzenia oraz na ich przekazanie zespołowi wydarzenia.'
    description: 'Dobrowolne – w przeciwnym razie pozostaw te pola puste. Zgodę można w każdej chwili wycofać u organizatora.'
    error: 'Wyraź zgodę lub pozostaw te pola puste.'
</i18n>

<i18n lang="yaml" locale="cs">
names:
  underscore: 'Názvy začínající podtržítkem jsou vyhrazeny pro platformu.'
  separator: 'Názvy nesmí obsahovat tečku.'
  variable: 'Tento název je vyhrazen pro údaje o akci.'
  blocked: 'Název „{name}“ nelze použít. {reason} Změň ho, než opustíš editor JSON.'
preview:
  group: 'Náhled pro skupinu: {group}'
mode:
  label: 'Režim editoru'
  simple: 'Jednoduchý'
  standard: 'Standardní'
  expert: 'Expert'
  condition: 'Obsahuje podmínky – upravte je ve standardním režimu'
privacy:
  required: 'Povinné: registrace pak závisí na souhlasu pro kategorii „{category}“, což vyžaduje platné odůvodnění. Pokud tyto údaje vyžaduje zákon, nastav pro ně v nastavení ochrany údajů jiný právní základ.'
  undeclared: 'Doplň kategorii „{category}“ do informací o ochraně údajů. Do té doby se nikdo nemůže registrovat.'
  uncovered: 'Přidej otázku na souhlas pro kategorii „{category}“. Do té doby se nikdo nemůže registrovat.'
  openNotice: 'Otevřít nastavení ochrany údajů'
  inColumn: 'Sloupec „{column}“: {message}'
  addConsent: 'Přidat otázku na souhlas'
  lost:
    title: 'Stávající odpovědi by již nebyly považovány za citlivé'
    message: 'Registrace již obsahují odpovědi na otázky {questions}. Po této změně se s nimi již nezachází jako s citlivými údaji: mohou se objevit v e-mailech a „Smazat citlivé údaje“ je již neodstraní. Pokud otázku již nepotřebuješ, raději ji skryj a ponech její název a kategorii ochrany údajů. Změnu ponech jen tehdy, pokud otázka nikdy nesbírala citlivé údaje.'
    undo: 'Vrátit změnu'
    keep: 'Ponechat změnu'
  consent:
    title: 'Souhlasím, aby údaje ({category}) z tohoto formuláře byly použity k péči o účastníka během akce a předány týmu akce.'
    description: 'Dobrovolné – jinak nech tato pole prázdná. Souhlas lze kdykoli odvolat u pořadatele.'
    error: 'Dej souhlas, nebo nech tato pole prázdná.'
</i18n>
