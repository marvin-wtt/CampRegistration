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
          <div class="text-h6 text-center">
            {{ t(`title`) }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none q-gutter-y-sm column">
          <translated-input
            v-model="data.name"
            :label="t('fields.name.label')"
            :rules="[
              (val: string | Record<string, string> | undefined) =>
                !!val || t('fields.name.rules.required'),
            ]"
            hide-bottom-space
            outlined
            rounded
            :locales="props.locales"
          >
            <template #prepend>
              <q-icon name="title" />
            </template>
          </translated-input>

          <translated-input
            v-model="data.description"
            :label="t('fields.description.label')"
            outlined
            rounded
            clearable
            :locales="props.locales"
          >
            <template #prepend>
              <q-icon name="description" />
            </template>
          </translated-input>

          <q-input
            v-model.number="data.amount"
            type="number"
            :label="t('fields.amount.label')"
            :rules="[
              (val: number | undefined) =>
                !!val || t('fields.amount.rules.required'),
            ]"
            hide-bottom-space
            input-class="text-right"
            outlined
            rounded
            suffix="€"
          >
            <template #prepend>
              <q-icon name="euro" />
            </template>
          </q-input>

          <!-- Date -->
          <q-input
            v-model="data.date"
            :label="t('field.date.label')"
            outlined
            rounded
          >
            <template #prepend>
              <q-icon name="calendar_month" />
            </template>
            <template #append>
              <q-icon
                name="event"
                class="cursor-pointer"
              >
                <q-popup-proxy
                  cover
                  transition-show="scale"
                  transition-hide="scale"
                >
                  <q-date
                    v-model="data.date"
                    mask="YYYY-MM-DD"
                  >
                    <div class="row items-center justify-end">
                      <q-btn
                        v-close-popup
                        :label="t('action.close')"
                        color="primary"
                        flat
                        rounded
                      />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>

          <q-select
            v-model="data.paidBy"
            :label="t('fields.paidBy.label')"
            :options="paidByOptions"
            new-value-mode="add-unique"
            input-debounce="0"
            clearable
            use-input
            outlined
            rounded
            @filter="paidByFilter"
          >
            <template #prepend>
              <q-icon name="person" />
            </template>
          </q-select>

          <!-- paidAt -->
          <q-input
            v-if="data.paidBy"
            v-model="data.paidAt"
            :label="t('field.paidAt.label')"
            outlined
            rounded
          >
            <template #prepend>
              <q-icon name="calendar_month" />
            </template>
            <template #append>
              <q-icon
                name="event"
                class="cursor-pointer"
              >
                <q-popup-proxy
                  cover
                  transition-show="scale"
                  transition-hide="scale"
                >
                  <q-date
                    v-model="data.paidAt"
                    mask="YYYY-MM-DD"
                  >
                    <div class="row items-center justify-end">
                      <q-btn
                        v-close-popup
                        :label="t('action.close')"
                        color="primary"
                        flat
                        rounded
                      />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>

          <!-- recipient -->
          <q-input
            v-model="data.recipient"
            :label="t('field.recipient.label')"
            outlined
            rounded
          >
            <template #prepend>
              <q-icon name="arrow_forward" />
            </template>
          </q-input>

          <!-- TODO fileId -->
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
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { reactive, ref } from 'vue';
import type { ExpenseCreateData } from '@camp-registration/common/entities';
import TranslatedInput from 'components/common/inputs/TranslatedInput.vue';

const props = defineProps<{
  locales?: string[];
  people: string[];
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { t } = useI18n();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const data = reactive<Partial<ExpenseCreateData>>({});
const paidByOptions = ref<string[]>(props.people);

function onOKClick(): void {
  onDialogOK(data);
}

function onCancelClick() {
  onDialogCancel();
}

function paidByFilter(val: string, update: (cb: () => void) => void) {
  update(() => {
    const needle = val.toLowerCase();
    paidByOptions.value = props.people.filter(
      (v) => v.toLowerCase().indexOf(needle) > -1,
    );
  });
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
title: 'Add expense'

fields:
  name:
    label: 'Name'
    rules:
      required: 'Name is required'
  amount:
    label: 'Amount'
    rules:
      required: 'Amount is required'

actions:
  ok: 'Ok'
  save: 'Save'
  cancel: 'Cancel'
</i18n>

<style lang="scss">
input[type='number']::-webkit-outer-spin-button,
input[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
