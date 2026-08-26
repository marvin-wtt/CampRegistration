<template>
  <q-step
    :name
    :title
    :done="isDone"
    :header-nav="isDone"
    :error="hasError"
    :icon
  >
    <q-form
      @submit="nextStep"
      @reset="previousStep"
      @validation-success="hasError = false"
      @validation-error="hasError = true"
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
          v-if="name > 1"
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
import { type QStepProps } from 'quasar';

const { t } = useI18n();

const step = defineModel<number>({
  required: true,
});

type Props = QStepProps & {
  name: number;
  title?: string;
  last?: boolean;
};

const { name, title = '', last = false } = defineProps<Props>();
const emit = defineEmits<{
  (e: 'next-step'): void;
  (e: 'previous-step'): void;
}>();

const hasError = ref<boolean>();

const nextLabel = computed<string>(() => {
  return last ? t('action.finish') : t('action.continue');
});

const isDone = computed<boolean>(() => {
  return hasError.value === false;
});

function nextStep() {
  step.value++;

  emit('next-step');
}

function previousStep() {
  step.value--;
  emit('previous-step');
}
</script>

<i18n lang="yaml" locale="en">
action:
  back: 'Back'
  continue: 'Continue'
  finish: 'Finish'
</i18n>

<i18n lang="yaml" locale="de">
action:
  back: 'Zurück'
  continue: 'Weiter'
  finish: 'Fertigstellen'
</i18n>

<i18n lang="yaml" locale="fr">
action:
  back: 'Retour'
  continue: 'Continuer'
  finish: 'Terminer'
</i18n>

<i18n lang="yaml" locale="pl">
action:
  back: 'Wstecz'
  continue: 'Dalej'
  finish: 'Zakończ'
</i18n>

<i18n lang="yaml" locale="cs">
action:
  back: 'Zpět'
  continue: 'Pokračovat'
  finish: 'Dokončit'
</i18n>

<style scoped></style>
