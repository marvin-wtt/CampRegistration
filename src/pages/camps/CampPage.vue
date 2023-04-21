<template>
  <q-page
    class="fit row justify-center"
    padding
  >
    <q-stepper
      ref="stepper"
      v-model="step"
      class="col-12 col-xl-4 col-lg-6 col-md-8 col-sm-10"
      color="primary"
      animated
      :vertical="vertical"
      :contracted="!vertical"
      header-nav
      flat
    >
      <c-step
        v-for="(page, index) in pages"
        :key="page.name"
        v-model="data"
        :page="page"
        :name="index"
        :vertical="vertical"
        :first="index === 0"
        :last="index === camp.pages.length"
        :done="index < step"
        :header-nav="index <= step"
        @next="step = index + 1"
        @prev="step = index - 1"
      />

      <template
        v-if="!vertical"
        #navigation
      >
        <q-stepper-navigation v-if="!vertical">
          <q-btn
            color="primary"
            :label="step === 4 ? 'Finish' : 'Continue'"
            @click="$refs.stepper.next()"
          />
          <q-btn
            v-if="step > 0"
            flat
            color="primary"
            label="Back"
            class="q-ml-sm"
            @click="$refs.stepper.previous()"
          />
        </q-stepper-navigation>
      </template>
    </q-stepper>
  </q-page>
</template>

<script lang="ts" setup>
import example from 'src/lib/examples/camp.json';
import { computed, reactive, ref } from 'vue';
import { Page, SurveyJSCampData } from 'src/types/SurveyJSCampData';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import CStep from 'components/camps/CStep.vue';
import { ExpressionEvaluator } from 'components/ExpressionEvaluator';

const { to } = useObjectTranslation();

const vertical = true;
const step = ref<number>(0);
const camp = ref<SurveyJSCampData>(example);

const pages = computed<Page[]>(() => {
  return camp.value.pages.filter((value) => {
    if (value.visibleIf === undefined) {
      return value.visible ?? true;
    }

    try {
      return new ExpressionEvaluator(value.visibleIf).evaluate(data);
    } catch (ignored) {}

    return true;
  });
});

const data = reactive([]);
</script>
