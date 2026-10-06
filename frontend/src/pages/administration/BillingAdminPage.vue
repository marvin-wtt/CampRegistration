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
        <template #actions>
          <q-btn
            :label="t('action.overview')"
            :to="{ name: 'administration.billing.overview' }"
            icon="calendar_month"
            color="primary"
            flat
            rounded
            no-caps
          />
          <q-btn
            :label="t('action.priceModels')"
            :to="{ name: 'administration.price-models' }"
            icon="sell"
            color="primary"
            flat
            rounded
            no-caps
          />
        </template>
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
              style="min-width: 160px"
            />
          </div>
          <div
            v-if="month"
            class="col-12 col-sm-auto row items-center"
          >
            <q-chip
              :label="t('filter.month', { month: formatMonth(month) })"
              icon="calendar_month"
              removable
              @remove="month = null"
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
        <template #body-cell-event="props">
          <q-td :props>
            <div>{{ to(props.row.eventName) }}</div>
            <div class="text-caption text-on-surface-variant">
              {{ formatPeriod(props.row) }}
            </div>
          </q-td>
        </template>

        <template #body-cell-registrationCount="props">
          <q-td :props>
            <div>
              {{ props.row.registrationCount }}
              <q-icon
                v-if="props.row.adjustedRegistrationCount !== null"
                name="edit"
                size="xs"
                class="text-on-surface-variant"
              >
                <q-tooltip>{{ t('corrected') }}</q-tooltip>
              </q-icon>
            </div>
            <div class="text-caption text-on-surface-variant">
              {{
                t('counts', {
                  start: props.row.startRegistrationCount,
                  end: props.row.endRegistrationCount ?? '—',
                })
              }}
            </div>
          </q-td>
        </template>

        <template #body-cell-grossAmount="props">
          <q-td
            :props
            :class="{
              'text-strike text-on-surface-variant':
                props.row.status === 'VOID',
            }"
          >
            {{ props.value }}
          </q-td>
        </template>

        <template #body-cell-status="props">
          <q-td :props>
            <event-bill-status-chip :status="props.row.status" />
            <q-chip
              v-if="props.row.replacedByBillId"
              :label="t('replaced')"
              icon="autorenew"
              dense
              square
              outline
            />
            <q-chip
              v-if="props.row.replacesBillId"
              :label="t('replacement')"
              icon="autorenew"
              dense
              square
              outline
            />
            <q-icon
              v-if="props.row.note"
              name="notes"
              class="q-ml-xs text-on-surface-variant"
            >
              <q-tooltip>{{ props.row.note }}</q-tooltip>
            </q-icon>
          </q-td>
        </template>

        <template #body-cell-invoices="props">
          <q-td :props>
            <bill-invoices-cell
              :bill="props.row"
              @changed="reload"
            />
          </q-td>
        </template>

        <template #body-cell-action="props">
          <q-td
            :props
            auto-width
          >
            <bill-row-actions
              :bill="props.row"
              @changed="reload"
            />
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
import type {
  AdminEventBill,
  EventBillQuery,
  EventBillStatus,
} from '@camp-registration/common/entities';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import AdminListToolbar from '@/components/administration/AdminListToolbar.vue';
import EventBillStatusChip from '@/components/billing/EventBillStatusChip.vue';
import BillInvoicesCell from '@/components/billing/BillInvoicesCell.vue';
import BillRowActions from '@/components/billing/BillRowActions.vue';
import { useAPIService } from '@/services/APIService';
import { useServerTable } from '@/composables/serverTable';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { formatMoney } from '@/utils/money';
import { billedTo, formatBillPeriod } from '@/utils/billing';
import { useRouteQueryParams } from '@/composables/useRouteQueryParams';

const { t, d, locale } = useI18n();
const { to } = useObjectTranslation();
const api = useAPIService();

const routeQuery = useRouteQueryParams();

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const initialMonth = routeQuery.getStringQueryParam('month');
const month = ref<string | null>(
  initialMonth && MONTH_PATTERN.test(initialMonth) ? initialMonth : null,
);

const status = ref<EventBillStatus | null>(
  routeQuery.getEnumQueryParam<EventBillStatus>('status', [
    'DRAFT',
    'OPEN',
    'PAID',
    'VOID',
  ]),
);

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
} = useServerTable<AdminEventBill, EventBillQuery>({
  storeName: 'billing',
  fetch: (query) => api.fetchBillsPaginated(query),
  buildQuery: ({ cursor, limit, search }) =>
    ({
      cursor,
      limit,
      search: search || undefined,
      status: status.value ?? undefined,
      month: month.value ?? undefined,
    }) as EventBillQuery,
  watchSources: [status, month],
});

const statusOptions = computed(() =>
  (['DRAFT', 'OPEN', 'PAID', 'VOID'] as const).map((value) => ({
    label: t(`status.${value}`),
    value,
  })),
);

const columns = computed<QTableColumn<AdminEventBill>[]>(() => [
  {
    name: 'event',
    label: t('column.event'),
    field: 'eventName',
    align: 'left',
  },
  {
    name: 'organization',
    label: t('column.organization'),
    field: (row) => billedTo(row),
    align: 'left',
  },
  {
    name: 'registrationCount',
    label: t('column.registrationCount'),
    field: 'registrationCount',
    align: 'right',
  },
  {
    name: 'grossAmount',
    label: t('column.grossAmount'),
    field: (row) => formatMoney(row.grossAmount, row.currency, locale.value),
    align: 'right',
  },
  {
    name: 'status',
    label: t('column.status'),
    field: 'status',
    align: 'left',
  },
  {
    name: 'invoices',
    label: t('column.invoices'),
    field: (row) => row.invoices.length,
    align: 'left',
  },
  {
    name: 'finalizedAt',
    label: t('column.finalizedAt'),
    field: 'finalizedAt',
    align: 'left',
    format: (value: string | null) =>
      value ? d(new Date(value), 'short') : '—',
  },
  {
    name: 'action',
    label: t('column.action'),
    field: 'id',
    align: 'center',
  },
]);

function formatMonth(value: string): string {
  const [year = 0, monthNumber = 1] = value.split('-').map(Number);

  return new Intl.DateTimeFormat(locale.value, {
    year: 'numeric',
    month: '2-digit',
  }).format(new Date(year, monthNumber - 1, 1));
}

function formatPeriod(bill: AdminEventBill): string {
  return formatBillPeriod(bill, locale.value);
}
</script>

<i18n lang="yaml" locale="en">
filter:
  month: 'Billed in {month}'
title: 'Bills'
search: 'Search by organization'
counts: 'Start {start} · End {end}'
corrected: 'Corrected by an administrator'
replaced: 'Replaced'
replacement: 'Replacement'
status:
  DRAFT: 'Running'
  OPEN: 'Open'
  PAID: 'Paid'
  VOID: 'Void'
column:
  event: 'Event'
  organization: 'Organization'
  registrationCount: 'Registrations'
  grossAmount: 'Total'
  status: 'Status'
  invoices: 'Invoices'
  finalizedAt: 'Billed'
  action: 'Actions'
action:
  overview: 'Monthly overview'
  priceModels: 'Price models'
</i18n>

<i18n lang="yaml" locale="de">
filter:
  month: 'Abgerechnet im {month}'
title: 'Rechnungen'
search: 'Nach Organisation suchen'
counts: 'Beginn {start} · Ende {end}'
corrected: 'Von der Administration korrigiert'
replaced: 'Ersetzt'
replacement: 'Ersatz'
status:
  DRAFT: 'Laufend'
  OPEN: 'Offen'
  PAID: 'Bezahlt'
  VOID: 'Storniert'
column:
  event: 'Veranstaltung'
  organization: 'Organisation'
  registrationCount: 'Anmeldungen'
  grossAmount: 'Gesamt'
  status: 'Status'
  invoices: 'Rechnungen'
  finalizedAt: 'Abgerechnet'
  action: 'Aktionen'
action:
  overview: 'Monatsübersicht'
  priceModels: 'Preismodelle'
</i18n>

<i18n lang="yaml" locale="fr">
filter:
  month: 'Facturé en {month}'
title: 'Factures'
search: 'Rechercher par organisation'
counts: 'Début {start} · Fin {end}'
corrected: 'Corrigé par un administrateur'
replaced: 'Remplacée'
replacement: 'Remplacement'
status:
  DRAFT: 'En cours'
  OPEN: 'Ouverte'
  PAID: 'Payée'
  VOID: 'Annulée'
column:
  event: 'Événement'
  organization: 'Organisation'
  registrationCount: 'Inscriptions'
  grossAmount: 'Total'
  status: 'Statut'
  invoices: 'Factures'
  finalizedAt: 'Facturée'
  action: 'Actions'
action:
  overview: 'Aperçu mensuel'
  priceModels: 'Modèles tarifaires'
</i18n>

<i18n lang="yaml" locale="pl">
filter:
  month: 'Zafakturowano w {month}'
title: 'Rachunki'
search: 'Szukaj po organizacji'
counts: 'Początek {start} · Koniec {end}'
corrected: 'Poprawione przez administratora'
replaced: 'Zastąpiony'
replacement: 'Zastępczy'
status:
  DRAFT: 'W toku'
  OPEN: 'Otwarty'
  PAID: 'Opłacony'
  VOID: 'Anulowany'
column:
  event: 'Wydarzenie'
  organization: 'Organizacja'
  registrationCount: 'Zgłoszenia'
  grossAmount: 'Razem'
  status: 'Status'
  invoices: 'Faktury'
  finalizedAt: 'Rozliczono'
  action: 'Akcje'
action:
  overview: 'Przegląd miesięczny'
  priceModels: 'Modele cenowe'
</i18n>

<i18n lang="yaml" locale="cs">
filter:
  month: 'Vyúčtováno v {month}'
title: 'Faktury'
search: 'Hledat podle organizace'
counts: 'Začátek {start} · Konec {end}'
corrected: 'Opraveno administrátorem'
replaced: 'Nahrazená'
replacement: 'Náhradní'
status:
  DRAFT: 'Probíhá'
  OPEN: 'Otevřená'
  PAID: 'Zaplacená'
  VOID: 'Stornovaná'
column:
  event: 'Akce'
  organization: 'Organizace'
  registrationCount: 'Přihlášky'
  grossAmount: 'Celkem'
  status: 'Stav'
  invoices: 'Faktury'
  finalizedAt: 'Vyúčtováno'
  action: 'Akce'
action:
  overview: 'Měsíční přehled'
  priceModels: 'Cenové modely'
</i18n>
