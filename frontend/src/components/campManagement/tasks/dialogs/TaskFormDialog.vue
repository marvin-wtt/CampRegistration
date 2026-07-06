<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin q-pb-none">
      <q-form
        @submit="onOKClick"
        @reset="onDialogCancel"
      >
        <q-card-section>
          <div class="text-h5 text-center">
            {{ isEdit ? t('title.edit') : t('title.create') }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none q-gutter-y-sm column">
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
            v-model="data.notes"
            :label="t('field.notes.label')"
            autogrow
            outlined
            rounded
          >
            <template #prepend>
              <q-icon name="description" />
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

          <q-checkbox
            v-if="isEdit"
            v-model="data.completed"
            :label="t('field.completed.label')"
          />
        </q-card-section>

        <!-- action buttons -->
        <q-card-actions align="right">
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
            :label="isEdit ? t('action.save') : t('action.create')"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { type QSelectOption, useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed, reactive } from 'vue';
import type {
  CampManager,
  Task,
  TaskCreateData,
  TaskUpdateData,
} from '@camp-registration/common/entities';

const { t } = useI18n();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const props = defineProps<{
  task?: Task;
  managers: CampManager[];
}>();

defineEmits([...useDialogPluginComponent.emits]);

const isEdit = computed<boolean>(() => props.task !== undefined);

const data = reactive<
  Partial<TaskCreateData> & Partial<Pick<TaskUpdateData, 'completed'>>
>({
  title: props.task?.title ?? '',
  notes: props.task?.notes ?? null,
  dueDate: props.task?.dueDate ?? null,
  assigneeId: props.task?.assigneeId ?? null,
  completed: props.task?.completed ?? false,
});

const assigneeOptions = computed<QSelectOption[]>(() => {
  return props.managers
    .filter((manager) => manager.status.toLowerCase() !== 'pending')
    .map((manager) => ({
      label: manager.name ?? manager.email,
      value: manager.id,
    }));
});

function onOKClick(): void {
  const payload: TaskCreateData | TaskUpdateData = isEdit.value
    ? { ...data }
    : {
        title: data.title ?? '',
        notes: data.notes,
        dueDate: data.dueDate,
        assigneeId: data.assigneeId,
      };

  onDialogOK(payload);
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
title:
  create: 'Add task'
  edit: 'Edit task'

field:
  title:
    label: 'Title'
    rule:
      required: 'The title is required'
  notes:
    label: 'Notes'
  dueDate:
    label: 'Due date'
    hint: 'Optional'
  assignee:
    label: 'Assignee'
    hint: 'Optional'
  completed:
    label: 'Completed'

action:
  cancel: 'Cancel'
  close: 'Close'
  create: 'Create'
  save: 'Save'
</i18n>

<i18n lang="yaml" locale="de">
title:
  create: 'Aufgabe hinzufügen'
  edit: 'Aufgabe bearbeiten'

field:
  title:
    label: 'Titel'
    rule:
      required: 'Der Titel ist erforderlich'
  notes:
    label: 'Notizen'
  dueDate:
    label: 'Fälligkeitsdatum'
    hint: 'Optional'
  assignee:
    label: 'Zuständig'
    hint: 'Optional'
  completed:
    label: 'Erledigt'

action:
  cancel: 'Abbrechen'
  close: 'Schließen'
  create: 'Erstellen'
  save: 'Speichern'
</i18n>

<i18n lang="yaml" locale="fr">
title:
  create: 'Ajouter une tâche'
  edit: 'Modifier la tâche'

field:
  title:
    label: 'Titre'
    rule:
      required: 'Le titre est requis'
  notes:
    label: 'Notes'
  dueDate:
    label: 'Date d’échéance'
    hint: 'Facultatif'
  assignee:
    label: 'Assigné à'
    hint: 'Facultatif'
  completed:
    label: 'Terminée'

action:
  cancel: 'Annuler'
  close: 'Fermer'
  create: 'Créer'
  save: 'Enregistrer'
</i18n>

<i18n lang="yaml" locale="pl">
title:
  create: 'Dodaj zadanie'
  edit: 'Edytuj zadanie'

field:
  title:
    label: 'Tytuł'
    rule:
      required: 'Tytuł jest wymagany'
  notes:
    label: 'Notatki'
  dueDate:
    label: 'Termin'
    hint: 'Opcjonalne'
  assignee:
    label: 'Przypisane do'
    hint: 'Opcjonalne'
  completed:
    label: 'Ukończone'

action:
  cancel: 'Anuluj'
  close: 'Zamknij'
  create: 'Utwórz'
  save: 'Zapisz'
</i18n>

<i18n lang="yaml" locale="cs">
title:
  create: 'Přidat úkol'
  edit: 'Upravit úkol'

field:
  title:
    label: 'Název'
    rule:
      required: 'Název je povinný'
  notes:
    label: 'Poznámky'
  dueDate:
    label: 'Termín'
    hint: 'Volitelné'
  assignee:
    label: 'Přiřazeno'
    hint: 'Volitelné'
  completed:
    label: 'Dokončeno'

action:
  cancel: 'Zrušit'
  close: 'Zavřít'
  create: 'Vytvořit'
  save: 'Uložit'
</i18n>
