<template>
  <q-step
    v-if="visible"
    :name="props.name"
    :title="to(props.page.title)"
    :caption="to(props.page.description)"
    :done="done"
    :header-nav="props.headerNav"
  >
    <div v-if="!props.vertical">
      <div class="text-h6">
        {{ to(props.page.title) }}
      </div>
      <div class="text-caption">
        {{ to(props.page.description) }}
      </div>
    </div>

    <q-form
      @submit="emit('next')"
      @reset="emit('prev')"
    >
      <!-- TODO Attribute list: -->
      <!--  startWithNewLine -->

      <dynamic-input
        v-for="element in props.page.elements"
        :key="element.name"
        v-model="modelValue[element.name]"
        :element="element"
        :data="modelValue"
        :visible="visible"
        :required="required"
        :readonly="readOnly"
      />

      <q-stepper-navigation>
        <q-btn
          type="submit"
          color="primary"
          :label="t('actions.continue')"
        />
        <q-btn
          v-if="!first"
          type="reset"
          flat
          color="primary"
          :label="t('actions.back')"
          class="q-ml-sm"
        />
      </q-stepper-navigation>
    </q-form>
  </q-step>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Page } from 'src/types/SurveyJSCampData';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import { ExpressionEvaluator } from 'components/ExpressionEvaluator';
import DynamicInput from 'components/inputs/DynamicInput.vue';
import { QForm } from 'quasar';

const { t } = useI18n();
const { to } = useObjectTranslation();

interface Props {
  modelValue: object;
  page: Page;
  name: string | number;
  vertical?: boolean;
  headerNav?: boolean;
  first?: boolean;
  last?: boolean;
  done?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: unknown): void;
  (e: 'prev'): void;
  (e: 'next'): void;
}>();

const modelValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

function evaluateExpression(
  expression: string | undefined
): boolean | undefined {
  if (expression == null) {
    return undefined;
  }

  const evaluator = new ExpressionEvaluator(expression);

  try {
    return evaluator.evaluate(props.modelValue) === true;
  } catch (ignored: unknown) {}

  return undefined;
}

const required = computed<boolean>(() => {
  return (
    evaluateExpression(props.page.requiredIf) ?? props.page.required ?? false
  );
});

const readOnly = computed<boolean>(() => {
  return (
    evaluateExpression(props.page.readOnlyIf) ?? props.page.readOnly ?? false
  );
});

const visible = computed<boolean>(() => {
  return evaluateExpression(props.page.visibleIf) ?? props.page.visible ?? true;
});
</script>

<style scoped></style>

<!-- TODO Add i18n translations -->
