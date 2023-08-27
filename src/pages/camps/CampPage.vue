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
import { PlainLight } from 'survey-core/themes/plain-light';
import { PlainDark } from 'survey-core/themes/plain-dark';

import PageStateHandler from 'components/common/PageStateHandler.vue';
import { useCampDetailsStore } from 'stores/camp-details-store';
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import showdown from 'showdown';
import { useSurveyTools } from 'src/composables/survey';
import { useQuasar } from 'quasar';
import { useRegistrationsStore } from 'stores/registration-store';

const { locale } = useI18n();
const { setCampVariables } = useSurveyTools();
const quasar = useQuasar();
const registrationStore = useRegistrationsStore();

const markdownConverter = new showdown.Converter();
const campDetailsStore = useCampDetailsStore();
const temporaryFilesStorage: Record<string, File[]> = {};

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

watch(
  () => quasar.dark.isActive,
  (val) => {
    applyTheme(val);
  }
);

onMounted(async () => {
  await campDetailsStore.fetchData();

  if (campDetailsStore.error || !campDetailsStore.data) {
    return;
  }

  const form = campDetailsStore.data.form;
  const id = campDetailsStore.data.id;
  model.value = createModel(id, form);
  applyTheme();
  setCampVariables(model.value, campDetailsStore.data);
});

function applyTheme(dark?: boolean) {
  dark ??= quasar.dark.isActive;
  const theme = dark ? PlainDark : PlainLight;

  model.value?.applyTheme(theme);

  nextTick(() => {
    const element = document.getElementById('survey');
    if (element) {
      bgColor.value = window.getComputedStyle(element).backgroundColor;
    }
  });
}

function createModel(id: string, form: object): SurveyModel {
  const survey = new SurveyModel(form);
  survey.surveyId = id;
  survey.locale = locale.value;

  // Handle file uploads
  survey.onUploadFiles.add(async (_, options) => {
    // Add files to the temporary storage
    if (options.name in temporaryFilesStorage) {
      temporaryFilesStorage[options.name].push(...options.files);
    } else {
      temporaryFilesStorage[options.name] = options.files;
    }

    interface FileOption {
      name: string;
      type: string;
      content: string | ArrayBuffer | null;
      file: File;
    }

    // Load previews in base64. Until the survey is completed, files are loaded temporarily as base64 for previews.
    const contentPromises = options.files.map((file) => {
      return new Promise<FileOption>((resolve) => {
        const fileReader = new FileReader();
        fileReader.onload = () => {
          resolve({
            name: file.name,
            type: file.type,
            content: fileReader.result,
            file: file,
          });
        };
        fileReader.readAsDataURL(file);
      });
    });

    const contents = await Promise.all(contentPromises);
    options.callback(
      'success',
      contents.map((fileContent) => {
        return { file: fileContent.file, content: fileContent.content };
      })
    );
  });
  // Remove file from storage
  survey.onClearFiles.add((_, options) => {
    const tempFiles = temporaryFilesStorage[options.name] || [];
    const fileInfoToRemove = tempFiles.find(
      (file) => file.name === options.fileName
    );

    if (fileInfoToRemove !== undefined) {
      const index = tempFiles.indexOf(fileInfoToRemove);
      tempFiles.splice(index, 1);
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

    const campId = sender.surveyId;
    let data = sender.data;
    const registration = { ...data, ...temporaryFilesStorage };

    try {
      await registrationStore.storeData(campId, registration);
      options.showDataSavingSuccess();
    } catch (e: unknown) {
      options.showSaveError('Error');
    }
  });

  return survey;
}
</script>
