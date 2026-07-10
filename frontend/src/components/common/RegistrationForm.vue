<template>
  <survey-component
    v-if="model"
    id="survey"
    :model="model"
    data-test="registration-form"
  />
</template>

<script lang="ts" setup>
import 'survey-core/survey-core.min.css';

import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { createMarkdownConverter } from '@/utils/markdown';
import { onMounted, ref, toRef, watchEffect } from 'vue';
import { SurveyModel } from 'survey-core';
import { SurveyComponent } from 'survey-vue3-ui';
import {
  startAutoDataUpdate,
  startAutoThemeUpdate,
  addFileSlotResolver,
} from '@/composables/survey';
import type { CampDetails } from '@camp-registration/common/entities';
import { useAPIService } from '@/services/APIService';
import { useErrorExtractor } from '@/composables/serviceHandler';

const mdConverter = createMarkdownConverter();

const { locale, t } = useI18n();
const router = useRouter();
const api = useAPIService();
const { extractErrorText } = useErrorExtractor();

interface Props {
  data?: object;
  campDetails: CampDetails;
  submitFn: (
    id: string,
    formData: Record<string, unknown>,
    locale: string,
  ) => Promise<void>;
  uploadFileFn: (file: File) => Promise<string>;
  moderation?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  moderation: false,
});

const emit = defineEmits<{
  (e: 'bgColorUpdate', color: string | undefined): void;
}>();

const model = createModel(
  props.campDetails.id,
  props.moderation
    ? createModerationForm(props.campDetails.form)
    : props.campDetails.form,
);
model.validationEnabled = !props.moderation;
if (props.data) {
  model.data = props.data;
  mapFileIdToFileContent(model);
}

const bgColor = ref<string>();

const campData = toRef(props.campDetails);

watchEffect(() => {
  emit('bgColorUpdate', bgColor.value);
});

onMounted(() => {
  // Auto variables update on locale change
  startAutoDataUpdate(model, campData);
  startAutoThemeUpdate(model, campData, bgColor);
});

function createModerationForm(form: object) {
  return {
    ...form,
    showTOC: true,
    fitToContainer: true,
  };
}

function createModel(campId: string, form: object): SurveyModel {
  const survey = new SurveyModel(form);
  survey.locale = locale.value;

  // survey.completedHtml always falls back to survey-core's built-in
  // "Thank you for completing the survey" text, so it can't be used to
  // detect whether the form itself defines one — check the raw JSON instead.
  if (!hasCustomCompletedHtml(form)) {
    survey.completedHtml = createDefaultCompletedHtml(campId);
  }

  let completedHtmlBeforeSubmit: string | undefined;
  let completedHtmlOnConditionBeforeSubmit:
    SurveyModel['completedHtmlOnCondition'] | undefined;
  let showCompletePageBeforeSubmit: boolean | undefined;

  if (props.moderation) {
    const hideComplete = () => {
      survey.navigationBar.getActionById('sv-nav-complete')?.setVisible(false);
    };
    hideComplete();
    survey.onCurrentPageChanged.add(hideComplete);
  }

  // Handle file uploads
  survey.onUploadFiles.add(async (_, options) => {
    try {
      interface FileOption {
        file: Pick<File, 'name' | 'type' | 'size'>;
        content?: unknown;
      }

      const fileUploads = options.files.map(async (file) => {
        const name = await props.uploadFileFn(file);

        return new File([file], name, {
          type: file.type,
          lastModified: file.lastModified,
        });
      });

      const files = await Promise.all(fileUploads);

      const readFileAsync = async (file: File): Promise<FileOption> => {
        const textContent = await readFile(file);
        return {
          file: { name: file.name, type: file.type, size: file.size },
          content: textContent,
        };
      };

      const fileOptions: FileOption[] = await Promise.all<FileOption>(
        files.map((file) => readFileAsync(file)),
      );

      options.callback('success', fileOptions);
    } catch {
      options.callback('error');
    }
  });
  // Remove file from storage
  survey.onClearFiles.add((_, options) => {
    // Files cannot be deleted as the user has no permissions to do so.
    // Files will be deleted eventually by a cleanup job
    options.callback('success');
  });
  // Convert markdown to html
  survey.onTextMarkdown.add((_, options) => {
    // Remove root paragraphs <p></p>
    options.html = mdConverter.renderInline(options.text);
  });
  // Workaround for date input for Safari < 4.1
  survey.onAfterRenderPage.add((_, options) => {
    const dateInputs: NodeListOf<HTMLInputElement> =
      options.htmlElement.querySelectorAll('input[type=date]');
    dateInputs.forEach((input) => {
      input.placeholder = 'yyyy-mm-dd';
    });
  });

  // Resolve {_file.<slot>} placeholders to locale-aware file URLs on demand.
  addFileSlotResolver(survey, campId, api);

  // Send data to server
  survey.onComplete.add(async (sender, options) => {
    completedHtmlBeforeSubmit ??= sender.completedHtml;
    completedHtmlOnConditionBeforeSubmit ??= sender.completedHtmlOnCondition;
    showCompletePageBeforeSubmit ??= sender.showCompletePage;

    sender.completedHtmlOnCondition = [];
    sender.completedHtml = createSubmitStateHtml(
      t('submit.saving.title'),
      t('submit.saving.text'),
    );
    sender.showCompletePage = true;

    options.showSaveInProgress();

    mapFileQuestionValues(sender);

    const registration = sender.data ?? {};

    try {
      await props.submitFn(campId, registration, sender.locale);
      sender.completedHtml = completedHtmlBeforeSubmit ?? '';
      sender.completedHtmlOnCondition =
        completedHtmlOnConditionBeforeSubmit ?? [];
      sender.showCompletePage = showCompletePageBeforeSubmit ?? true;
      sender.render();

      completedHtmlBeforeSubmit = undefined;
      completedHtmlOnConditionBeforeSubmit = undefined;
      showCompletePageBeforeSubmit = undefined;

      options.showSaveSuccess();
    } catch (e: unknown) {
      sender.completedHtml = createSubmitStateHtml(
        t('submit.error.title'),
        t('submit.error.text'),
      );
      sender.showCompletePage = true;
      sender.render();

      options.showSaveError(extractErrorText(e));
    }
  });

  return survey;
}

function hasCustomCompletedHtml(form: object): boolean {
  return Boolean((form as { completedHtml?: unknown }).completedHtml);
}

function createDefaultCompletedHtml(campId: string): string {
  const registerAgainHref = router.resolve({
    name: 'camp',
    params: { campId },
  }).href;
  const exploreCampsHref = router.resolve({ name: 'camps' }).href;

  return [
    `<h3>${escapeHtml(t('complete.title'))}</h3>`,
    `<p style="font-size: 18px">${escapeHtml(t('complete.text'))}</p>`,
    '<div class="registration-complete-actions">',
    '<a',
    ' class="registration-complete-actions__btn registration-complete-actions__btn--primary rounded-full elevation-1"',
    ` href="${escapeHtml(registerAgainHref)}"`,
    '>',
    '<i class="notranslate material-icons" aria-hidden="true">person_add</i>',
    escapeHtml(t('complete.registerAnother')),
    '</a>',
    '<a',
    ' class="registration-complete-actions__btn registration-complete-actions__btn--secondary rounded-full"',
    ` href="${escapeHtml(exploreCampsHref)}"`,
    '>',
    '<i class="notranslate material-icons" aria-hidden="true">explore</i>',
    escapeHtml(t('complete.exploreCamps')),
    '</a>',
    '</div>',
  ].join('');
}

function createSubmitStateHtml(title: string, text: string): string {
  return [
    `<h3>${escapeHtml(title)}</h3>`,
    `<p style="font-size: 18px">${escapeHtml(text)}</p>`,
  ].join('');
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function readFile(file: File) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = () => {
      resolve(fileReader.result);
    };
    fileReader.onerror = reject;
    fileReader.readAsDataURL(file);
  });
}

function mapFileIdToFileContent(survey: SurveyModel) {
  const questions = survey.getAllQuestions(false, undefined, true);
  questions.forEach((question) => {
    if (question.getType() !== 'file') {
      return;
    }

    const mapToContent = (file: unknown) => {
      if (typeof file !== 'string') {
        return file;
      }

      const url = file.match(/^https?:\/\//)
        ? file
        : `${window.origin}/api/v1/files/${file}`;

      return {
        name: file,
        type: '',
        content: url,
      };
    };

    if (Array.isArray(question.value)) {
      question.value = question.value.map(mapToContent);
    } else {
      question.value = mapToContent(question.value);
    }
  });
}

function mapFileQuestionValues(survey: SurveyModel) {
  const questions = survey.getAllQuestions(false, undefined, true);
  questions.forEach((question) => {
    if (question.getType() !== 'file') {
      return;
    }

    if (Array.isArray(question.value)) {
      question.value = question.value.map((value) => {
        return isFile(value) ? value.name : value;
      });
    } else {
      question.value = isFile(question.value)
        ? question.value.name
        : question.value;
    }
  });
}

function isFile(file: unknown): file is Pick<File, 'name'> {
  return file != null && typeof file === 'object' && 'name' in file;
}

defineExpose({
  submit: () => model.doComplete(),
});
</script>

<i18n lang="yaml" locale="en">
submit:
  saving:
    title: 'Submitting registration'
    text: 'Please wait while your registration is being saved.'
  error:
    title: 'Registration failed'
    text: 'Your registration could not be saved. Please try again.'
complete:
  title: 'Registration complete!'
  text: "Thanks for signing up — we've received your registration and can't wait to see you at camp."
  registerAnother: 'Register another person'
  exploreCamps: 'Explore other camps'
</i18n>

<i18n lang="yaml" locale="de">
submit:
  saving:
    title: 'Anmeldung wird gesendet'
    text: 'Bitte warte, während deine Anmeldung gespeichert wird.'
  error:
    title: 'Anmeldung fehlgeschlagen'
    text: 'Deine Anmeldung konnte nicht gespeichert werden. Bitte versuche es erneut.'
complete:
  title: 'Anmeldung abgeschlossen!'
  text: 'Danke für deine Anmeldung — wir haben sie erhalten und freuen uns schon darauf, dich im Camp zu begrüßen.'
  registerAnother: 'Weitere Person anmelden'
  exploreCamps: 'Weitere Camps entdecken'
</i18n>

<i18n lang="yaml" locale="fr">
submit:
  saving:
    title: "Envoi de l'inscription"
    text: "Veuillez patienter pendant l'enregistrement de votre inscription."
  error:
    title: "Échec de l'inscription"
    text: "Votre inscription n'a pas pu être enregistrée. Veuillez réessayer."
complete:
  title: 'Inscription terminée !'
  text: "Merci pour ton inscription — nous l'avons bien reçue et avons hâte de te voir au camp."
  registerAnother: 'Inscrire une autre personne'
  exploreCamps: "Découvrir d'autres camps"
</i18n>

<i18n lang="yaml" locale="pl">
submit:
  saving:
    title: 'Wysyłanie rejestracji'
    text: 'Poczekaj, trwa zapisywanie rejestracji.'
  error:
    title: 'Rejestracja nie powiodła się'
    text: 'Nie udało się zapisać rejestracji. Spróbuj ponownie.'
complete:
  title: 'Rejestracja zakończona!'
  text: 'Dziękujemy za rejestrację — otrzymaliśmy Twoje zgłoszenie i nie możemy się doczekać spotkania na obozie.'
  registerAnother: 'Zarejestruj kolejną osobę'
  exploreCamps: 'Odkryj inne obozy'
</i18n>

<i18n lang="yaml" locale="cs">
submit:
  saving:
    title: 'Odesílání registrace'
    text: 'Počkej prosím, než bude registrace uložena.'
  error:
    title: 'Registrace se nezdařila'
    text: 'Registraci se nepodařilo uložit. Zkus to prosím znovu.'
complete:
  title: 'Registrace dokončena!'
  text: 'Děkujeme za registraci — tvou přihlášku jsme přijali a těšíme se na tebe na táboře.'
  registerAnother: 'Registrovat další osobu'
  exploreCamps: 'Prozkoumat další tábory'
</i18n>

<style lang="scss">
#survey {
  a {
    color: inherit;
    font-weight: bold;
    font-style: oblique;
  }

  .sv-save-data_root {
    bottom: calc(3rem + env(safe-area-inset-bottom, 0px));
    z-index: 2100;
  }

  .sd-completedpage {
    // survey-core already applies generous top/bottom padding by default
    // (and that's what visually centers the complete page); only the
    // horizontal padding was missing.
    padding-left: 24px;
    padding-right: 24px;
  }

  .registration-complete-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
    margin-top: 24px;
  }

  .registration-complete-actions__btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;

    padding: 10px 24px;

    font-size: 14px;
    font-weight: 500;
    font-style: normal;
    text-decoration: none;
    white-space: nowrap;

    transition:
      box-shadow 0.2s ease,
      background-color 0.2s ease,
      color 0.2s ease;

    .material-icons {
      font-size: 18px;
    }

    &--primary {
      background-color: var(--md3-primary);
      color: var(--md3-on-primary);

      &:hover {
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
      }
    }

    &--secondary {
      background-color: transparent;
      color: var(--md3-primary);
      border: 1px solid var(--md3-outline);

      &:hover {
        background-color: var(--md3-primary-container);
        color: var(--md3-on-primary-container);
      }
    }
  }
}
</style>
