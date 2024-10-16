<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin q-pb-none">
      <q-card-section class="text-center text-h5">
        {{ props.label }}
      </q-card-section>
      <q-card-section>
        <q-list separator>
          <expense-item
            v-for="expense in props.expenses"
            :key="expense.id"
            :expense="expense"
          />
        </q-list>
      </q-card-section>

      <!-- action buttons -->
      <q-card-actions align="center">
        <q-btn
          :label="t('actions.ok')"
          color="primary"
          rounded
          @click="onDialogOK"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { Expense } from '@camp-registration/common/entities';
import ExpenseItem from 'components/campManagement/expenses/ExpenseItem.vue';

const props = defineProps<{
  label: string;
  expenses: Expense[];
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { t } = useI18n();
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
actions:
  ok: 'Ok'
  cancel: 'Cancel'
</i18n>

<i18n lang="yaml" locale="de">
actions:
  ok: 'Ok'
  cancel: 'Abbrechen'
</i18n>

<i18n lang="yaml" locale="fr">
actions:
  ok: 'Ok'
  cancel: 'Annuler'
</i18n>

<style lang="scss">
input[type='number']::-webkit-outer-spin-button,
input[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
