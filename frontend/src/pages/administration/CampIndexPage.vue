<template>
  <page-state-handler :error>
    <div class="admin-page column no-wrap fit">
      <admin-list-toolbar
        v-model:search="search"
        :title="t('title')"
        :total="total"
        :loading
        @refresh="reload"
      >
        <template #filters>
          <div class="col-6 col-sm-auto">
            <q-select
              v-model="statusFilter"
              :options="statusOptions"
              :label="t('column.registrationStatus')"
              dense
              outlined
              rounded
              clearable
              emit-value
              map-options
              options-dense
              style="min-width: 140px"
            />
          </div>
          <div class="col-6 col-sm-auto">
            <q-select
              v-model="publicFilter"
              :options="publicOptions"
              :label="t('column.public')"
              dense
              outlined
              rounded
              clearable
              emit-value
              map-options
              options-dense
              style="min-width: 130px"
            />
          </div>
          <div class="col-auto">
            <q-select
              v-model="visibleColumns"
              :options="columnFilterOptions"
              :display-value="t('header.columns')"
              multiple
              emit-value
              map-options
              option-value="name"
              options-cover
              options-dense
              outlined
              rounded
              dense
              style="min-width: 130px"
            />
          </div>
        </template>
      </admin-list-toolbar>

      <q-table
        ref="tableRef"
        v-model:pagination="pagination"
        :loading
        :rows
        :columns
        :visible-columns="visibleColumns"
        :sort-method="identitySort"
        :rows-per-page-options="[0]"
        virtual-scroll
        :virtual-scroll-item-size="48"
        :virtual-scroll-sticky-size-start="48"
        hide-bottom
        row-key="id"
        flat
        bordered
        binary-state-sort
        class="admin-table col rounded-borders"
        @virtual-scroll="onVirtualScroll"
      >
        <template #body-cell-name="props">
          <translation-td :props="props" />
        </template>

        <template #body-cell-organizer="props">
          <translation-td :props="props" />
        </template>

        <template #body-cell-countries="props">
          <q-td :props="props">
            <div class="row q-gutter-x-sm justify-center content-center">
              <div
                v-for="country in props.value"
                :key="country"
              >
                <country-icon
                  :locale="country"
                  size="sm"
                />
              </div>
            </div>
          </q-td>
        </template>

        <template #body-cell-maxParticipants="props">
          <translation-td :props="props" />
        </template>

        <template #body-cell-registrationStatus="props">
          <q-td :props="props">
            <q-chip
              :color="statusColor(props.row.registrationStatus)"
              text-color="white"
              dense
              square
              class="q-ml-none"
            >
              {{ t(`value.${props.row.registrationStatus}`) }}
            </q-chip>
          </q-td>
        </template>

        <template #body-cell-public="props">
          <q-td :props="props">
            <q-chip
              :color="props.value ? 'positive' : 'grey-7'"
              text-color="white"
              dense
              square
              class="q-ml-none"
            >
              {{ props.value ? t('value.public') : t('value.private') }}
            </q-chip>
          </q-td>
        </template>

        <template #body-cell-startAt="props">
          <q-td :props="props">
            {{ formatDateTime(props.value) }}
          </q-td>
        </template>

        <template #body-cell-endAt="props">
          <q-td :props="props">
            {{ formatDateTime(props.value) }}
          </q-td>
        </template>

        <template #body-cell-action="props">
          <q-td
            :props="props"
            auto-width
          >
            <row-actions :actions="rowActionsFn(props.row)" />
          </q-td>
        </template>
      </q-table>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { type QTableColumn } from 'quasar';
import type {
  Camp,
  CampUpdateData,
  CampQuery,
  CampRegistrationStatus,
} from '@camp-registration/common/entities';
import { useI18n } from 'vue-i18n';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import AdminListToolbar from '@/components/administration/AdminListToolbar.vue';
import RowActions, {
  type RowAction,
} from '@/components/administration/RowActions.vue';
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import SafeDeleteDialog from '@/components/common/dialogs/SafeDeleteDialog.vue';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { useRoute, useRouter } from 'vue-router';
import { useAPIService } from '@/services/APIService';
import { useServerTable } from '@/composables/serverTable';
import TranslationTd from '@/components/administration/camps/TranslationTd.vue';
import CountryIcon from '@/components/common/localization/CountryIcon.vue';

const { t, locale } = useI18n();
const { to } = useObjectTranslation();
const quasar = useQuasar();
const route = useRoute();
const router = useRouter();
const api = useAPIService();

const statusFilter = ref<CampRegistrationStatus | null>(
  typeof route.query.status === 'string'
    ? (route.query.status as CampRegistrationStatus)
    : null,
);
const publicFilter = ref<boolean | null>(null);

const {
  tableRef,
  rows,
  search,
  loading,
  error,
  total,
  pagination,
  onVirtualScroll,
  identitySort,
  reload,
  withProgressNotification,
} = useServerTable<Camp, CampQuery>({
  storeName: 'camp',
  sortBy: 'startAt',
  descending: true,
  watchSources: [statusFilter, publicFilter],
  fetch: (query) => api.fetchCampsPaginated(query),
  buildQuery: ({ cursor, limit, sortBy, sortType, search }) =>
    ({
      view: 'all',
      cursor,
      limit,
      sortBy,
      sortType,
      name: search || undefined,
      status: statusFilter.value ?? undefined,
      public: publicFilter.value ?? undefined,
    }) as CampQuery,
});

const statusOptions = computed(() => [
  { label: t('value.open'), value: 'open' },
  { label: t('value.upcoming'), value: 'upcoming' },
  { label: t('value.closed'), value: 'closed' },
]);

const publicOptions = computed(() => [
  { label: t('value.public'), value: true },
  { label: t('value.private'), value: false },
]);

const columns = computed<QTableColumn<Camp>[]>(() => [
  {
    name: 'name',
    label: t('column.name'),
    field: 'name',
    align: 'left',
    required: true,
  },
  {
    name: 'organizer',
    label: t('column.organizer'),
    field: 'organizer',
    align: 'left',
  },
  {
    name: 'countries',
    label: t('column.countries'),
    field: 'countries',
    align: 'center',
  },
  {
    name: 'minAge',
    label: t('column.minAge'),
    field: 'minAge',
    align: 'center',
    sortable: true,
  },
  {
    name: 'maxAge',
    label: t('column.maxAge'),
    field: 'maxAge',
    align: 'center',
    sortable: true,
  },
  {
    name: 'maxParticipants',
    label: t('column.maxParticipants'),
    field: 'maxParticipants',
    align: 'center',
  },
  {
    name: 'startAt',
    label: t('column.start'),
    field: 'startAt',
    align: 'center',
    sortable: true,
  },
  {
    name: 'endAt',
    label: t('column.end'),
    field: 'endAt',
    align: 'center',
    sortable: true,
  },
  {
    name: 'price',
    label: t('column.price'),
    field: 'price',
    align: 'right',
    sortable: true,
  },
  {
    name: 'registrationStatus',
    label: t('column.registrationStatus'),
    field: 'registrationStatus',
    align: 'left',
  },
  {
    name: 'public',
    label: t('column.public'),
    field: 'public',
    align: 'left',
    sortable: true,
  },
  {
    name: 'action',
    label: t('column.action'),
    field: 'id',
    align: 'center',
    required: true,
  },
]);

const columnFilterOptions = computed<QTableColumn<Camp>[]>(() => {
  return columns.value.filter((column) => !column.required);
});

const visibleColumns = ref([
  'name',
  'organizer',
  'countries',
  'startAt',
  'registrationStatus',
  'public',
  'action',
]);

function rowActionsFn(camp: Camp): RowAction[] {
  const status = camp.registrationStatus;

  return [
    {
      key: 'form',
      label: t('action.form'),
      icon: 'app_registration',
      handler: () => showCampForm(camp),
    },
    {
      key: 'results',
      label: t('action.results'),
      icon: 'open_in_new',
      handler: () => showCampResults(camp),
    },
    camp.public
      ? {
          key: 'unpublish',
          label: t('action.unpublish'),
          icon: 'unpublished',
          color: 'warning',
          separatorBefore: true,
          handler: () => onUnpublishCamp(camp),
        }
      : {
          key: 'publish',
          label: t('action.publish'),
          icon: 'publish',
          separatorBefore: true,
          handler: () => onPublishCamp(camp),
        },
    status === 'open'
      ? {
          key: 'deactivate',
          label: t('action.deactivate'),
          icon: 'toggle_off',
          color: 'warning',
          handler: () => onDeactivateCamp(camp),
        }
      : {
          key: 'activate',
          label: t('action.activate'),
          icon: 'toggle_on',
          handler: () => onActivateCamp(camp),
        },
    {
      key: 'delete',
      label: t('action.delete'),
      icon: 'delete',
      color: 'negative',
      handler: () => onDeleteCamp(camp),
    },
  ];
}

function statusColor(status: CampRegistrationStatus): string {
  switch (status) {
    case 'open':
      return 'positive';
    case 'upcoming':
      return 'info';
    case 'closed':
      return 'grey-7';
  }
}

function formatDateTime(dateTime: string): string {
  // This could be done by the d function of i18m, but it does not seem to work
  return new Intl.DateTimeFormat(locale.value, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateTime));
}

function showCampForm(camp: Camp) {
  const routeData = router.resolve({
    name: 'camp',
    params: {
      campId: camp.id,
    },
  });

  window.open(routeData.href, '_blank');
}

function showCampResults(camp: Camp) {
  const routeData = router.resolve({
    name: 'management.camp',
    params: {
      campId: camp.id,
    },
  });

  window.open(routeData.href, '_blank');
}

function onDeleteCamp(camp: Camp) {
  quasar
    .dialog({
      component: SafeDeleteDialog,
      componentProps: {
        title: t('dialog.delete.title'),
        message: t('dialog.delete.message', {
          name: to(camp.name),
          organizer: to(camp.organizer),
        }),
        value: to(camp.name),
        label: t('dialog.delete.label'),
      },
    })
    .onOk(() => {
      void deleteCamp(camp.id);
    });
}

function onActivateCamp(camp: Camp) {
  quasar
    .dialog({
      title: t('dialog.activate.title'),
      message: t('dialog.activate.message', { name: to(camp.name) }),
      cancel: {
        label: t('dialog.activate.cancel'),
        color: 'primary',
        rounded: true,
        outline: true,
      },
      ok: {
        label: t('dialog.activate.ok'),
        color: 'primary',
        rounded: true,
      },
    })
    .onOk(() => {
      void updateCamp(camp.id, {
        registrationOpensAt: new Date().toISOString(),
        registrationClosesAt: null,
      });
    });
}

function onDeactivateCamp(camp: Camp) {
  quasar
    .dialog({
      title: t('dialog.deactivate.title'),
      message: t('dialog.deactivate.message', { name: to(camp.name) }),
      cancel: {
        label: t('dialog.deactivate.cancel'),
        color: 'primary',
        rounded: true,
        outline: true,
      },
      ok: {
        label: t('dialog.deactivate.ok'),
        color: 'warning',
        rounded: true,
      },
    })
    .onOk(() => {
      void updateCamp(camp.id, {
        registrationClosesAt: new Date().toISOString(),
      });
    });
}

function onPublishCamp(camp: Camp) {
  quasar
    .dialog({
      title: t('dialog.publish.title'),
      message: t('dialog.publish.message', { name: to(camp.name) }),
      cancel: {
        label: t('dialog.publish.cancel'),
        color: 'primary',
        rounded: true,
        outline: true,
      },
      ok: {
        label: t('dialog.publish.ok'),
        color: 'warning',
        rounded: true,
      },
    })
    .onOk(() => {
      void updateCamp(camp.id, {
        public: true,
      });
    });
}

function onUnpublishCamp(camp: Camp) {
  quasar
    .dialog({
      title: t('dialog.unpublish.title'),
      message: t('dialog.unpublish.message', { name: to(camp.name) }),
      cancel: {
        label: t('dialog.unpublish.cancel'),
        color: 'primary',
        rounded: true,
        outline: true,
      },
      ok: {
        label: t('dialog.unpublish.ok'),
        color: 'primary',
        rounded: true,
      },
    })
    .onOk(() => {
      void updateCamp(camp.id, {
        public: false,
      });
    });
}

async function updateCamp(id: string, data: CampUpdateData) {
  await withProgressNotification('update', () => api.updateCamp(id, data));
  reload();
}

async function deleteCamp(id: string) {
  await withProgressNotification('delete', () => api.deleteCamp(id));
  reload();
}
</script>

<style scoped lang="scss">
.admin-page {
  position: absolute;
  inset: 0;
  padding: 16px;
}

.admin-table {
  // Let the table fill the remaining height and scroll internally instead of
  // growing the page (min-height:0 lets the flex child shrink below content).
  min-height: 0;
  background: var(--md3-surface);

  :deep(thead tr th) {
    position: sticky;
    top: 0;
    z-index: 1;
    background: var(--md3-surface-container-low);
  }
}
</style>

<i18n lang="yaml" locale="en">
title: 'Camps'

action:
  activate: 'Activate'
  deactivate: 'Deactivate'
  delete: 'Delete'
  edit: 'Edit'
  form: 'Form'
  publish: 'Publish'
  results: 'Results'
  unpublish: 'Unpublish'

column:
  action: 'Action'
  registrationStatus: 'Registration'
  countries: 'Countries'
  end: 'End'
  maxAge: 'Max Age'
  maxParticipants: 'Max Participants'
  minAge: 'Min Age'
  name: 'Name'
  organizer: 'Organizer'
  price: 'Price'
  public: 'Public'
  start: 'Start'

dialog:
  activate:
    title: 'Activate camp'
    message: 'Are you sure you want to open the registration for { name }?'
    ok: 'Activate'
    cancel: 'Cancel'
  deactivate:
    title: 'Deactivate camp'
    message: 'Are you sure you want to close the registration for { name }?'
    ok: 'Deactivate'
    cancel: 'Cancel'
  delete:
    title: 'Delete Camp'
    message: 'You are about to delete "{ name }" organized by "{ organizer }".
      All registrations and associated templates will be lost.
      This action is not reversible.
      Are you sure you want ot delete this camp?'
    label: 'Name'
  publish:
    title: 'Publish camp'
    message: 'Are you sure you want to publish { name }?'
    ok: 'Publish'
    cancel: 'Cancel'
  unpublish:
    title: 'Unpublish camp'
    message: 'Are you sure you want to unpublish { name }?'
    ok: 'Unpublish'
    cancel: 'Cancel'

header:
  columns: 'Columns'

value:
  open: 'Open'
  upcoming: 'Upcoming'
  closed: 'Closed'
  public: 'Public'
  private: 'Private'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Camps'

action:
  activate: 'Aktivieren'
  deactivate: 'Deaktivieren'
  delete: 'Löschen'
  edit: 'Bearbeiten'
  form: 'Formular'
  publish: 'Veröffentlichen'
  results: 'Ergebnisse'
  unpublish: 'Veröffentlichung zurückziehen'

column:
  action: 'Aktion'
  registrationStatus: 'Anmeldung'
  countries: 'Länder'
  end: 'Ende'
  maxAge: 'Max. Alter'
  maxParticipants: 'Max. Teilnehmerzahl'
  minAge: 'Min. Alter'
  name: 'Name'
  organizer: 'Veranstalter'
  price: 'Preis'
  public: 'Öffentlich'
  start: 'Start'

dialog:
  activate:
    title: 'Camp aktivieren'
    message: 'Bist du sicher, dass du die Anmeldung für { name } öffnen möchtest?'
    ok: 'Aktivieren'
    cancel: 'Abbrechen'
  deactivate:
    title: 'Camp deaktivieren'
    message: 'Bist du sicher, dass du die Anmeldung für { name } schließen möchtest?'
    ok: 'Deaktivieren'
    cancel: 'Abbrechen'
  delete:
    title: 'Camp löschen'
    message:
      'Du bist dabei, "{ name }" organisiert von "{ organizer }" zu löschen.
      Alle Anmeldungen und zugehörigen Vorlagen gehen verloren.
      Diese Aktion kann nicht rückgängig gemacht werden.
      Bist du sicher, dass du dieses Camp löschen möchtest?'
    label: 'Name'
  publish:
    title: 'Camp veröffentlichen'
    message: 'Bist du sicher, dass du { name } veröffentlichen möchtest?'
    ok: 'Veröffentlichen'
    cancel: 'Abbrechen'
  unpublish:
    title: 'Camp zurückziehen'
    message: 'Bist du sicher, dass du { name } zurückziehen möchtest?'
    ok: 'Zurückziehen'
    cancel: 'Abbrechen'

header:
  columns: 'Spalten'

value:
  open: 'Offen'
  upcoming: 'Bevorstehend'
  closed: 'Geschlossen'
  public: 'Öffentlich'
  private: 'Privat'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Camps'

action:
  activate: 'Activer'
  deactivate: 'Désactiver'
  delete: 'Supprimer'
  edit: 'Modifier'
  form: 'Formulaire'
  publish: 'Publier'
  results: 'Résultats'
  unpublish: 'Dépublier'

column:
  action: 'Action'
  registrationStatus: 'Inscription'
  countries: 'Pays'
  end: 'Fin'
  maxAge: 'Âge max'
  maxParticipants: 'Participants max'
  minAge: 'Âge min'
  name: 'Nom'
  organizer: 'Organisateur'
  price: 'Prix'
  public: 'Public'
  start: 'Début'

dialog:
  activate:
    title: 'Activer le camp'
    message: 'Es-tu sûr de vouloir ouvrir les inscriptions pour { name } ?'
    ok: 'Activer'
    cancel: 'Annuler'
  deactivate:
    title: 'Désactiver le camp'
    message: 'Es-tu sûr de vouloir fermer les inscriptions pour { name } ?'
    ok: 'Désactiver'
    cancel: 'Annuler'
  delete:
    title: 'Supprimer le camp'
    message:
      'Tu es sur le point de supprimer "{ name }" organisé par "{ organizer }".
      Toutes les inscriptions et les modèles associés seront perdus.
      Cette action est irréversible.
      Es-tu sûr de vouloir supprimer ce camp ?'
    label: 'Nom'
  publish:
    title: 'Publier le camp'
    message: 'Es-tu sûr de vouloir publier { name } ?'
    ok: 'Publier'
    cancel: 'Annuler'
  unpublish:
    title: 'Dépublier le camp'
    message: 'Es-tu sûr de vouloir dépublier { name } ?'
    ok: 'Dépublier'
    cancel: 'Annuler'

header:
  columns: 'Colonnes'

value:
  open: 'Ouvert'
  upcoming: 'À venir'
  closed: 'Fermé'
  public: 'Public'
  private: 'Privé'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Obozy'

action:
  activate: 'Aktywuj'
  deactivate: 'Dezaktywuj'
  delete: 'Usuń'
  edit: 'Edytuj'
  form: 'Formularz'
  publish: 'Opublikuj'
  results: 'Wyniki'
  unpublish: 'Cofnij publikację'

column:
  action: 'Akcja'
  registrationStatus: 'Rejestracja'
  countries: 'Kraje'
  end: 'Koniec'
  maxAge: 'Maks. wiek'
  maxParticipants: 'Maks. uczestników'
  minAge: 'Min. wiek'
  name: 'Nazwa'
  organizer: 'Organizator'
  price: 'Cena'
  public: 'Publiczny'
  start: 'Start'

dialog:
  activate:
    title: 'Aktywuj obóz'
    message: 'Czy na pewno chcesz otworzyć rejestrację dla { name }?'
    ok: 'Aktywuj'
    cancel: 'Anuluj'
  deactivate:
    title: 'Dezaktywuj obóz'
    message: 'Czy na pewno chcesz zamknąć rejestrację dla { name }?'
    ok: 'Dezaktywuj'
    cancel: 'Anuluj'
  delete:
    title: 'Usuń obóz'
    message: 'Zamierzasz usunąć "{ name }" zorganizowany przez "{ organizer }".
      Wszystkie zgłoszenia i powiązane szablony zostaną utracone.
      Ta akcja jest nieodwracalna.
      Czy na pewno chcesz usunąć ten obóz?'
    label: 'Nazwa'
  publish:
    title: 'Opublikuj obóz'
    message: 'Czy na pewno chcesz opublikować { name }?'
    ok: 'Opublikuj'
    cancel: 'Anuluj'
  unpublish:
    title: 'Cofnij publikację obozu'
    message: 'Czy na pewno chcesz cofnąć publikację { name }?'
    ok: 'Cofnij'
    cancel: 'Anuluj'

header:
  columns: 'Kolumny'

value:
  open: 'Otwarta'
  upcoming: 'Nadchodząca'
  closed: 'Zamknięta'
  public: 'Publiczny'
  private: 'Prywatny'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Tábory'

action:
  activate: 'Aktivovat'
  deactivate: 'Deaktivovat'
  delete: 'Smazat'
  edit: 'Upravit'
  form: 'Formulář'
  publish: 'Zveřejnit'
  results: 'Výsledky'
  unpublish: 'Zrušit zveřejnění'

column:
  action: 'Akce'
  registrationStatus: 'Registrace'
  countries: 'Země'
  end: 'Konec'
  maxAge: 'Max. věk'
  maxParticipants: 'Max. účastníků'
  minAge: 'Min. věk'
  name: 'Název'
  organizer: 'Organizátor'
  price: 'Cena'
  public: 'Veřejný'
  start: 'Start'

dialog:
  activate:
    title: 'Aktivovat tábor'
    message: 'Opravdu chcete otevřít registraci pro { name }?'
    ok: 'Aktivovat'
    cancel: 'Zrušit'
  deactivate:
    title: 'Deaktivovat tábor'
    message: 'Opravdu chcete uzavřít registraci pro { name }?'
    ok: 'Deaktivovat'
    cancel: 'Zrušit'
  delete:
    title: 'Smazat tábor'
    message: 'Chystáte se smazat "{ name }" organizovaný "{ organizer }".
      Všechny přihlášky a přidružené šablony budou ztraceny.
      Tato akce je nevratná.
      Opravdu chcete tento tábor smazat?'
    label: 'Název'
  publish:
    title: 'Zveřejnit tábor'
    message: 'Opravdu chcete zveřejnit { name }?'
    ok: 'Zveřejnit'
    cancel: 'Zrušit'
  unpublish:
    title: 'Zrušit zveřejnění tábora'
    message: 'Opravdu chcete zrušit zveřejnění { name }?'
    ok: 'Zrušit'
    cancel: 'Zrušit'

header:
  columns: 'Sloupce'

value:
  open: 'Otevřená'
  upcoming: 'Nadcházející'
  closed: 'Uzavřená'
  public: 'Veřejný'
  private: 'Soukromý'
</i18n>
