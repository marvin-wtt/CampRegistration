<template>
  <responsive-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <dialog-card
      :title="t('title')"
      :width="480"
      @cancel="onDialogCancel"
    >
      <template #header-actions>
        <q-btn
          v-if="can('event.chores.create')"
          icon="add"
          flat
          round
          :aria-label="t('action.add')"
          @click="addChore"
        >
          <q-tooltip>{{ t('action.add') }}</q-tooltip>
        </q-btn>
      </template>

      <div>
        <div
          v-if="chores.length === 0"
          class="empty-state column no-wrap items-center text-center"
        >
          <q-icon
            name="checklist"
            size="48px"
            class="empty-icon"
          />
          <div class="text-subtitle1 q-mt-md">
            {{ t('empty.title') }}
          </div>
          <div class="text-body2 text-grey-6 q-mt-xs">
            {{ t('empty.message') }}
          </div>
        </div>

        <q-list
          v-else
          separator
          class="section-card"
          bordered
        >
          <q-item
            v-for="chore in chores"
            :key="chore.id"
          >
            <q-item-section avatar>
              <q-icon
                name="checklist"
                color="primary"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ to(chore.name) }}</q-item-label>
              <q-item-label caption>
                {{ choreSummary(chore) }}
              </q-item-label>
            </q-item-section>
            <q-item-section
              v-if="canManageChores"
              side
            >
              <div class="row q-gutter-x-xs">
                <q-btn
                  v-if="can('event.chores.edit')"
                  icon="edit"
                  flat
                  round
                  :aria-label="t('action.edit')"
                  @click="editChore(chore)"
                />
                <q-btn
                  v-if="can('event.chores.delete')"
                  icon="delete"
                  flat
                  round
                  :aria-label="t('action.delete')"
                  @click="deleteChore(chore)"
                />
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </dialog-card>
  </responsive-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import type {
  Chore,
  ChoreCreateData,
  ChoreUpdateData,
} from '@camp-registration/common/entities';
import { useChoreStore } from '@/stores/chore-store';
import { useChoreAssignmentStore } from '@/stores/chore-assignment-store';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { usePermissions } from '@/composables/permissions';
import ConfirmDialog from '@/components/common/dialogs/ConfirmDialog.vue';
import ChoreDialog from '@/components/event/chorePlanner/dialogs/ChoreDialog.vue';
import DialogCard from '@/components/common/dialogs/DialogCard.vue';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';

const { t } = useI18n();
const quasar = useQuasar();
const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent();
const choreStore = useChoreStore();
const choreAssignmentStore = useChoreAssignmentStore();
const { to } = useObjectTranslation();
const { can } = usePermissions();

const props = defineProps<{
  locales?: string[];
  countries?: string[];
}>();

defineEmits([...useDialogPluginComponent.emits]);

const chores = computed<Chore[]>(() => choreStore.data ?? []);

function choreSummary(chore: Chore): string {
  return [
    t(`dutyType.eligibility.${chore.eligibility}`),
    t(`dutyType.effort.${chore.effort}`),
    chore.defaultCount
      ? t('dutyType.defaultCount', { count: chore.defaultCount })
      : undefined,
    chore.supervisorCount > 0
      ? t('dutyType.supervisors', { count: chore.supervisorCount })
      : undefined,
    chore.slots.length > 0
      ? chore.slots.map((slot) => to(slot.name)).join(', ')
      : undefined,
    chore.balanceCountries ? t('dutyType.balanceCountries') : undefined,
  ]
    .filter(Boolean)
    .join(' · ');
}

const canManageChores = computed<boolean>(() => {
  return can('event.chores.edit') || can('event.chores.delete');
});

function addChore() {
  quasar
    .dialog({
      component: ChoreDialog,
      componentProps: { locales: props.locales, countries: props.countries },
    })
    .onOk((payload: ChoreCreateData) => {
      void choreStore.createData(payload);
    });
}

function editChore(chore: Chore) {
  quasar
    .dialog({
      component: ChoreDialog,
      componentProps: {
        chore,
        locales: props.locales,
        countries: props.countries,
      },
    })
    .onOk((payload: ChoreUpdateData) => {
      void choreStore.updateData(chore.id, payload);
    });
}

async function performChoreDelete(chore: Chore) {
  await choreStore.deleteData(chore.id);
  // Deleting a chore cascades its assignments server-side; no
  // per-assignment realtime event fires for that, so refetch explicitly.
  choreAssignmentStore.reset();
  await choreAssignmentStore.fetchData();
}

function deleteChore(chore: Chore) {
  quasar
    .dialog({
      component: ConfirmDialog,
      componentProps: {
        title: t('dialog.deleteDuty.title'),
        message: t('dialog.deleteDuty.message', { name: to(chore.name) }),
        okLabel: t('action.delete'),
        color: 'negative',
      },
    })
    .onOk(() => {
      void performChoreDelete(chore);
    });
}
</script>

<style scoped>
.section-card {
  border-radius: 16px;
}

.empty-state {
  padding: 24px 16px;
}

.empty-icon {
  color: var(--md3-on-surface-variant);
  opacity: 0.6;
}
</style>

<i18n lang="yaml" locale="en">
title: 'Chores'

action:
  add: 'Add'
  edit: 'Edit'
  delete: 'Delete'

empty:
  title: 'No chores yet'
  message: 'Create a chore — like Kitchen or Dishwashing — to start planning.'

dutyType:
  defaultCount: 'Usually {count} people'
  supervisors: '{count} supervisor | {count} supervisors'
  eligibility:
    PARTICIPANTS: 'Participants'
    STAFF: 'Staff'
    EVERYONE: 'Everyone'
  effort:
    LIGHT: 'Light'
    NORMAL: 'Normal effort'
    HEAVY: 'Heavy'
  balanceCountries: 'Country-balanced'

dialog:
  deleteDuty:
    title: 'Delete chore'
    message: 'Do you really want to delete "{name}"? All of its assignments will be deleted too.'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Diensttypen'

action:
  add: 'Hinzufügen'
  edit: 'Bearbeiten'
  delete: 'Löschen'

empty:
  title: 'Noch keine Diensttypen'
  message: 'Erstelle einen Diensttyp — z. B. Küche oder Abwasch — um mit der Planung zu beginnen.'

dutyType:
  defaultCount: 'Normalerweise {count} Personen'
  supervisors: '{count} Aufsicht | {count} Aufsichten'
  eligibility:
    PARTICIPANTS: 'Teilnehmende'
    STAFF: 'Betreuende'
    EVERYONE: 'Alle'
  effort:
    LIGHT: 'Leicht'
    NORMAL: 'Normaler Aufwand'
    HEAVY: 'Schwer'
  balanceCountries: 'Länderausgleich'

dialog:
  deleteDuty:
    title: 'Diensttyp löschen'
    message: 'Möchtest du „{name}“ wirklich löschen? Alle zugehörigen Einsätze werden ebenfalls gelöscht.'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Corvées'

action:
  add: 'Ajouter'
  edit: 'Modifier'
  delete: 'Supprimer'

empty:
  title: 'Aucune corvée pour le moment'
  message: 'Crée une corvée — comme Cuisine ou Vaisselle — pour commencer à planifier.'

dutyType:
  defaultCount: 'Généralement {count} personnes'
  supervisors: '{count} encadrant | {count} encadrants'
  eligibility:
    PARTICIPANTS: 'Participants'
    STAFF: 'Encadrement'
    EVERYONE: 'Tout le monde'
  effort:
    LIGHT: 'Léger'
    NORMAL: 'Effort normal'
    HEAVY: 'Lourd'
  balanceCountries: 'Équilibre des pays'

dialog:
  deleteDuty:
    title: 'Supprimer la corvée'
    message: 'Veux-tu vraiment supprimer « {name} » ? Toutes ses affectations seront également supprimées.'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Obowiązki'

action:
  add: 'Dodaj'
  edit: 'Edytuj'
  delete: 'Usuń'

empty:
  title: 'Brak obowiązków'
  message: 'Utwórz obowiązek — np. Kuchnia lub Zmywanie — aby zacząć planowanie.'

dutyType:
  defaultCount: 'Zwykle {count} osób'
  supervisors: '{count} opiekun | {count} opiekunów'
  eligibility:
    PARTICIPANTS: 'Uczestnicy'
    STAFF: 'Kadra'
    EVERYONE: 'Wszyscy'
  effort:
    LIGHT: 'Lekki'
    NORMAL: 'Normalny wysiłek'
    HEAVY: 'Ciężki'
  balanceCountries: 'Równoważenie krajów'

dialog:
  deleteDuty:
    title: 'Usuń obowiązek'
    message: 'Czy na pewno chcesz usunąć „{name}”? Wszystkie jego przypisania również zostaną usunięte.'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Povinnosti'

action:
  add: 'Přidat'
  edit: 'Upravit'
  delete: 'Smazat'

empty:
  title: 'Zatím žádné povinnosti'
  message: 'Vytvoř povinnost — např. Kuchyně nebo Mytí nádobí — a začni plánovat.'

dutyType:
  defaultCount: 'Obvykle {count} lidí'
  supervisors: '{count} dozor | {count} dozory'
  eligibility:
    PARTICIPANTS: 'Účastníci'
    STAFF: 'Vedoucí'
    EVERYONE: 'Všichni'
  effort:
    LIGHT: 'Lehká'
    NORMAL: 'Běžná náročnost'
    HEAVY: 'Těžká'
  balanceCountries: 'Vyvážení zemí'

dialog:
  deleteDuty:
    title: 'Smazat povinnost'
    message: 'Opravdu chceš smazat „{name}“? Všechna jeho přiřazení budou také smazána.'
</i18n>
