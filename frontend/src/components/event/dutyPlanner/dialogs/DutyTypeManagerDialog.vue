<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin manager-card">
      <q-card-section class="row items-center justify-between no-wrap">
        <div class="text-h6">{{ t('title') }}</div>
        <div class="row items-center q-gutter-x-xs">
          <q-btn
            v-if="can('event.duties.create')"
            icon="add"
            flat
            round
            dense
            :aria-label="t('action.add')"
            @click="addDutyType"
          >
            <q-tooltip>{{ t('action.add') }}</q-tooltip>
          </q-btn>
          <q-btn
            v-close-popup
            icon="close"
            flat
            round
            dense
            :aria-label="t('action.close')"
          />
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div
          v-if="duties.length === 0"
          class="empty-state column items-center text-center"
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
            v-for="duty in duties"
            :key="duty.id"
          >
            <q-item-section avatar>
              <q-icon
                name="checklist"
                color="primary"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ to(duty.name) }}</q-item-label>
              <q-item-label
                v-if="
                  duty.defaultCount ||
                  duty.excludeStaff ||
                  duty.balanceCountries
                "
                caption
              >
                <span v-if="duty.defaultCount">
                  {{ t('dutyType.defaultCount', { count: duty.defaultCount }) }}
                </span>
                <span v-if="duty.excludeStaff">
                  · {{ t('dutyType.excludeStaff') }}
                </span>
                <span v-if="duty.balanceCountries">
                  · {{ t('dutyType.balanceCountries') }}
                </span>
              </q-item-label>
            </q-item-section>
            <q-item-section
              v-if="canManageDutyTypes"
              side
            >
              <div class="row q-gutter-x-xs">
                <q-btn
                  v-if="can('event.duties.edit')"
                  icon="edit"
                  flat
                  round
                  dense
                  :aria-label="t('action.edit')"
                  @click="editDutyType(duty)"
                />
                <q-btn
                  v-if="can('event.duties.delete')"
                  icon="delete"
                  flat
                  round
                  dense
                  :aria-label="t('action.delete')"
                  @click="deleteDutyType(duty)"
                />
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import type {
  Duty,
  DutyCreateData,
  DutyUpdateData,
} from '@camp-registration/common/entities';
import { useDutyStore } from '@/stores/duty-store';
import { useDutyAssignmentStore } from '@/stores/duty-assignment-store';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { usePermissions } from '@/composables/permissions';
import ConfirmDialog from '@/components/common/dialogs/ConfirmDialog.vue';
import DutyTypeDialog from '@/components/event/dutyPlanner/dialogs/DutyTypeDialog.vue';

const { t } = useI18n();
const quasar = useQuasar();
const { dialogRef, onDialogHide } = useDialogPluginComponent();
const dutyStore = useDutyStore();
const dutyAssignmentStore = useDutyAssignmentStore();
const { to } = useObjectTranslation();
const { can } = usePermissions();

const props = defineProps<{
  locales?: string[];
}>();

defineEmits([...useDialogPluginComponent.emits]);

const duties = computed<Duty[]>(() => dutyStore.data ?? []);

const canManageDutyTypes = computed<boolean>(() => {
  return can('event.duties.edit') || can('event.duties.delete');
});

function addDutyType() {
  quasar
    .dialog({
      component: DutyTypeDialog,
      componentProps: { locales: props.locales },
    })
    .onOk((payload: DutyCreateData) => {
      void dutyStore.createData(payload);
    });
}

function editDutyType(duty: Duty) {
  quasar
    .dialog({
      component: DutyTypeDialog,
      componentProps: { duty, locales: props.locales },
    })
    .onOk((payload: DutyUpdateData) => {
      void dutyStore.updateData(duty.id, payload);
    });
}

async function performDutyTypeDelete(duty: Duty) {
  await dutyStore.deleteData(duty.id);
  // Deleting a duty type cascades its assignments server-side; no
  // per-assignment realtime event fires for that, so refetch explicitly.
  dutyAssignmentStore.reset();
  await dutyAssignmentStore.fetchData();
}

function deleteDutyType(duty: Duty) {
  quasar
    .dialog({
      component: ConfirmDialog,
      componentProps: {
        title: t('dialog.deleteDuty.title'),
        message: t('dialog.deleteDuty.message', { name: to(duty.name) }),
        okLabel: t('action.delete'),
        color: 'negative',
      },
    })
    .onOk(() => {
      void performDutyTypeDelete(duty);
    });
}
</script>

<style scoped>
.manager-card {
  min-width: min(480px, 90vw);
}

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
title: 'Duty types'

action:
  add: 'Add'
  edit: 'Edit'
  delete: 'Delete'
  close: 'Close'

empty:
  title: 'No duty types yet'
  message: 'Create a duty type — like Kitchen or Dishwashing — to start planning.'

dutyType:
  defaultCount: 'Usually {count} people'
  excludeStaff: 'Staff excluded'
  balanceCountries: 'Country-balanced'

dialog:
  deleteDuty:
    title: 'Delete duty type'
    message: 'Do you really want to delete "{name}"? All of its assignments will be deleted too.'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Diensttypen'

action:
  add: 'Hinzufügen'
  edit: 'Bearbeiten'
  delete: 'Löschen'
  close: 'Schließen'

empty:
  title: 'Noch keine Diensttypen'
  message: 'Erstelle einen Diensttyp — z. B. Küche oder Abwasch — um mit der Planung zu beginnen.'

dutyType:
  defaultCount: 'Normalerweise {count} Personen'
  excludeStaff: 'Betreuende ausgeschlossen'
  balanceCountries: 'Länderausgleich'

dialog:
  deleteDuty:
    title: 'Diensttyp löschen'
    message: 'Möchtest du „{name}" wirklich löschen? Alle zugehörigen Einsätze werden ebenfalls gelöscht.'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Types de corvée'

action:
  add: 'Ajouter'
  edit: 'Modifier'
  delete: 'Supprimer'
  close: 'Fermer'

empty:
  title: 'Aucun type de corvée pour le moment'
  message: 'Crée un type de corvée — comme Cuisine ou Vaisselle — pour commencer à planifier.'

dutyType:
  defaultCount: 'Généralement {count} personnes'
  excludeStaff: 'Encadrement exclu'
  balanceCountries: 'Équilibre des pays'

dialog:
  deleteDuty:
    title: 'Supprimer le type de corvée'
    message: 'Veux-tu vraiment supprimer « {name} » ? Toutes ses affectations seront également supprimées.'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Rodzaje dyżurów'

action:
  add: 'Dodaj'
  edit: 'Edytuj'
  delete: 'Usuń'
  close: 'Zamknij'

empty:
  title: 'Brak rodzajów dyżurów'
  message: 'Utwórz rodzaj dyżuru — np. Kuchnia lub Zmywanie — aby zacząć planowanie.'

dutyType:
  defaultCount: 'Zwykle {count} osób'
  excludeStaff: 'Kadra wykluczona'
  balanceCountries: 'Równoważenie krajów'

dialog:
  deleteDuty:
    title: 'Usuń rodzaj dyżuru'
    message: 'Czy na pewno chcesz usunąć „{name}"? Wszystkie jego przypisania również zostaną usunięte.'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Typy služeb'

action:
  add: 'Přidat'
  edit: 'Upravit'
  delete: 'Smazat'
  close: 'Zavřít'

empty:
  title: 'Zatím žádné typy služeb'
  message: 'Vytvoř typ služby — např. Kuchyně nebo Mytí nádobí — a začni plánovat.'

dutyType:
  defaultCount: 'Obvykle {count} lidí'
  excludeStaff: 'Vedoucí vyloučeni'
  balanceCountries: 'Vyvážení zemí'

dialog:
  deleteDuty:
    title: 'Smazat typ služby'
    message: 'Opravdu chceš smazat „{name}"? Všechna jeho přiřazení budou také smazána.'
</i18n>
