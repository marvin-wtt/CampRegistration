<template>
  <page-state-handler :error>
    <div class="admin-page column no-wrap fit">
      <admin-list-toolbar
        v-model:search="search"
        :title="t('title')"
        :total="total"
        :loading
        :search-placeholder="t('search')"
        @refresh="reload"
      >
        <template #filters>
          <div class="col-12 col-sm-auto">
            <q-select
              v-model="status"
              :options="statusOptions"
              :label="t('column.status')"
              dense
              outlined
              rounded
              clearable
              emit-value
              map-options
              options-dense
              style="min-width: 180px"
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
        <template #body-cell-status="props">
          <q-td :props>
            <q-chip
              :color="statusColor(props.row.verificationStatus)"
              text-color="white"
              dense
              square
            >
              {{ t(`status.${props.row.verificationStatus}`) }}
            </q-chip>
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
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import AdminListToolbar from '@/components/administration/AdminListToolbar.vue';
import RowActions, {
  type RowAction,
} from '@/components/administration/RowActions.vue';
import OrganizationDetailsDialog from '@/components/organization/OrganizationDetailsDialog.vue';
import OrganizationReviewDialog, {
  type OrganizationReviewResult,
} from '@/components/organization/OrganizationReviewDialog.vue';
import SafeDeleteDialog from '@/components/common/dialogs/SafeDeleteDialog.vue';
import { useAPIService } from '@/services/APIService';
import { useServerTable } from '@/composables/serverTable';
import { useServiceNotifications } from '@/composables/serviceHandler';
import { useRouter } from 'vue-router';
import { countryName } from '@/utils/countries';
import type {
  Organization,
  OrganizationQuery,
  OrganizationVerificationStatus,
} from '@camp-registration/common/entities';

const { t, d, locale } = useI18n();
const quasar = useQuasar();
const router = useRouter();
const api = useAPIService();
const { withErrorNotification } = useServiceNotifications();

const status = ref<OrganizationVerificationStatus | null>(null);

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
} = useServerTable<Organization, OrganizationQuery>({
  storeName: 'organization',
  sortBy: 'submittedAt',
  descending: true,
  fetch: (query) => api.fetchOrganizationsPaginated(query),
  buildQuery: ({ cursor, limit, sortBy, sortType, search }) =>
    ({
      view: 'all',
      cursor,
      limit,
      sortBy,
      sortType,
      name: search || undefined,
      status: status.value ?? undefined,
    }) as OrganizationQuery,
  watchSources: [status],
});

// Clearing the select removes the filter entirely, matching the other admin
// tables — so there is no explicit "all" option.
const statusOptions = computed(() => [
  { label: t('status.PENDING'), value: 'PENDING' },
  { label: t('status.VERIFIED'), value: 'VERIFIED' },
  { label: t('status.REJECTED'), value: 'REJECTED' },
]);

const columns = computed<QTableColumn<Organization>[]>(() => [
  {
    name: 'name',
    label: t('column.name'),
    field: 'name',
    align: 'left',
    sortable: true,
  },
  {
    name: 'country',
    label: t('column.country'),
    field: (row) => countryName(row.country, locale.value),
    align: 'left',
  },
  {
    name: 'registrationNumber',
    label: t('column.registrationNumber'),
    field: (row) => row.registrationNumber ?? '—',
    align: 'left',
  },
  {
    name: 'status',
    label: t('column.status'),
    field: 'verificationStatus',
    align: 'left',
    sortable: true,
  },
  {
    name: 'submittedAt',
    label: t('column.submittedAt'),
    field: 'submittedAt',
    align: 'left',
    sortable: true,
    format: (val: string) => d(new Date(val), 'short'),
  },
  {
    name: 'action',
    label: t('column.action'),
    field: 'id',
    align: 'center',
    sortable: false,
  },
]);

function statusColor(status: OrganizationVerificationStatus): string {
  if (status === 'VERIFIED') return 'positive';
  if (status === 'REJECTED') return 'negative';
  return 'warning';
}

function actionsFor(organization: Organization): RowAction[] {
  return [
    {
      key: 'details',
      label: t('action.details'),
      icon: 'visibility',
      handler: () => showDetails(organization),
    },
    {
      key: 'review',
      // A decision is never final: the same dialog reopens on a decided
      // organization to reinstate a rejected one or revoke a verified one.
      label:
        organization.verificationStatus === 'PENDING'
          ? t('action.review')
          : t('action.changeDecision'),
      icon: 'rate_review',
      color: 'primary',
      handler: () => review(organization),
    },
    {
      key: 'open',
      label: t('action.open'),
      icon: 'open_in_new',
      handler: () => openOrganization(organization),
    },
    {
      key: 'delete',
      label: t('action.delete'),
      icon: 'delete',
      color: 'negative',
      separatorBefore: true,
      handler: () => {
        void onDelete(organization);
      },
    },
  ];
}

function openOrganization(organization: Organization) {
  const routeData = router.resolve({
    name: 'management.organization',
    params: {
      organizationId: organization.id,
    },
  });

  window.open(routeData.href, '_blank');
}

function showDetails(organization: Organization) {
  quasar.dialog({
    component: OrganizationDetailsDialog,
    componentProps: { organization },
  });
}

/**
 * Deletion is refused while the organization still owns events or newsletters —
 * their foreign keys are `Restrict`, so registrations can never be taken down
 * with it. Only the details response carries those counts, so they are fetched
 * up front: being told what blocks the deletion beats typing the name to
 * confirm and only then being refused.
 */
async function onDelete(organization: Organization) {
  const details = await withErrorNotification(
    'details',
    () => api.fetchOrganization(organization.id),
    { message: t('notify.detailsFailed') },
  );

  if (details === undefined) {
    return;
  }

  if (details.ownedEvents > 0 || details.ownedNewsletters > 0) {
    quasar.dialog({
      title: t('dialog.blocked.title'),
      message: t('dialog.blocked.message', {
        events: details.ownedEvents,
        newsletters: details.ownedNewsletters,
      }),
      ok: {
        label: t('dialog.blocked.ok'),
        color: 'primary',
        rounded: true,
      },
    });
    return;
  }

  quasar
    .dialog({
      component: SafeDeleteDialog,
      componentProps: {
        title: t('dialog.delete.title'),
        message: t('dialog.delete.message', { name: organization.name }),
        label: t('dialog.delete.label'),
        value: organization.name,
      },
    })
    .onOk(() => {
      void withProgressNotification('delete', () =>
        api.deleteOrganization(organization.id),
      ).then(
        () => reload(),
        // Already reported by the progress notification.
        () => undefined,
      );
    });
}

function review(organization: Organization) {
  quasar
    .dialog({
      component: OrganizationReviewDialog,
      componentProps: { organization },
    })
    .onOk((decision: OrganizationReviewResult) => {
      void (async () => {
        // The decision can legitimately be refused — an organization cannot be
        // verified before its privacy notice is published, which is the state of
        // every fresh submission. Without this the dialog just closes.
        const result = await withErrorNotification(
          'review',
          () => api.reviewOrganization(organization.id, decision),
          { message: t('notify.reviewFailed') },
        );

        if (result !== undefined) {
          reload();
        }
      })();
    });
}
</script>

<i18n lang="yaml" locale="en">
title: 'Organizations'
search: 'Search by name'
status:
  PENDING: 'Awaiting review'
  VERIFIED: 'Verified'
  REJECTED: 'Rejected'
column:
  name: 'Name'
  country: 'Country'
  registrationNumber: 'Registration number'
  status: 'Status'
  submittedAt: 'Submitted'
  action: 'Actions'
action:
  details: 'Details'
  open: 'Open organization'
  review: 'Review'
  changeDecision: 'Change decision'
  delete: 'Delete'
dialog:
  delete:
    title: 'Delete Organization'
    message: 'You are about to delete "{ name }".
      Its members and pending invitations are removed with it.
      This action cannot be undone.'
    label: 'Organization Name'
  blocked:
    title: 'Organization Not Empty'
    message:
      'This organization still owns { events } event(s) and { newsletters } newsletter(s).
      Move or delete them before deleting the organization.'
    ok: 'Close'
notify:
  reviewFailed: 'The decision could not be saved'
  detailsFailed: 'The organization could not be loaded'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Organisationen'
search: 'Nach Name suchen'
status:
  PENDING: 'Wartet auf Prüfung'
  VERIFIED: 'Verifiziert'
  REJECTED: 'Abgelehnt'
column:
  name: 'Name'
  country: 'Land'
  registrationNumber: 'Registernummer'
  status: 'Status'
  submittedAt: 'Eingereicht'
  action: 'Aktionen'
action:
  details: 'Details'
  open: 'Organisation öffnen'
  review: 'Prüfen'
  changeDecision: 'Entscheidung ändern'
  delete: 'Löschen'
dialog:
  delete:
    title: 'Organisation löschen'
    message: 'Du bist dabei, "{ name }" zu löschen.
      Mitglieder und offene Einladungen werden mit gelöscht.
      Diese Aktion kann nicht rückgängig gemacht werden.'
    label: 'Name der Organisation'
  blocked:
    title: 'Organisation ist nicht leer'
    message:
      'Diese Organisation besitzt noch { events } Veranstaltung(s) und { newsletters } Newsletter.
      Verschiebe oder lösche sie, bevor du die Organisation löschst.'
    ok: 'Schließen'
notify:
  reviewFailed: 'Die Entscheidung konnte nicht gespeichert werden'
  detailsFailed: 'Die Organisation konnte nicht geladen werden'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Organisations'
search: 'Rechercher par nom'
status:
  PENDING: 'En attente de contrôle'
  VERIFIED: 'Vérifiée'
  REJECTED: 'Refusée'
column:
  name: 'Nom'
  country: 'Pays'
  registrationNumber: "Numéro d'enregistrement"
  status: 'Statut'
  submittedAt: 'Soumise'
  action: 'Actions'
action:
  details: 'Détails'
  open: "Ouvrir l'organisation"
  review: 'Contrôler'
  changeDecision: 'Modifier la décision'
  delete: 'Supprimer'
dialog:
  delete:
    title: "Supprimer l'organisation"
    message: 'Vous êtes sur le point de supprimer "{ name }".
      Ses membres et ses invitations en attente seront supprimés avec elle.
      Cette action est irréversible.'
    label: "Nom de l'organisation"
  blocked:
    title: "L'organisation n'est pas vide"
    message:
      "Cette organisation possède encore { events } événement(s) et { newsletters } newsletter(s).
      Déplacez-les ou supprimez-les avant de supprimer l'organisation."
    ok: 'Fermer'
notify:
  reviewFailed: "La décision n'a pas pu être enregistrée"
  detailsFailed: "L'organisation n'a pas pu être chargée"
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Organizacje'
search: 'Szukaj po nazwie'
status:
  PENDING: 'Oczekuje na sprawdzenie'
  VERIFIED: 'Zweryfikowana'
  REJECTED: 'Odrzucona'
column:
  name: 'Nazwa'
  country: 'Kraj'
  registrationNumber: 'Numer rejestrowy'
  status: 'Status'
  submittedAt: 'Zgłoszono'
  action: 'Akcje'
action:
  details: 'Szczegóły'
  open: 'Otwórz organizację'
  review: 'Sprawdź'
  changeDecision: 'Zmień decyzję'
  delete: 'Usuń'
dialog:
  delete:
    title: 'Usuń organizację'
    message: 'Zamierzasz usunąć "{ name }".
      Jej członkowie i oczekujące zaproszenia zostaną usunięci razem z nią.
      Tej operacji nie można cofnąć.'
    label: 'Nazwa organizacji'
  blocked:
    title: 'Organizacja nie jest pusta'
    message:
      'Ta organizacja nadal posiada wydarzenia ({ events }) i newslettery ({ newsletters }).
      Przenieś je lub usuń przed usunięciem organizacji.'
    ok: 'Zamknij'
notify:
  reviewFailed: 'Nie udało się zapisać decyzji'
  detailsFailed: 'Nie udało się wczytać organizacji'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Organizace'
search: 'Hledat podle názvu'
status:
  PENDING: 'Čeká na kontrolu'
  VERIFIED: 'Ověřená'
  REJECTED: 'Zamítnutá'
column:
  name: 'Název'
  country: 'Země'
  registrationNumber: 'Registrační číslo'
  status: 'Stav'
  submittedAt: 'Odesláno'
  action: 'Akce'
action:
  details: 'Detaily'
  open: 'Otevřít organizaci'
  review: 'Zkontrolovat'
  changeDecision: 'Změnit rozhodnutí'
  delete: 'Smazat'
dialog:
  delete:
    title: 'Smazat organizaci'
    message: 'Chystáte se smazat "{ name }".
      Její členové a čekající pozvánky budou smazány spolu s ní.
      Tuto akci nelze vrátit zpět.'
    label: 'Název organizace'
  blocked:
    title: 'Organizace není prázdná'
    message:
      'Tato organizace stále vlastní akce ({ events }) a newslettery ({ newsletters }).
      Než organizaci smažete, přesuňte je nebo smažte.'
    ok: 'Zavřít'
notify:
  reviewFailed: 'Rozhodnutí se nepodařilo uložit'
  detailsFailed: 'Organizaci se nepodařilo načíst'
</i18n>
