<template>
  <q-dialog
    ref="dialogRef"
    persistent
    @hide="onDialogHide"
  >
    <q-card
      class="q-dialog-plugin"
      :style="dialogStyle"
    >
      <q-form
        class="q-pb-none row"
        @submit="onSave"
        @reset="onDialogCancel"
      >
        <q-card-section class="text-h5 text-center col-12">
          {{ t('title') }}
        </q-card-section>

        <q-card-section :class="showFilePreview ? 'col-shrink' : 'col'">
          <expense-create-form
            v-model="expense"
            :people="people"
            :categories="categories"
          />
        </q-card-section>

        <q-card-section
          v-if="showFilePreview && previewFile != null"
          class="col-grow relative-position overflow-hidden q-mr-sm"
        >
          <expense-file-viewer :file="previewFile" />
        </q-card-section>

        <q-card-actions
          align="center"
          class="col-12"
        >
          <q-btn
            :label="t('action.cancel')"
            type="reset"
            color="primary"
            rounded
            outline
          />
          <q-btn
            :label="t('action.save')"
            type="submit"
            color="primary"
            rounded
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import type { ExpenseCreateData } from '@camp-registration/common/entities';
import { useDialogPluginComponent, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed, ref, StyleValue } from 'vue';
import ExpenseCreateForm from 'components/campManagement/expenses/ExpenseCreateForm.vue';
import ExpenseFileViewer from 'components/campManagement/expenses/ExpenseFileViewer.vue';
import { ExpenseCategory } from 'components/campManagement/expenses/ExpenseCategory.ts';

const { people, categories } = defineProps<{
  people: string[];
  categories: ExpenseCategory[];
}>();

defineEmits([...useDialogPluginComponent.emits]);

const quasar = useQuasar();
const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } =
  useDialogPluginComponent();
const { t } = useI18n();

const expense = ref<Partial<ExpenseCreateData>>({});

const showFilePreview = computed<boolean>(() => {
  return previewFile.value != null && quasar.screen.gt.sm;
});

interface SimpleFile {
  name: string;
  type: string;
  url: string;
}

const previewFile = computed<SimpleFile | null>(() => {
  if (expense.value.file == null) {
    return null;
  }

  const file = expense.value.file;

  return {
    name: file.name,
    type: file.type,
    url: URL.createObjectURL(expense.value.file),
  };
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

function onSave() {
  onDialogOK(expense.value as ExpenseCreateData);
}
</script>

<i18n lang="yaml" locale="en">
title: 'Create'

action:
  cancel: 'Cancel'
  ok: 'Ok'
  save: 'Save'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Erstellen'

action:
  cancel: 'Abbrechen'
  save: 'Speichern'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Créer'

action:
  cancel: 'Annuler'
  save: 'Enregistrer'
</i18n>

<style scoped></style>
