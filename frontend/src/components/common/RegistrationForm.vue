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
import { computed, onMounted, ref, toRef, watchEffect } from 'vue';
import { SurveyModel } from 'survey-core';
import {
  startAutoDataUpdate,
  startAutoThemeUpdate,
} from 'src/composables/survey';
import type {
  CampDetails,
  ServiceFile,
} from '@camp-registration/common/entities';

const { locale } = useI18n();

interface Props {
  data?: object;
  campDetails: CampDetails;
  files?: ServiceFile[];
  submitFn: (id: string, formData: Record<string, unknown>) => Promise<void>;
  uploadFileFn: (file: File) => Promise<string>;
  moderation?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  moderation: false,
});

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

const files = computed<ServiceFile[] | undefined>(() => {
  return props.files;
});

// Auto variables update on locale change
startAutoDataUpdate(model, campData, files);
startAutoThemeUpdate(model, campData, bgColor);

onMounted(async () => {
  const camp = props.campDetails;
  const form = camp.form;
  const id = camp.id;

  const modelForm = props.moderation ? createModerationForm(form) : form;
  model.value = createModel(id, modelForm);

  // TODO Remove with next surveyJs release
  if (props.moderation) {
    // https://github.com/surveyjs/survey-library/issues/8708
    model.value.ignoreValidation = true;
    model.value.validationEnabled = false;
  }

  if (props.data) {
    model.value.data = props.data;
  }
});

function createModerationForm(form: object) {
  return {
    ...form,
    showTOC: true,
    fitToContainer: true,
    // Disable validation to allow manual adjustments that otherwise violate the validation rules
    validationEnabled: false,
    completeText: {
      default: 'Save',
      de: 'Speichern',
      fr: 'Sauver',
    },
  };
}

function createModel(campId: string, form: object): SurveyModel {
  const survey = new SurveyModel(form);
  survey.surveyId = campId;
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

<style lang="scss">
#survey {
  a {
    color: inherit;
    font-weight: bold;
    font-style: oblique;
  }
}
</style>
