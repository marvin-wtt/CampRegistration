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
          <div class="col-6 col-sm-auto">
            <q-select
              v-model="scopeFilter"
              :options="scopeOptions"
              :label="t('column.resource')"
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
          <div class="col-6 col-sm-auto">
            <q-select
              v-model="statusFilter"
              :options="statusOptions"
              :label="t('column.status')"
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
        class="admin-table col rounded-borders"
        @virtual-scroll="onVirtualScroll"
      >
        <template #body-cell-administrator="props">
          <q-td :props="props">
            <div>{{ props.row.user.name }}</div>
            <div class="text-caption text-on-surface-variant">
              {{ props.row.user.email }}
            </div>
          </q-td>
        </template>

        <template #body-cell-resource="props">
          <q-td :props="props">
            <div class="row items-center no-wrap q-gutter-x-sm">
              <q-icon
                :name="SCOPE_ICONS[props.row.scope as PermissionScope]"
                size="xs"
              >
                <q-tooltip>{{ t(`scope.${props.row.scope}`) }}</q-tooltip>
              </q-icon>
              <span v-if="props.row.subjectName !== null">
                {{ to(props.row.subjectName) }}
              </span>
              <span
                v-else
                class="text-on-surface-variant"
              >
                {{ t('deleted') }}
              </span>
            </div>
          </q-td>
        </template>

        <template #body-cell-reason="props">
          <q-td
            :props="props"
            class="reason-cell"
          >
            {{ props.value }}
            <q-tooltip max-width="400px">{{ props.value }}</q-tooltip>
          </q-td>
        </template>

        <template #body-cell-status="props">
          <q-td :props="props">
            <q-chip
              :color="isActive(props.row) ? 'primary' : undefined"
              :text-color="isActive(props.row) ? 'on-primary' : undefined"
              dense
              square
              class="q-ml-none"
            >
              {{ statusLabel(props.row) }}
            </q-chip>
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
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { QTableColumn } from 'quasar';
import type { RouteLocationRaw } from 'vue-router';
import type {
  AdminAccessGrantQuery,
  AdminAccessGrantReview,
} from '@camp-registration/common/entities';
import type { PermissionScope } from '@camp-registration/common/permissions';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import AdminListToolbar from '@/components/administration/AdminListToolbar.vue';
import RowActions, {
  type RowAction,
} from '@/components/administration/RowActions.vue';
import { useAPIService } from '@/services/APIService';
import { useServerTable } from '@/composables/serverTable';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { isoToLocalDate } from '@/utils/date';
import { useRouter } from 'vue-router';

const SCOPE_ICONS: Record<PermissionScope, string> = {
  event: 'home',
  newsletter: 'mail',
  organization: 'apartment',
};

const { t, locale } = useI18n();
const { to } = useObjectTranslation();
const router = useRouter();
const api = useAPIService();

const scopeFilter = ref<PermissionScope | null>(null);
const statusFilter = ref<'active' | 'ended' | null>(null);

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
} = useServerTable<AdminAccessGrantReview, AdminAccessGrantQuery>({
  watchSources: [scopeFilter, statusFilter],
  fetch: (query) => api.fetchAdminAccessGrants(query),
  buildQuery: ({ cursor, limit, search }) =>
    ({
      cursor,
      limit,
      search: search || undefined,
      scope: scopeFilter.value ?? undefined,
      active: statusFilter.value ? statusFilter.value === 'active' : undefined,
    }) as AdminAccessGrantQuery,
});

const scopeOptions = computed(() =>
  (['event', 'newsletter', 'organization'] as const).map((scope) => ({
    label: t(`scope.${scope}`),
    value: scope,
  })),
);

const statusOptions = computed(() => [
  { label: t('status.active'), value: 'active' },
  { label: t('status.ended'), value: 'ended' },
]);

const columns = computed<QTableColumn<AdminAccessGrantReview>[]>(() => [
  {
    name: 'administrator',
    label: t('column.administrator'),
    field: (row) => row.user.name,
    align: 'left',
  },
  {
    name: 'resource',
    label: t('column.resource'),
    field: 'scopeId',
    align: 'left',
  },
  {
    name: 'reason',
    label: t('column.reason'),
    field: 'reason',
    align: 'left',
  },
  {
    name: 'createdAt',
    label: t('column.createdAt'),
    field: 'createdAt',
    align: 'left',
    format: (val: string) => formatDateTime(val),
  },
  {
    name: 'status',
    label: t('column.status'),
    field: 'id',
    align: 'left',
  },
  {
    name: 'action',
    label: t('column.action'),
    field: 'id',
    align: 'center',
  },
]);

function endOf(grant: AdminAccessGrantReview): string {
  return grant.endedAt ?? grant.expiresAt;
}

function isActive(grant: AdminAccessGrantReview): boolean {
  return grant.endedAt === null && new Date(grant.expiresAt) > new Date();
}

function statusLabel(grant: AdminAccessGrantReview): string {
  if (isActive(grant)) {
    return t('status.activeUntil', { time: formatTime(grant.expiresAt) });
  }

  return grant.endedAt
    ? t('status.endedEarly', { time: formatDateTime(grant.endedAt) })
    : t('status.expired', { time: formatDateTime(grant.expiresAt) });
}

function resourceRoute(grant: AdminAccessGrantReview): RouteLocationRaw {
  switch (grant.scope) {
    case 'event':
      return { name: 'management.event', params: { eventId: grant.scopeId } };
    case 'newsletter':
      return {
        name: 'management.newsletter',
        params: { newsletterId: grant.scopeId },
      };
    case 'organization':
      return {
        name: 'management.organization',
        params: { organizationId: grant.scopeId },
      };
  }
}

function rowActionsFn(grant: AdminAccessGrantReview): RowAction[] {
  if (grant.subjectName === null) {
    return [];
  }

  const actions: RowAction[] = [
    {
      key: 'open',
      label: t('action.open'),
      icon: 'open_in_new',
      handler: () => openInNewTab(resourceRoute(grant)),
    },
  ];

  // Only events keep an audit log; it shows what changed during the grant.
  if (grant.scope === 'event') {
    actions.push({
      key: 'changes',
      label: t('action.changes'),
      icon: 'history',
      handler: () =>
        openInNewTab({
          name: 'management.event.settings.audit',
          params: { eventId: grant.scopeId },
          query: {
            actorId: grant.user.id,
            from: isoToLocalDate(grant.createdAt),
            to: isoToLocalDate(endOf(grant)),
          },
        }),
    });
  }

  return actions;
}

function openInNewTab(route: RouteLocationRaw) {
  window.open(router.resolve(route).href, '_blank');
}

function formatDateTime(dateTime: string): string {
  return new Intl.DateTimeFormat(locale.value, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateTime));
}

function formatTime(dateTime: string): string {
  return new Intl.DateTimeFormat(locale.value, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateTime));
}
</script>

<style scoped>
.reason-cell {
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

<i18n lang="yaml" locale="en">
title: 'Administrator access'
search: 'Search administrator or reason'
deleted: 'Deleted'
scope:
  event: 'Event'
  newsletter: 'Newsletter'
  organization: 'Organization'
status:
  active: 'Active'
  ended: 'Ended'
  activeUntil: 'Active until {time}'
  endedEarly: 'Ended {time}'
  expired: 'Expired {time}'
action:
  open: 'Open'
  changes: 'Show changes'
column:
  administrator: 'Administrator'
  resource: 'Resource'
  reason: 'Reason'
  createdAt: 'Started'
  status: 'Status'
  action: 'Actions'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Administratorzugriff'
search: 'Administrator oder Grund suchen'
deleted: 'Gelöscht'
scope:
  event: 'Veranstaltung'
  newsletter: 'Newsletter'
  organization: 'Organisation'
status:
  active: 'Aktiv'
  ended: 'Beendet'
  activeUntil: 'Aktiv bis {time}'
  endedEarly: 'Beendet {time}'
  expired: 'Abgelaufen {time}'
action:
  open: 'Öffnen'
  changes: 'Änderungen anzeigen'
column:
  administrator: 'Administrator'
  resource: 'Ressource'
  reason: 'Grund'
  createdAt: 'Begonnen'
  status: 'Status'
  action: 'Aktionen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Accès administrateur'
search: 'Rechercher un administrateur ou un motif'
deleted: 'Supprimé'
scope:
  event: 'Événement'
  newsletter: 'Newsletter'
  organization: 'Organisation'
status:
  active: 'Actif'
  ended: 'Terminé'
  activeUntil: "Actif jusqu'à {time}"
  endedEarly: 'Terminé le {time}'
  expired: 'Expiré le {time}'
action:
  open: 'Ouvrir'
  changes: 'Afficher les modifications'
column:
  administrator: 'Administrateur'
  resource: 'Ressource'
  reason: 'Motif'
  createdAt: 'Début'
  status: 'Statut'
  action: 'Actions'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Dostęp administratora'
search: 'Szukaj administratora lub powodu'
deleted: 'Usunięto'
scope:
  event: 'Wydarzenie'
  newsletter: 'Newsletter'
  organization: 'Organizacja'
status:
  active: 'Aktywny'
  ended: 'Zakończony'
  activeUntil: 'Aktywny do {time}'
  endedEarly: 'Zakończony {time}'
  expired: 'Wygasł {time}'
action:
  open: 'Otwórz'
  changes: 'Pokaż zmiany'
column:
  administrator: 'Administrator'
  resource: 'Zasób'
  reason: 'Powód'
  createdAt: 'Rozpoczęto'
  status: 'Status'
  action: 'Akcje'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Přístup administrátora'
search: 'Hledat administrátora nebo důvod'
deleted: 'Smazáno'
scope:
  event: 'Akce'
  newsletter: 'Newsletter'
  organization: 'Organizace'
status:
  active: 'Aktivní'
  ended: 'Ukončeno'
  activeUntil: 'Aktivní do {time}'
  endedEarly: 'Ukončeno {time}'
  expired: 'Vypršelo {time}'
action:
  open: 'Otevřít'
  changes: 'Zobrazit změny'
column:
  administrator: 'Administrátor'
  resource: 'Zdroj'
  reason: 'Důvod'
  createdAt: 'Zahájeno'
  status: 'Stav'
  action: 'Akce'
</i18n>
