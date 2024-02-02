<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin q-pb-none">
      <q-form
        @submit="onOKClick"
        @reset="onCancelClick"
      >
        <q-card-section>
          <div class="text-h6">
            {{ t('title') }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none q-gutter-y-sm column">
          <!-- Time interval -->
          <q-input
            v-model.number="data.timeInterval"
            :label="t('field.timeInterval.label')"
            :hint="t('field.timeInterval.hint')"
            hide-bottom-space
            outlined
            rounded
          />

          <!-- Day start -->
          <time-input
            v-model="data.dayStart"
            :label="t('field.dayStart.label')"
            :hint="t('field.dayStart.hint')"
            hide-bottom-space
            outlined
            rounded
          />

          <!-- Day end -->
          <time-input
            v-model="data.dayEnd"
            :label="t('field.dayEnd.label')"
            :hint="t('field.dayEnd.hint')"
            hide-bottom-space
            outlined
            rounded
          />
        </q-card-section>

        <!-- action buttons -->
        <q-card-actions align="right">
          <q-btn
            type="reset"
            outline
            rounded
            color="primary"
            :label="t('actions.cancel')"
          />
          <q-btn
            type="submit"
            rounded
            color="primary"
            :label="t('actions.save')"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import TimeInput from 'components/common/inputs/TimeInput.vue';
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { reactive, toRaw } from 'vue';

interface CalendarSettings {
  dayStart: string;
  dayEnd: string;
  timeInterval: number;
}

interface Props {
  modelValue: object;
}

const props = defineProps<Props>();

defineEmits([...useDialogPluginComponent.emits]);

const data = reactive<Partial<CalendarSettings>>(initialValue());

function initialValue(): Partial<CalendarSettings> {
  return structuredClone(toRaw(props.modelValue));
}

const { t } = useI18n();

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
// dialogRef      - Vue ref to be applied to QDialog
// onDialogHide   - Function to be used as handler for @hide on QDialog
// onDialogOK     - Function to call to settle dialog with "ok" outcome
//                    example: onDialogOK() - no payload
//                    example: onDialogOK({ /*...*/ }) - with payload
// onDialogCancel - Function to call to settle dialog with "cancel" outcome

function onOKClick(): void {
  onDialogOK();
}

function onCancelClick() {
  onDialogCancel();
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
title: 'Calendar Settings'

fields:
  dayStart:
    label: 'Day start'
    hint: ''
  dayEnd:
    label: 'Day end'
    hint: ''
  timeInterval:
    label: 'Time interval'
    hint: 'How many minutes should one interval have'

actions:
  save: 'Save'
  cancel: 'Cancel'
</i18n>

<i18n lang="yaml" locale="de"></i18n>

<i18n lang="yaml" locale="fr"></i18n>

<style lang="scss">
input[type='number']::-webkit-outer-spin-button,
input[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
