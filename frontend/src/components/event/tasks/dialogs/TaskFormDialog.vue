<template>
  <responsive-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <dialog-card
      :title="t('title.create')"
      :width="560"
      @submit="onOKClick"
      @cancel="onDialogCancel"
    >
      <div class="q-gutter-y-sm column no-wrap">
        <q-input
          v-model="data.title"
          :label="t('field.title.label')"
          :rules="[
            (val?: string) => !!val?.length || t('field.title.rule.required'),
          ]"
          hide-bottom-space
          autofocus
          outlined
          rounded
        >
          <template #prepend>
            <q-icon name="title" />
          </template>
        </q-input>

        <q-input
          v-model="data.dueDate"
          :label="t('field.dueDate.label')"
          :hint="t('field.dueDate.hint')"
          outlined
          rounded
        >
          <template #prepend>
            <q-icon name="calendar_month" />
          </template>
          <template #append>
            <q-icon
              v-if="data.dueDate"
              name="close"
              class="cursor-pointer"
              @click="data.dueDate = null"
            />
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
                  v-model="data.dueDate"
                  mask="YYYY-MM-DD"
                  minimal
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
          v-model="data.assigneeId"
          :label="t('field.assignee.label')"
          :hint="t('field.assignee.hint')"
          :options="assigneeOptions"
          map-options
          emit-value
          clearable
          outlined
          rounded
        >
          <template #prepend>
            <q-icon name="person" />
          </template>
        </q-select>

        <task-notes-input
          v-model="data.notes"
          :label="t('field.notes.label')"
        />
      </div>

      <template #actions>
        <q-btn
          type="reset"
          outline
          rounded
          color="primary"
          :label="t('action.cancel')"
        />
        <q-btn
          type="submit"
          rounded
          color="primary"
          :label="t('action.create')"
          :loading="saving"
        />
      </template>
    </dialog-card>
  </responsive-dialog>
</template>

<script lang="ts" setup>
import { type QSelectOption, useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import DialogCard from '@/components/common/dialogs/DialogCard.vue';
import TaskNotesInput from '@/components/event/tasks/TaskNotesInput.vue';
import { useTaskStore } from '@/stores/task-store';
import { computed, reactive, ref } from 'vue';
import type {
  EventManager,
  TaskCreateData,
} from '@camp-registration/common/entities';

// Creates a task. Existing tasks are edited in place in TaskDetailsDialog.
const { t } = useI18n();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const props = defineProps<{
  managers: EventManager[];
}>();

defineEmits([...useDialogPluginComponent.emits]);

const taskStore = useTaskStore();

const data = reactive<TaskCreateData>({
  title: '',
  notes: null,
  dueDate: null,
  assigneeId: null,
});

const saving = ref<boolean>(false);

const assigneeOptions = computed<QSelectOption[]>(() => {
  return props.managers
    .filter((manager) => manager.status.toUpperCase() !== 'PENDING')
    .map((manager) => ({
      label: manager.name ?? manager.email,
      value: manager.id,
    }));
});

// Closes only once the task exists, so a failed request keeps the input.
async function onOKClick() {
  if (saving.value) {
    return;
  }

  saving.value = true;
  try {
    await taskStore.createData({
      ...data,
      notes: data.notes?.trim() || null,
    });
  } finally {
    saving.value = false;
  }

  onDialogOK();
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
title:
  create: 'Add task'

field:
  title:
    label: 'Title'
    rule:
      required: 'The title is required'
  notes:
    label: 'Details'
  dueDate:
    label: 'Due date'
    hint: 'Optional'
  assignee:
    label: 'Assignee'
    hint: 'Optional'

action:
  cancel: 'Cancel'
  close: 'Close'
  create: 'Create'
</i18n>

<i18n lang="yaml" locale="de">
title:
  create: 'Aufgabe hinzufügen'

field:
  title:
    label: 'Titel'
    rule:
      required: 'Der Titel ist erforderlich'
  notes:
    label: 'Details'
  dueDate:
    label: 'Fälligkeitsdatum'
    hint: 'Optional'
  assignee:
    label: 'Zuständig'
    hint: 'Optional'

action:
  cancel: 'Abbrechen'
  close: 'Schließen'
  create: 'Erstellen'
</i18n>

<i18n lang="yaml" locale="fr">
title:
  create: 'Ajouter une tâche'

field:
  title:
    label: 'Titre'
    rule:
      required: 'Le titre est requis'
  notes:
    label: 'Détails'
  dueDate:
    label: 'Date d’échéance'
    hint: 'Facultatif'
  assignee:
    label: 'Assigné à'
    hint: 'Facultatif'

action:
  cancel: 'Annuler'
  close: 'Fermer'
  create: 'Créer'
</i18n>

<i18n lang="yaml" locale="pl">
title:
  create: 'Dodaj zadanie'

field:
  title:
    label: 'Tytuł'
    rule:
      required: 'Tytuł jest wymagany'
  notes:
    label: 'Szczegóły'
  dueDate:
    label: 'Termin'
    hint: 'Opcjonalne'
  assignee:
    label: 'Przypisane do'
    hint: 'Opcjonalne'

action:
  cancel: 'Anuluj'
  close: 'Zamknij'
  create: 'Utwórz'
</i18n>

<i18n lang="yaml" locale="cs">
title:
  create: 'Přidat úkol'

field:
  title:
    label: 'Název'
    rule:
      required: 'Název je povinný'
  notes:
    label: 'Podrobnosti'
  dueDate:
    label: 'Termín'
    hint: 'Volitelné'
  assignee:
    label: 'Přiřazeno'
    hint: 'Volitelné'

action:
  cancel: 'Zrušit'
  close: 'Zavřít'
  create: 'Vytvořit'
</i18n>
