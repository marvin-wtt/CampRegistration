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
import OrganizationReviewDialog from '@/components/organization/OrganizationReviewDialog.vue';
import { useAPIService } from '@/services/APIService';
import { useServerTable } from '@/composables/serverTable';
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
  const actions: RowAction[] = [
    {
      key: 'details',
      label: t('action.details'),
      icon: 'visibility',
      handler: () => showDetails(organization),
    },
    {
      key: 'open',
      label: t('action.open'),
      icon: 'open_in_new',
      handler: () => openOrganization(organization),
    },
  ];

  // A decision can be revisited at any time: verify a rejected organization,
  // or revoke one that should no longer be trusted.
  if (organization.verificationStatus !== 'VERIFIED') {
    actions.push({
      key: 'approve',
      label:
        organization.verificationStatus === 'PENDING'
          ? t('action.approve')
          : t('action.reinstate'),
      icon: 'check',
      color: 'positive',
      handler: () => review(organization, 'VERIFIED'),
    });
  }

  if (organization.verificationStatus !== 'REJECTED') {
    actions.push({
      key: 'reject',
      label:
        organization.verificationStatus === 'PENDING'
          ? t('action.reject')
          : t('action.revoke'),
      icon: organization.verificationStatus === 'PENDING' ? 'close' : 'block',
      color: 'negative',
      handler: () => review(organization, 'REJECTED'),
    });
  }

  return actions;
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

function review(organization: Organization, decision: 'VERIFIED' | 'REJECTED') {
  quasar
    .dialog({
      component: OrganizationReviewDialog,
      componentProps: { organization, decision },
    })
    .onOk((reviewNote: string | null) => {
      void (async () => {
        await api.reviewOrganization(organization.id, {
          status: decision,
          reviewNote,
        });
        reload();
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
  approve: 'Approve'
  reject: 'Reject'
  reinstate: 'Reinstate'
  revoke: 'Revoke verification'
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
  approve: 'Genehmigen'
  reject: 'Ablehnen'
  reinstate: 'Freigeben'
  revoke: 'Verifizierung entziehen'
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
  approve: 'Approuver'
  reject: 'Refuser'
  reinstate: 'Réintégrer'
  revoke: 'Retirer la vérification'
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
  approve: 'Zatwierdź'
  reject: 'Odrzuć'
  reinstate: 'Przywróć'
  revoke: 'Cofnij weryfikację'
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
  approve: 'Schválit'
  reject: 'Zamítnout'
  reinstate: 'Obnovit'
  revoke: 'Odebrat ověření'
</i18n>
