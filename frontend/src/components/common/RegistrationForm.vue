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
</i18n>

<i18n lang="yaml" locale="de">
submit:
  saving:
    title: 'Anmeldung wird gesendet'
    text: 'Bitte warte, während deine Anmeldung gespeichert wird.'
  error:
    title: 'Anmeldung fehlgeschlagen'
    text: 'Deine Anmeldung konnte nicht gespeichert werden. Bitte versuche es erneut.'
</i18n>

<i18n lang="yaml" locale="fr">
submit:
  saving:
    title: "Envoi de l'inscription"
    text: "Veuillez patienter pendant l'enregistrement de votre inscription."
  error:
    title: "Échec de l'inscription"
    text: "Votre inscription n'a pas pu être enregistrée. Veuillez réessayer."
</i18n>

<i18n lang="yaml" locale="pl">
submit:
  saving:
    title: 'Wysyłanie rejestracji'
    text: 'Poczekaj, trwa zapisywanie rejestracji.'
  error:
    title: 'Rejestracja nie powiodła się'
    text: 'Nie udało się zapisać rejestracji. Spróbuj ponownie.'
</i18n>

<i18n lang="yaml" locale="cs">
submit:
  saving:
    title: 'Odesílání registrace'
    text: 'Počkej prosím, než bude registrace uložena.'
  error:
    title: 'Registrace se nezdařila'
    text: 'Registraci se nepodařilo uložit. Zkus to prosím znovu.'
</i18n>

<style lang="scss">
#survey {
  a {
    color: inherit;
    font-weight: bold;
    font-style: oblique;
  }
}
</style>
