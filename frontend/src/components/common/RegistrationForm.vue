<template>
  <survey
    v-if="model"
    id="survey"
    :model="model"
  />
</template>

<script lang="ts" setup>
import 'survey-core/defaultV2.min.css';

import { useI18n } from 'vue-i18n';
import showdown from 'showdown';
import { onMounted, ref, toRef, watchEffect } from 'vue';
import { SurveyModel } from 'survey-core';
import {
  startAutoDataUpdate,
  startAutoThemeUpdate,
} from 'src/composables/survey';
import type { CampDetails } from '@camp-registration/common/entities';

const { locale } = useI18n();

interface Props {
  data?: object;
  campDetails: CampDetails;
  submitFn: (id: string, formData: unknown) => Promise<void>;
  uploadFileFn: (file: File) => Promise<string>;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'bgColorUpdate', color: string | undefined): void;
}>();

const markdownConverter = new showdown.Converter({
  openLinksInNewWindow: true,
});

const model = ref<SurveyModel>();
const bgColor = ref<string>();

const campData = toRef(props.campDetails);

watchEffect(() => {
  emit('bgColorUpdate', bgColor.value);
});

// Auto variables update on locale change
startAutoDataUpdate(model, campData);
startAutoThemeUpdate(model, campData, bgColor);

onMounted(async () => {
  const camp = props.campDetails;
  const form = camp.form;
  const id = camp.id;

  model.value = createModel(id, form);

  if (props.data) {
    model.value.data = props.data;
  }
});

function createModel(id: string, form: object): SurveyModel {
  const survey = new SurveyModel(form);
  survey.surveyId = id;
  survey.locale = locale.value;

  // Handle file uploads
  survey.onUploadFiles.add(async (_, options) => {
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
  });
  // Remove file from storage
  survey.onClearFiles.add((_, options) => {
    // Files cannot be deleted as the user has no permissions to do so.
    // Files will be deleted eventually by a cleanup job
    options.callback('success');
  });
  // Convert markdown to html
  survey.onTextMarkdown.add((survey, options) => {
    const str = markdownConverter.makeHtml(options.text);
    // Remove root paragraphs <p></p>
    options.html = str.substring(3, str.length - 4);
  });
  // Workaround for date input for Safari < 4.1
  survey.onAfterRenderPage.add((survey, options) => {
    const dateInputs: NodeListOf<HTMLInputElement> =
      options.htmlElement.querySelectorAll('input[type=date]');
    dateInputs.forEach((input) => {
      input.placeholder = 'yyyy-mm-dd';
    });
  });
  // Send data to server
  survey.onComplete.add(async (sender, options) => {
    options.showSaveInProgress();

    mapFileQuestionValues(sender);

    const campId = sender.surveyId;
    const registration = sender.data ?? {};

    try {
      await props.submitFn(campId, registration);
      options.showDataSavingSuccess();
    } catch (e: unknown) {
      options.showSaveError('Error');
    }
  });

  return survey;
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
</script>

<style scoped></style>
