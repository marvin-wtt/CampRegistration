<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card
      class="row-card rounded-xl"
      style="width: min(560px, 95vw); max-width: min(640px, 95vw)"
    >
      <registration-dialog-header :registration="registration">
        <q-btn
          class="header-btn"
          dense
          flat
          icon="more_vert"
          round
        >
          <q-tooltip>
            {{ t('action.menu') }}
          </q-tooltip>
          <q-menu auto-close>
            <registration-action-list :registration="registration" />
          </q-menu>
        </q-btn>

        <q-btn
          v-close-popup
          class="header-btn"
          dense
          flat
          icon="close"
          round
          @click="onDialogCancel"
        >
          <q-tooltip>
            {{ t('action.close') }}
          </q-tooltip>
        </q-btn>
      </registration-dialog-header>

      <q-scroll-area
        v-if="fields.length > 0"
        style="height: min(480px, 65vh)"
      >
        <div class="field-list">
          <div
            v-for="field in fields"
            :key="field.name"
            class="field-row"
          >
            <div class="field-label">
              {{ to(field.label) }}
            </div>
            <div class="field-value">
              <table-cell-wrapper
                :renderer="field.renderer"
                :camp
                :props="field.props"
                grid-mode
              />
            </div>
          </div>
        </div>
      </q-scroll-area>

      <div
        v-else
        class="empty-state column flex-center text-center q-pa-xl"
      >
        <q-icon
          name="inbox"
          size="40px"
          class="empty-icon"
        />
        <div class="text-body2 q-mt-sm">
          {{ t('empty') }}
        </div>
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import type {
  CampDetails,
  Registration,
  Translatable,
} from '@camp-registration/common/entities';
import type { CTableColumnTemplate } from 'src/types/CTableTemplate';
import type { TableCellRenderer } from 'components/campManagement/table/TableCellRenderer';
import type { QTableBodyCellProps } from 'src/types/quasar/QTableBodyCellProps';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import { objectValueByPath } from 'src/utils/objectValueByPath';
import TableCellWrapper from 'components/campManagement/table/TableCellWrapper.vue';
import RegistrationActionList from 'components/campManagement/table/RegistrationActionList.vue';
import RegistrationDialogHeader from 'components/campManagement/table/dialogs/RegistrationDialogHeader.vue';

defineEmits([...useDialogPluginComponent.emits]);

const { registration, columns, renderers } = defineProps<{
  registration: Registration;
  columns: CTableColumnTemplate[];
  renderers: Map<string, TableCellRenderer>;
  camp: CampDetails;
}>();

const { t } = useI18n();
const { to } = useObjectTranslation();
const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent();

interface Field {
  name: string;
  label: Translatable;
  renderer: TableCellRenderer;
  props: QTableBodyCellProps;
}

// Skip synthetic columns (row index, action menu) — only show actual data.
const fields = computed<Field[]>(() => {
  return columns
    .filter(
      (column) =>
        column.name !== '_action' &&
        column.name !== '_index' &&
        renderers.has(column.name),
    )
    .map((column) => {
      const value =
        typeof column.field === 'function'
          ? column.field(registration)
          : objectValueByPath(column.field, registration);

      return {
        name: column.name,
        label: column.label,
        renderer: renderers.get(column.name)!,
        props: {
          row: registration,
          rowIndex: 0,
          col: column,
          value,
          key: column.name,
        } as unknown as QTableBodyCellProps,
      };
    });
});
</script>

<style scoped lang="scss">
.row-card {
  background: var(--md3-surface-container-low);
  overflow: hidden;
}

.header-btn {
  color: var(--md3-on-surface-variant);
}

.field-list {
  padding: 4px 0;
}

.field-row {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 8px 20px;
  border-bottom: 1px solid var(--md3-outline-variant);
  transition: background-color 120ms ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: var(--md3-surface-container);
  }
}

.field-label {
  margin-bottom: 2px;
  color: var(--md3-on-surface-variant);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.2px;
}

.field-value {
  display: flex;
  align-items: center;
  min-height: 24px;
  color: var(--md3-on-surface);
  text-align: left;
  white-space: normal;
  word-break: break-word;
}

.empty-state {
  color: var(--md3-on-surface-variant);
}

.empty-icon {
  opacity: 0.6;
}
</style>

<i18n lang="yaml" locale="en">
action:
  menu: 'Actions'
  close: 'Close'
empty: 'No data to display'
</i18n>

<i18n lang="yaml" locale="de">
action:
  menu: 'Aktionen'
  close: 'Schließen'
empty: 'Keine Daten vorhanden'
</i18n>

<i18n lang="yaml" locale="fr">
action:
  menu: 'Actions'
  close: 'Fermer'
empty: 'Aucune donnée à afficher'
</i18n>

<i18n lang="yaml" locale="pl">
action:
  menu: 'Akcje'
  close: 'Zamknij'
empty: 'Brak danych do wyświetlenia'
</i18n>

<i18n lang="yaml" locale="cs">
action:
  menu: 'Akce'
  close: 'Zavřít'
empty: 'Žádná data k zobrazení'
</i18n>
