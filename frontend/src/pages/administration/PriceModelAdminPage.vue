<template>
  <page-state-handler :error>
    <div class="admin-page column no-wrap fit">
      <admin-list-toolbar
        v-model:search="search"
        :title="t('title')"
        :total="filteredRows.length"
        :loading
        :search-placeholder="t('search')"
        @refresh="reload"
      >
        <template #actions>
          <q-btn
            :label="t('action.create')"
            icon="add"
            color="primary"
            unelevated
            rounded
            no-caps
            @click="onCreate"
          />
        </template>
      </admin-list-toolbar>

      <q-table
        :loading
        :rows="filteredRows"
        :columns
        :rows-per-page-options="[0]"
        hide-bottom
        row-key="id"
        flat
        bordered
        class="admin-table col rounded-borders"
      >
        <template #body-cell-name="props">
          <q-td :props>
            <span :class="{ 'text-on-surface-variant': props.row.archivedAt }">
              {{ to(props.row.name) }}
            </span>
            <q-badge
              v-if="props.row.isDefault"
              :label="t('badge.default')"
              color="primary"
              class="q-ml-sm"
            />
            <q-badge
              v-if="props.row.archivedAt"
              :label="t('badge.archived')"
              color="grey"
              outline
              class="q-ml-sm"
            />
          </q-td>
        </template>

        <template #body-cell-action="props">
          <q-td
            :props
            auto-width
          >
            <row-actions :actions="actionsFor(props.row)" />
          </q-td>
        </template>
      </q-table>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar, type QTableColumn } from 'quasar';
import type {
  PriceModel,
  PriceModelCreateData,
} from '@camp-registration/common/entities';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import AdminListToolbar from '@/components/administration/AdminListToolbar.vue';
import RowActions, {
  type RowAction,
} from '@/components/administration/RowActions.vue';
import PriceModelDialog from '@/components/billing/PriceModelDialog.vue';
import { useAPIService } from '@/services/APIService';
import { useServiceNotifications } from '@/composables/serviceHandler';
import { formatMoney } from '@/utils/money';
import { useObjectTranslation } from '@/composables/objectTranslation';

const { t, locale } = useI18n();
const { to } = useObjectTranslation();
const quasar = useQuasar();
const api = useAPIService();
const { withProgressNotification } = useServiceNotifications('billing');

const rows = ref<PriceModel[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const search = ref<string | null>('');

async function reload() {
  loading.value = true;
  try {
    rows.value = await api.fetchPriceModels();
    error.value = null;
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    loading.value = false;
  }
}

void reload();

const filteredRows = computed(() => {
  const term = search.value?.trim().toLowerCase();

  return term
    ? rows.value.filter((row) => to(row.name).toLowerCase().includes(term))
    : rows.value;
});

const columns = computed<QTableColumn<PriceModel>[]>(() => [
  {
    name: 'name',
    label: t('column.name'),
    field: (row) => to(row.name),
    align: 'left',
    sortable: true,
  },
  {
    name: 'pricePerRegistration',
    label: t('column.pricePerRegistration'),
    field: (row) =>
      formatMoney(row.pricePerRegistration, row.currency, locale.value),
    align: 'right',
  },
  {
    name: 'baseFee',
    label: t('column.baseFee'),
    field: (row) => formatMoney(row.baseFee, row.currency, locale.value),
    align: 'right',
  },
  {
    name: 'taxRate',
    label: t('column.taxRate'),
    field: (row) => `${row.taxRate} %`,
    align: 'right',
  },
  {
    name: 'usage',
    label: t('column.usage'),
    field: (row) =>
      row.usage
        ? t('usage', {
            organizations: row.usage.organizations,
            events: row.usage.events,
          })
        : '—',
    align: 'left',
  },
  {
    name: 'action',
    label: t('column.action'),
    field: 'id',
    align: 'center',
  },
]);

function actionsFor(priceModel: PriceModel): RowAction[] {
  return [
    {
      key: 'edit',
      label: t('action.edit'),
      icon: 'edit',
      handler: () => onEdit(priceModel),
    },
    {
      key: 'default',
      label: t('action.default'),
      icon: 'star',
      color: 'primary',
      hidden: priceModel.isDefault || !!priceModel.archivedAt,
      handler: () =>
        run('setDefault', () => api.setDefaultPriceModel(priceModel.id)),
    },
    {
      key: 'archive',
      label: priceModel.archivedAt
        ? t('action.unarchive')
        : t('action.archive'),
      icon: priceModel.archivedAt ? 'unarchive' : 'archive',
      hidden: priceModel.isDefault,
      handler: () =>
        run('update', () =>
          api.updatePriceModel(priceModel.id, {
            archived: !priceModel.archivedAt,
          }),
        ),
    },
    {
      key: 'delete',
      label: t('action.delete'),
      icon: 'delete',
      color: 'negative',
      separatorBefore: true,
      hidden: priceModel.isDefault,
      handler: () => onDelete(priceModel),
    },
  ];
}

function run(operation: string, fn: () => Promise<unknown>) {
  void withProgressNotification(operation, fn).then(
    () => reload(),
    // Already reported by the progress notification.
    () => undefined,
  );
}

function onCreate() {
  quasar
    .dialog({ component: PriceModelDialog })
    .onOk((data: PriceModelCreateData) => {
      run('create', () => api.createPriceModel(data));
    });
}

function onEdit(priceModel: PriceModel) {
  quasar
    .dialog({ component: PriceModelDialog, componentProps: { priceModel } })
    .onOk((data: PriceModelCreateData) => {
      run('update', () => api.updatePriceModel(priceModel.id, data));
    });
}

function onDelete(priceModel: PriceModel) {
  quasar
    .dialog({
      title: t('dialog.delete.title'),
      message: t('dialog.delete.message', { name: to(priceModel.name) }),
      cancel: {
        label: t('dialog.delete.cancel'),
        color: 'primary',
        flat: true,
        rounded: true,
      },
      ok: {
        label: t('dialog.delete.ok'),
        color: 'negative',
        rounded: true,
      },
    })
    .onOk(() => {
      run('delete', () => api.deletePriceModel(priceModel.id));
    });
}
</script>

<i18n lang="yaml" locale="en">
title: 'Price models'
search: 'Search by name'
usage: '{organizations} organizations · {events} events'
badge:
  default: 'Default'
  archived: 'Archived'
column:
  name: 'Name'
  pricePerRegistration: 'Per registration'
  baseFee: 'Base fee'
  taxRate: 'Tax'
  usage: 'Used by'
  action: 'Actions'
action:
  create: 'New price model'
  edit: 'Edit'
  default: 'Make default'
  archive: 'Archive'
  unarchive: 'Restore'
  delete: 'Delete'
dialog:
  delete:
    title: 'Delete price model'
    message: 'Delete "{name}"? A model that is assigned or was used for a bill cannot be deleted — archive it instead.'
    cancel: 'Cancel'
    ok: 'Delete'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Preismodelle'
search: 'Nach Name suchen'
usage: '{organizations} Organisationen · {events} Veranstaltungen'
badge:
  default: 'Standard'
  archived: 'Archiviert'
column:
  name: 'Name'
  pricePerRegistration: 'Pro Anmeldung'
  baseFee: 'Grundgebühr'
  taxRate: 'Steuer'
  usage: 'Verwendet von'
  action: 'Aktionen'
action:
  create: 'Neues Preismodell'
  edit: 'Bearbeiten'
  default: 'Als Standard festlegen'
  archive: 'Archivieren'
  unarchive: 'Wiederherstellen'
  delete: 'Löschen'
dialog:
  delete:
    title: 'Preismodell löschen'
    message: '"{name}" löschen? Ein zugewiesenes oder bereits abgerechnetes Modell kann nicht gelöscht werden — archiviere es stattdessen.'
    cancel: 'Abbrechen'
    ok: 'Löschen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Modèles tarifaires'
search: 'Rechercher par nom'
usage: '{organizations} organisations · {events} événements'
badge:
  default: 'Par défaut'
  archived: 'Archivé'
column:
  name: 'Nom'
  pricePerRegistration: 'Par inscription'
  baseFee: 'Frais de base'
  taxRate: 'Taxe'
  usage: 'Utilisé par'
  action: 'Actions'
action:
  create: 'Nouveau modèle tarifaire'
  edit: 'Modifier'
  default: 'Définir par défaut'
  archive: 'Archiver'
  unarchive: 'Restaurer'
  delete: 'Supprimer'
dialog:
  delete:
    title: 'Supprimer le modèle tarifaire'
    message: 'Supprimer « {name} » ? Un modèle attribué ou déjà facturé ne peut pas être supprimé — archivez-le plutôt.'
    cancel: 'Annuler'
    ok: 'Supprimer'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Modele cenowe'
search: 'Szukaj po nazwie'
usage: 'Organizacje: {organizations} · wydarzenia: {events}'
badge:
  default: 'Domyślny'
  archived: 'Zarchiwizowany'
column:
  name: 'Nazwa'
  pricePerRegistration: 'Za zgłoszenie'
  baseFee: 'Opłata podstawowa'
  taxRate: 'Podatek'
  usage: 'Używany przez'
  action: 'Akcje'
action:
  create: 'Nowy model cenowy'
  edit: 'Edytuj'
  default: 'Ustaw jako domyślny'
  archive: 'Archiwizuj'
  unarchive: 'Przywróć'
  delete: 'Usuń'
dialog:
  delete:
    title: 'Usuń model cenowy'
    message: 'Usunąć „{name}”? Modelu przypisanego lub użytego w rachunku nie można usunąć — zarchiwizuj go zamiast tego.'
    cancel: 'Anuluj'
    ok: 'Usuń'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Cenové modely'
search: 'Hledat podle názvu'
usage: 'Organizace: {organizations} · akce: {events}'
badge:
  default: 'Výchozí'
  archived: 'Archivováno'
column:
  name: 'Název'
  pricePerRegistration: 'Za přihlášku'
  baseFee: 'Základní poplatek'
  taxRate: 'Daň'
  usage: 'Používá'
  action: 'Akce'
action:
  create: 'Nový cenový model'
  edit: 'Upravit'
  default: 'Nastavit jako výchozí'
  archive: 'Archivovat'
  unarchive: 'Obnovit'
  delete: 'Smazat'
dialog:
  delete:
    title: 'Smazat cenový model'
    message: 'Smazat „{name}“? Přiřazený nebo již vyúčtovaný model nelze smazat — místo toho jej archivujte.'
    cancel: 'Zrušit'
    ok: 'Smazat'
</i18n>
