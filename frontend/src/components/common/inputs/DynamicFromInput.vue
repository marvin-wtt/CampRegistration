<template>
  <template v-if="visible">
    <template v-if="element.type === 'text'">
      <template v-if="!isValidInputModel(modelValue)">
        Invalid present data
      </template>
      <!-- Todo take input type into account -->
      <q-input
        v-else
        v-model="modelValue"
        :hint="to(element.description)"
        :label="label"
        :disable="readOnly"
        :min="element.min"
        :max="element.max"
        :rules="[
          (val) => checkRequired(val),
          (val) => checkMinValue(val),
          (val) => checkMaxValue(val),
        ]"
        hide-bottom-space
      />
    </template>

    <!--
    <q-input
      v-else-if="element.type === 'comment'"
      v-model="modelValue"
      :hint="to(element.description)"
      ::label="label"
      :disable="readOnly"
      :rules="[(val) => checkRequired(val)]"
      type="textarea"
    />
    -->

    <template v-else-if="element.type === 'checkbox'">
      <!-- Confirm checkbox -->
      <div
        v-if="element.choices.length === 1"
        class="column"
      >
        <a class="col">
          {{ label }}
        </a>
        <a class="text-caption text-grey-6 col">
          {{ caption }}
        </a>
        <q-field
          v-model="modelValue"
          :rules="[(val) => checkRequired(val)]"
          borderless
          dense
        >
          <template #control>
            <q-checkbox
              v-model="modelValue"
              :true-value="choices[0].value"
              :false-value="element.choices[0] ? false : null"
              :label="to(choices[0].label)"
              :disable="readOnly"
            />
          </template>
        </q-field>
      </div>
      <!-- Multi-option checkbox -->
      <q-option-group
        v-else
        v-model="modelValue"
        type="checkbox"
        :disable="readOnly"
        :options="choices"
        :rules="[(val: unknown) => checkRequired(val)]"
      />
    </template>

    <!-- TODO hint -->
    <q-field
      v-else-if="element.type === 'boolean'"
      v-model="modelValue"
      :hint="to(element.description)"
      :rules="[(val) => checkRequired(val, true)]"
      borderless
      dense
    >
      <template #control>
        <q-toggle
          v-model="modelValue"
          :label="label"
          :disable="readOnly"
        />
      </template>
    </q-field>

    <div v-else-if="element.type === 'radiogroup'">
      <a class="col">
        {{ label }}
      </a>
      <a class="text-caption text-grey-6 col">
        {{ caption }}
      </a>

      <q-option-group
        v-model="modelValue"
        :disable="readOnly"
        :options="choices"
        :rules="[(val: unknown) => checkRequired(val)]"
      />
    </div>

    <q-select
      v-else-if="element.type === 'dropdown'"
      v-model="modelValue"
      :label="label"
      :hint="to(element.description)"
      :disable="readOnly"
      :option-label="(option) => to(option.text)"
      :options="(element as SelectionElement).choices"
      emit-value
      map-options
      :rules="[(val) => checkRequired(val)]"
    />

    <!-- TODO Ajust size -->
    <div v-else-if="element.type === 'expression'">
      <b>
        {{ label }}
      </b>
      <p class="text-caption">
        {{ caption }}
      </p>
    </div>

    <!-- TODO add uploader -->

    <p
      v-else
      class="text-negative"
    >
      Unknown element: {{ element.type }}
    </p>
  </template>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type {
  AnyElement,
  SelectionElement,
} from '@camp-registration/common/entities';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import { ExpressionEvaluator } from 'components/ExpressionEvaluator';

const { t } = useI18n();
const { to } = useObjectTranslation();

interface Props {
  modelValue: unknown;
  data: object;
  element: AnyElement;
  readonly?: boolean;
  required?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  required: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: unknown): void;
}>();

const modelValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

function evaluateExpression(
  expression: string | undefined,
): boolean | undefined {
  if (expression == null) {
    return undefined;
  }

  const evaluator = new ExpressionEvaluator(expression);

  try {
    return evaluator.evaluate(props.data) === true;
  } catch (ignored: unknown) {}

  return undefined;
}

const required = computed<boolean>(() => {
  return (
    evaluateExpression(props.element.requiredIf) ??
    props.element.required ??
    props.required
  );
});

const readOnly = computed<boolean>(() => {
  return (
    evaluateExpression(props.element.readOnlyIf) ??
    props.element.readOnly ??
    props.readonly
  );
});

const visible = computed<boolean>(() => {
  return (
    evaluateExpression(props.element.visibleIf) ?? props.element.visible ?? true
  );
});

const label = computed<string>(() => {
  //const text = converter.makeHtml(to(props.element.title));
  const suffix = required.value ? ' *' : '';
  return to(props.element.title) + suffix;
});

const caption = computed<string>(() => {
  return props.element.description ? to(props.element.description) : '';
});

interface Choice {
  label: string;
  value: unknown;
  disable?: boolean;
}

const choices = computed<Choice[]>(() => {
  if (
    props.element.type !== 'radiogroup' &&
    props.element.type !== 'checkbox'
  ) {
    return [];
  }

  return props.element.choices.map((value) => {
    return {
      label: to(value.text),
      value: value.value,
      disable: undefined,
    };
  });
});

function checkRequired(value: unknown, soft?: boolean): true | string {
  if (!required.value) {
    return true;
  }

  if (!!value || (soft && value != null)) {
    return true;
  }

  return props.element.requiredErrorText
    ? to(props.element.requiredErrorText)
    : t('validation.required');
}

function checkMinValue(value?: string | number): true | string {
  if (props.element.type !== 'text' || !props.element.min || !value) {
    return true;
  }

  const errorMessage = props.element.minErrorText
    ? to(props.element.minErrorText)
    : t('validation.min');

  if (props.element.inputType === 'number') {
    return value >= props.element.min ? true : errorMessage;
  }

  if (props.element.inputType === 'date') {
    return new Date(value).getTime() >= new Date(props.element.min).getTime()
      ? true
      : errorMessage;
  }

  return true;
}

function checkMaxValue(value?: string | number): true | string {
  if (props.element.type !== 'text' || !props.element.max || !value) {
    return true;
  }

  const errorMessage = props.element.maxErrorText
    ? to(props.element.maxErrorText)
    : t('validation.max');

  if (props.element.inputType === 'number') {
    return value <= props.element.max ? true : errorMessage;
  }

  if (props.element.inputType === 'date') {
    return new Date(value).getTime() <= new Date(props.element.max).getTime()
      ? true
      : errorMessage;
  }

  return true;
}

function isValidInputModel(
  model: unknown,
): model is null | string | number | undefined {
  return (
    model == null || typeof model === 'string' || typeof model === 'number'
  );
}
</script>

<style scoped></style>
