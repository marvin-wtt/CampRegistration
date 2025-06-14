<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card
      class="q-dialog-plugin q-pb-none row"
      :style="dialogStyle"
    >
      <q-card-section class="text-h5 text-center col-12">
        {{ t('title') }}
      </q-card-section>

      <q-card-section :class="showFilePreview ? 'col-shrink' : 'col'">
        <expense-details-list :expense="expense" />
      </q-card-section>

      <q-card-section
        v-if="showFilePreview && expense.file != null"
        class="col-grow relative-position overflow-hidden q-mr-sm"
      >
        <expense-file-viewer :file="expense.file" />
      </q-card-section>

      <q-card-actions
        align="center"
        class="col-12"
      >
        <q-btn
          :label="t('action.ok')"
          color="primary"
          rounded
          @click="onDialogCancel"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import type { Expense } from '@camp-registration/common/entities';
import { useDialogPluginComponent, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed, StyleValue } from 'vue';
import ExpenseDetailsList from 'components/campManagement/expenses/ExpenseDetailsList.vue';
import ExpenseFileViewer from 'components/campManagement/expenses/ExpenseFileViewer.vue';

const { expense } = defineProps<{
  expense: Expense;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const quasar = useQuasar();
const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent();
const { t } = useI18n();

const showFilePreview = computed<boolean>(() => {
  return expense.file != null && quasar.screen.gt.sm;
});

const dialogStyle = computed<StyleValue>(() => {
  if (!showFilePreview.value) {
    return undefined;
  }

  return {
    width: '1000px',
    maxWidth: '80dvw',
  };
});
</script>

<i18n lang="yaml" locale="en">
title: 'Details'

action:
  ok: 'Ok'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Details'

action:
  ok: 'Ok'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Détails'

action:
  ok: 'Ok'
</i18n>

<style scoped></style>
