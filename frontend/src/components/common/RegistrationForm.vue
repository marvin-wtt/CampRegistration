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

type FileStorage = Map<string, File>;

const { locale } = useI18n();

interface Props {
  data?: object;
  campDetails: CampDetails;
  submitFn: (id: string, data: unknown) => Promise<void>;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'bgColorUpdate', color: string | undefined): void;
}>();

const markdownConverter = new showdown.Converter({
  openLinksInNewWindow: true,
});
const filesStorage: FileStorage = new Map<string, File>();

const model = ref<SurveyModel>();
const bgColor = ref<string>();

const campData = toRef(props.campDetails);

watchEffect(() => {
  emit('bgColorUpdate', bgColor.value);
});

onMounted(async () => {
  const camp = props.campDetails;
  const form = camp.form;
  const id = camp.id;

  model.value = createModel(id, form);

  if (props.data) {
    model.value.data = props.data;
  }

  // Auto variables update on locale change
  startAutoDataUpdate(model, campData);
  startAutoThemeUpdate(model, campData, bgColor);
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

    const readFileAsync = async (file: File): Promise<FileOption> => {
      const uuid = crypto.randomUUID();
      const textContent = await readFile(file);
      return {
        file: { name: uuid, type: file.type, size: file.size },
        content: textContent,
      };
    };

    const fileOptions: FileOption[] = await Promise.all<FileOption>(
      options.files.map((file) => readFileAsync(file)),
    );

    options.callback('success', fileOptions);
  });
  // Remove file from storage
  survey.onClearFiles.add((_, options) => {
    // Undefined if no question was actually removed
    if (options.fileName === undefined) {
      options.callback('success');
      return;
    }

    // Clear single
    if (options.fileName) {
      filesStorage.delete(options.fileName);
      options.callback('success');
      return;
    }

    // Clear all
    if (Array.isArray(options.value)) {
      options.value.forEach((value) => {
        filesStorage.delete(value);
      });
    }

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
    const data = sender.data ?? {};
    const files = Object.fromEntries(filesStorage.entries());
    const registration = { data, files };

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
