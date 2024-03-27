<template>
  <q-step
    :name="props.name"
    :title="props.title"
    :done="step > props.name"
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
import { computed, ref } from 'vue';

const { t } = useI18n();

const step = defineModel<number>({
  required: true,
});
const props = withDefaults(
  defineProps<{
    name: number;
    title?: string;
    last: boolean;
  }>(),
  {
    title: undefined,
    last: false,
  },
);

const error = ref<boolean>(false);

const nextLabel = computed<string>(() => {
  return props.last ? t('action.finish') : t('action.continue');
});

function nextStep() {
  step.value++;
}

function previousStep() {
  step.value--;
}
</script>

<!-- TODO Add i18n -->
<i18n lang="yaml" locale="en">
action:
  back: 'Back'
  continue: 'Continue'
  finish: 'Finish'
</i18n>

<style scoped></style>
