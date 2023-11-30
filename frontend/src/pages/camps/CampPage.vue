<template>
  <page-state-handler
    :loading="loading"
    :error="error"
    class="row justify-center"
    :style="{ backgroundColor: bgColor }"
  >
    <survey
      id="survey"
      class="col-xs-12 col-sm-12 col-md-8 col-lg-6 col-xl-6"
      :model="model"
    />
  </page-state-handler>
</template>

<script lang="ts" setup>
import { SurveyModel } from 'survey-core';
import 'survey-core/defaultV2.min.css';

import PageStateHandler from 'components/common/PageStateHandler.vue';
import { useCampDetailsStore } from 'stores/camp-details-store';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import showdown from 'showdown';
import {
  startAutoDataUpdate,
  startAutoThemeUpdate,
} from 'src/composables/survey';
import { useMeta, useQuasar } from 'quasar';
import { useRegistrationsStore } from 'stores/registration-store';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import { storeToRefs } from 'pinia';

type FileStorage = Map<string, File>;

const { to } = useObjectTranslation();
const { locale } = useI18n();
const quasar = useQuasar();
const registrationStore = useRegistrationsStore();
const campDetailsStore = useCampDetailsStore();
const { data: campData } = storeToRefs(campDetailsStore);

const markdownConverter = new showdown.Converter();
const filesStorage: FileStorage = new Map<string, File>();

useMeta(() => {
  return {
    title: to(campDetailsStore.data?.name),
  };
});

const loading = computed<boolean>(() => {
  return (
    campDetailsStore.isLoading || (!campDetailsStore.error && !model.value)
  );
});

const error = computed(() => {
  return campDetailsStore.error;
});

const model = ref<SurveyModel>();
const bgColor = ref<string>();

// Auto variables update on locale change
startAutoDataUpdate(model, campData);
startAutoThemeUpdate(model, campData, bgColor);

onMounted(async () => {
  await campDetailsStore.fetchData();

  if (campDetailsStore.error || !campDetailsStore.data) {
    return;
  }

  const camp = campDetailsStore.data;

  const form = camp.form;
  const id = camp.id;
  model.value = createModel(id, form);
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
    const data = sender.data;
    const files = Object.fromEntries(filesStorage.entries());
    const registration = { data, files };

    try {
      await registrationStore.storeData(campId, registration);
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
