<template>
  <q-step
    :name="props.name"
    :title="props.title"
    :done="done"
    :header-nav="done"
    :disable="props.disable"
    :error
    v-bind="$attrs"
  >
    <q-form
      @submit="nextStep"
      @reset="previousStep"
      @validation-success="error = false"
      @validation-error="error = true"
    >
      <div class="q-gutter-y-md">
        <slot />
      </div>

      <q-stepper-navigation>
        <q-btn
          :label="nextLabel"
          color="primary"
          rounded
          type="submit"
        />
        <q-btn
          v-if="props.name > 1"
          :label="t('action.back')"
          flat
          color="primary"
          class="q-ml-sm"
          rounded
          type="reset"
        />
      </q-stepper-navigation>
    </q-form>
  </q-step>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { computed, ref, watch } from 'vue';

const { t } = useI18n();

const step = defineModel<number>({
  required: true,
});
const props = withDefaults(
  defineProps<{
    name: number;
    title?: string;
    last?: boolean;
    disable?: boolean;
  }>(),
  {
    title: '',
    last: false,
  },
);
const emit = defineEmits<{
  (e: 'next-step'): void;
  (e: 'previous-step'): void;
}>();

const error = ref<boolean>();

const nextLabel = computed<string>(() => {
  return props.last ? t('action.finish') : t('action.continue');
});

const done = computed<boolean>(() => {
  return error.value === false;
});

function nextStep() {
  step.value++;

  emit('next-step');
}

function previousStep() {
  step.value--;
  emit('previous-step');
}

watch(
  () => step.value,
  (value, oldValue) => {
    if (!props.disable || value !== props.name) {
      return;
    }

    if (value > oldValue) {
      nextStep();
    } else {
      previousStep();
    }
  },
);
</script>

<!-- TODO Add i18n -->
<i18n lang="yaml" locale="en">
action:
  back: 'Back'
  continue: 'Continue'
  finish: 'Finish'
</i18n>

<style scoped></style>
