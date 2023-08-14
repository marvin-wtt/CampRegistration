<template>
  <page-state-handler
    :loading="loading"
    :error="error"
    class="row justify-center"
  >
    <survey
      v-if="model"
      class="col-xs-12 col-sm-12 col-md-8 col-lg-6 col-xl-6"
      :model="model"
    />
  </page-state-handler>
</template>

<script lang="ts" setup>
import { SurveyModel } from 'survey-core';
import PageStateHandler from 'components/common/PageStateHandler.vue';
import { useCampDetailsStore } from 'stores/camp-details-store';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import showdown from 'showdown';

const { locale } = useI18n();

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

onMounted(async () => {
  await campDetailsStore.fetchData();

  if (campDetailsStore.error || !campDetailsStore.data) {
    return;
  }

  const form = campDetailsStore.data.form;
  const id = campDetailsStore.data.id;
  model.value = createModel(id, form);
});

function createModel(id: string, form: object): SurveyModel {
  const survey = new SurveyModel(form);
  survey.surveyPostId = id;
  survey.locale = locale.value;
  survey.surveyShowDataSaving = true;
  // TODO Apply theme
  survey.applyTheme({});

  // Handle file uploads
  survey.onUploadFiles.add(async (survey, options) => {
    // Add files to the temporary storage
    if (options.name in temporaryFilesStorage) {
      temporaryFilesStorage[options.name].concat(options.files);
    } else {
      temporaryFilesStorage[options.name] = options.files;
    }

    // Load previews in base64. Until the survey is completed, files are loaded temporarily as base64 for previews.
    const contentPromises = options.files.map((file) => {
      return new Promise((resolve) => {
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
  survey.onClearFiles.add((sender, options) => {
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
    const dateInputs = options.htmlElement.querySelectorAll('input[type=date]');
    dateInputs.forEach((input: HTMLInputElement) => {
      input.placeholder = 'yyyy-mm-dd';
    });
  });
  // Send data to server
  survey.onComplete.add((sender, options) => {



    // TODO Send data to server
  });

  return survey;
}
</script>
