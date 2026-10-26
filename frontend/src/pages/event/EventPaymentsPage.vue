<template>
  <q-page>
    <div class="ledger-view column no-wrap absolute fit">
      <!-- Header, as on the participants page -->
      <div class="row items-center justify-between no-wrap">
        <div class="col header-text">
          <div class="row items-center no-wrap q-gutter-x-sm">
            <div class="text-h5 text-weight-medium ellipsis">
              {{ t('title') }}
            </div>
            <q-badge
              v-if="!loading"
              rounded
              class="count-badge"
              :label="rows.length"
            />
          </div>
          <div class="text-body2 text-grey-6 q-mt-xs gt-xs">
            {{ t('subtitle') }}
          </div>
        </div>
        <div class="col-auto">
          <m-btn
            :label="quasar.screen.xs ? undefined : t('export')"
            :aria-label="t('export')"
            color="primary"
            icon="download"
            text
            :round="quasar.screen.xs"
            :disable="rows.length === 0"
            data-test="ledger-export"
            @click="exportCsv"
          />
        </div>
      </div>

      <!-- The totals at a glance -->
      <div class="ledger-totals">
        <div
          v-for="total in totalTiles"
          :key="total.key"
          class="tile"
          :data-test="`ledger-total-${total.key}`"
        >
          <div class="tile-label">{{ total.label }}</div>
          <q-skeleton
            v-if="loading"
            type="text"
            width="5rem"
            class="tile-value"
          />
          <div
            v-else
            class="tile-value"
          >
            {{ money(total.value) }}
          </div>
        </div>
      </div>

      <div class="toolbar-row row items-center">
        <q-btn
          class="filter-chip"
          :class="{ 'filter-chip--active': showAttempts }"
          :icon="showAttempts ? 'check' : undefined"
          :label="t('showAttempts')"
          no-caps
          unelevated
          data-test="ledger-show-attempts"
          @click="showAttempts = !showAttempts"
        />
      </div>

      <q-card
        flat
        bordered
        class="table-card col"
      >
        <q-table
          :rows
          :columns
          :visible-columns="visibleColumns"
          :loading
          row-key="id"
          flat
          :pagination="{ rowsPerPage: 0, sortBy: 'date', descending: true }"
          hide-pagination
          :hide-no-data="loading"
          class="ledger-table absolute fit"
          data-test="ledger-table"
        >
          <template #body="row">
            <q-tr
              :props="row"
              :class="{ 'ledger-row--attempt': !row.row.paid }"
            >
              <q-td
                v-for="col in row.cols"
                :key="col.name"
                :props="row"
              >
                <template v-if="col.name === 'payer'">
                  <span>{{ col.value }}</span>
                  <span
                    v-if="row.row.deleted"
                    class="deleted-tag"
                  >
                    {{ t('deleted') }}
                  </span>
                </template>
                <template v-else>{{ col.value }}</template>
              </q-td>
            </q-tr>
          </template>
          <template
            v-if="loading"
            #top-row
          >
            <q-tr
              v-for="n in 8"
              :key="n"
            >
              <q-td
                v-for="name in visibleColumns"
                :key="name"
              >
                <q-skeleton type="text" />
              </q-td>
            </q-tr>
          </template>
          <template #no-data>
            <div class="full-width text-center text-on-surface-variant q-pa-lg">
              {{ t('empty') }}
            </div>
          </template>
        </q-table>
      </q-card>
    </div>
  </q-page>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { exportFile, type QTableColumn, useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import type { Payment } from '@camp-registration/common/entities';
import {
  currencyFractionDigits,
  formatMoney,
  fromMinorUnits,
} from '@camp-registration/common/utils';
import { useAPIService } from '@/services/APIService';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { useRegistrationsStore } from '@/stores/registration-store';
import { csvSeparatorForLocale, toCsv } from '@/utils/csv';
import { useRegistrationHelper } from '@/composables/registrationHelper';

const { t, d, locale } = useI18n();
const quasar = useQuasar();
const api = useAPIService();
const { data: event } = storeToRefs(useEventDetailsStore());
const registrationsStore = useRegistrationsStore();
const helper = useRegistrationHelper();
const { data: registrations } = storeToRefs(registrationsStore);

const payments = ref<Payment[]>([]);
// Until the event is known there is nothing to fetch yet, but the page is
// still loading; payer names wait for the registrations.
const fetching = ref(true);
const loading = computed<boolean>(
  () => fetching.value || registrationsStore.isLoading,
);
// Failed, canceled and expired checkouts moved no money.
const showAttempts = ref(false);

async function load(): Promise<void> {
  const eventId = event.value?.id;
  if (!eventId) {
    return;
  }
  fetching.value = true;
  try {
    payments.value = await api.fetchEventPayments(eventId);
  } finally {
    fetching.value = false;
  }
}

void registrationsStore.fetchData();
watch(() => event.value?.id, load, { immediate: true });

interface LedgerRow {
  id: string;
  // Moved money; failed, canceled and expired attempts did not.
  paid: boolean;
  date: string;
  payer: string;
  deleted: boolean;
  method: string;
  status: string;
  amount: number;
  refunded: number;
  net: number;
  settlement: string;
}

function payerOf(payment: Payment): string {
  if (payment.payerName) {
    return payment.payerName;
  }
  const registration = registrations.value?.find(
    (entry) => entry.id === payment.registrationId,
  );
  return (registration && helper.fullName(registration)) ?? '—';
}

const rows = computed<LedgerRow[]>(() =>
  payments.value
    .filter((payment) => showAttempts.value || payment.status === 'PAID')
    .map((payment) => {
      const paid = payment.status === 'PAID';
      return {
        id: payment.id,
        paid,
        date: payment.paidAt ?? payment.createdAt,
        payer: payerOf(payment),
        deleted: payment.registrationId === null,
        method:
          payment.source === 'manual' && payment.method
            ? t(`method.${payment.method}`)
            : t(`source.${payment.source}`),
        status: t(`status.${payment.status}`),
        amount: paid ? payment.amount : 0,
        refunded: payment.amountRefunded,
        net: paid ? payment.amount - payment.amountRefunded : 0,
        settlement: payment.settlement
          ? t(`settlement.${payment.settlement}`)
          : '',
      };
    }),
);

const totals = computed(() =>
  rows.value.reduce(
    (sum, row) => ({
      amount: sum.amount + row.amount,
      refunded: sum.refunded + row.refunded,
      net: sum.net + row.net,
    }),
    { amount: 0, refunded: 0, net: 0 },
  ),
);

const currency = computed(() => event.value?.currency ?? 'EUR');

function money(minor: number): string {
  return formatMoney(minor, currency.value, locale.value);
}

const columns = computed<QTableColumn<LedgerRow>[]>(() => [
  {
    name: 'date',
    label: t('column.date'),
    field: 'date',
    align: 'left',
    sortable: true,
    format: (value: string) => d(value, 'date'),
  },
  {
    name: 'payer',
    label: t('column.payer'),
    field: 'payer',
    align: 'left',
    sortable: true,
  },
  { name: 'method', label: t('column.method'), field: 'method', align: 'left' },
  { name: 'status', label: t('column.status'), field: 'status', align: 'left' },
  {
    name: 'amount',
    label: t('column.amount'),
    field: 'amount',
    align: 'right',
    sortable: true,
    format: money,
  },
  {
    name: 'refunded',
    label: t('column.refunded'),
    field: 'refunded',
    align: 'right',
    sortable: true,
    format: money,
  },
  {
    name: 'net',
    label: t('column.net'),
    field: 'net',
    align: 'right',
    sortable: true,
    format: money,
  },
  {
    name: 'settlement',
    label: t('column.settlement'),
    field: 'settlement',
    align: 'left',
  },
]);

const totalTiles = computed(() => [
  { key: 'received', label: t('kpi.received'), value: totals.value.amount },
  { key: 'refunded', label: t('kpi.refunded'), value: totals.value.refunded },
  { key: 'net', label: t('kpi.net'), value: totals.value.net },
]);

// Phones keep who, when and how much.
const visibleColumns = computed<string[]>(() =>
  columns.value
    .map((column) => column.name)
    .filter(
      (name) =>
        !quasar.screen.xs || !['method', 'settlement', 'status'].includes(name),
    ),
);

// Plain decimals, so spreadsheets can sum them.
function exportCsv(): void {
  const digits = currencyFractionDigits(currency.value);
  const amount = (minor: number) =>
    fromMinorUnits(minor, currency.value).toFixed(digits);

  const csv = toCsv(
    columns.value.map((column) => column.label),
    rows.value.map((row) => [
      row.date.slice(0, 10),
      row.deleted ? `${row.payer} (${t('deleted')})` : row.payer,
      row.method,
      row.status,
      amount(row.amount),
      amount(row.refunded),
      amount(row.net),
      row.settlement,
    ]),
    csvSeparatorForLocale(locale.value),
  );

  exportFile(
    `${t('title')}.csv`,
    new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }),
    { mimeType: 'text/csv;charset=utf-8;' },
  );
}
</script>

<style lang="scss" scoped>
.ledger-view {
  gap: 16px;
  padding: 16px;
}

@media (min-width: 600px) {
  .ledger-view {
    padding: 24px;
  }
}

.header-text {
  min-width: 0;
}

.count-badge {
  min-width: 20px;
  padding: 2px 8px;
  justify-content: center;
  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface-variant);
  font-size: 12px;
  font-weight: 600;
}

.ledger-totals {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.tile {
  min-width: 0;
  padding: 12px 16px;
  background: var(--md3-surface-container-low);
  border-radius: 12px;
}

.tile-label {
  color: var(--md3-on-surface-variant);
  font-size: 0.8125rem;
  font-weight: 500;
}

.tile-value {
  margin-top: 2px;
  overflow: hidden;
  color: var(--md3-on-surface);
  font-size: 1.25rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filter-chip {
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--md3-outline-variant);
  border-radius: 8px;
  background: transparent;
  color: var(--md3-on-surface-variant);
  font-size: 13px;
  font-weight: 500;
}

.filter-chip--active {
  border-color: transparent;
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}

.table-card {
  position: relative;
  min-height: 240px;
  border-radius: 16px;
  background: var(--md3-surface);
  overflow: hidden;
}

.ledger-table {
  background: transparent;

  :deep(thead tr th) {
    position: sticky;
    top: 0;
    z-index: 1;
    background: var(--md3-surface);
    color: var(--md3-on-surface-variant);
    font-weight: 600;
  }

  :deep(td) {
    font-variant-numeric: tabular-nums;
  }
}

.ledger-row--attempt td {
  color: var(--md3-on-surface-variant);
}

.deleted-tag {
  margin-left: 8px;
  padding: 1px 8px;
  border: 1px solid var(--md3-outline-variant);
  border-radius: 999px;
  color: var(--md3-on-surface-variant);
  font-size: 11px;
  white-space: nowrap;
}

@media (max-width: 599px) {
  .ledger-view {
    gap: 12px;
  }

  .tile {
    padding: 10px 12px;
  }

  .tile-value {
    font-size: 1rem;
  }
}
</style>

<i18n lang="yaml" locale="en">
title: 'Payment ledger'
subtitle: 'Every payment of this event, including those of deleted registrations.'
showAttempts: 'Unsuccessful attempts'
export: 'Export CSV'
deleted: 'Registration deleted'
empty: 'No payments yet.'
kpi:
  received: 'Received'
  refunded: 'Refunded'
  net: 'Net'
column:
  date: 'Date'
  payer: 'Payer'
  method: 'Method'
  status: 'Status'
  amount: 'Amount'
  refunded: 'Refunded'
  net: 'Net'
  settlement: 'On deletion'
method:
  bank_transfer: 'Bank transfer'
  cash: 'Cash'
  other: 'Other'
source:
  manual: 'Recorded manually'
  mollie: 'Mollie'
  stripe: 'Stripe'
  fake: 'Fake provider'
status:
  OPEN: 'Checkout open'
  PENDING: 'Processing'
  PAID: 'Paid'
  FAILED: 'Failed'
  CANCELED: 'Canceled'
  EXPIRED: 'Expired'
settlement:
  retained: 'Kept'
  settled_outside: 'Given back outside the app'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Zahlungsbuch'
subtitle: 'Alle Zahlungen dieser Veranstaltung, auch die gelöschter Anmeldungen.'
showAttempts: 'Erfolglose Versuche'
export: 'CSV exportieren'
deleted: 'Anmeldung gelöscht'
empty: 'Noch keine Zahlungen.'
kpi:
  received: 'Eingegangen'
  refunded: 'Erstattet'
  net: 'Netto'
column:
  date: 'Datum'
  payer: 'Zahlende Person'
  method: 'Zahlungsart'
  status: 'Status'
  amount: 'Betrag'
  refunded: 'Erstattet'
  net: 'Netto'
  settlement: 'Beim Löschen'
method:
  bank_transfer: 'Überweisung'
  cash: 'Bar'
  other: 'Sonstiges'
source:
  manual: 'Manuell erfasst'
  mollie: 'Mollie'
  stripe: 'Stripe'
  fake: 'Testanbieter'
status:
  OPEN: 'Bezahlvorgang offen'
  PENDING: 'In Bearbeitung'
  PAID: 'Bezahlt'
  FAILED: 'Fehlgeschlagen'
  CANCELED: 'Abgebrochen'
  EXPIRED: 'Abgelaufen'
settlement:
  retained: 'Behalten'
  settled_outside: 'Außerhalb der App erstattet'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Registre des paiements'
subtitle: 'Tous les paiements de cet événement, y compris ceux des inscriptions supprimées.'
showAttempts: 'Tentatives échouées'
export: 'Exporter en CSV'
deleted: 'Inscription supprimée'
empty: 'Aucun paiement pour le moment.'
kpi:
  received: 'Encaissé'
  refunded: 'Remboursé'
  net: 'Net'
column:
  date: 'Date'
  payer: 'Payeur'
  method: 'Mode'
  status: 'Statut'
  amount: 'Montant'
  refunded: 'Remboursé'
  net: 'Net'
  settlement: 'À la suppression'
method:
  bank_transfer: 'Virement'
  cash: 'Espèces'
  other: 'Autre'
source:
  manual: 'Enregistré manuellement'
  mollie: 'Mollie'
  stripe: 'Stripe'
  fake: 'Prestataire de test'
status:
  OPEN: 'Paiement ouvert'
  PENDING: 'En cours de traitement'
  PAID: 'Payé'
  FAILED: 'Échoué'
  CANCELED: 'Annulé'
  EXPIRED: 'Expiré'
settlement:
  retained: 'Conservé'
  settled_outside: "Remboursé en dehors de l'application"
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Rejestr płatności'
subtitle: 'Wszystkie płatności tego wydarzenia, także usuniętych zgłoszeń.'
showAttempts: 'Nieudane próby'
export: 'Eksportuj CSV'
deleted: 'Zgłoszenie usunięte'
empty: 'Brak płatności.'
kpi:
  received: 'Wpłacono'
  refunded: 'Zwrócono'
  net: 'Netto'
column:
  date: 'Data'
  payer: 'Płatnik'
  method: 'Metoda'
  status: 'Status'
  amount: 'Kwota'
  refunded: 'Zwrócono'
  net: 'Netto'
  settlement: 'Przy usunięciu'
method:
  bank_transfer: 'Przelew'
  cash: 'Gotówka'
  other: 'Inne'
source:
  manual: 'Zarejestrowane ręcznie'
  mollie: 'Mollie'
  stripe: 'Stripe'
  fake: 'Operator testowy'
status:
  OPEN: 'Płatność otwarta'
  PENDING: 'W toku'
  PAID: 'Opłacone'
  FAILED: 'Nieudane'
  CANCELED: 'Anulowane'
  EXPIRED: 'Wygasłe'
settlement:
  retained: 'Zatrzymane'
  settled_outside: 'Zwrócone poza aplikacją'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Kniha plateb'
subtitle: 'Všechny platby této akce, i u smazaných registrací.'
showAttempts: 'Neúspěšné pokusy'
export: 'Exportovat CSV'
deleted: 'Registrace smazána'
empty: 'Zatím žádné platby.'
kpi:
  received: 'Přijato'
  refunded: 'Vráceno'
  net: 'Čistá částka'
column:
  date: 'Datum'
  payer: 'Plátce'
  method: 'Způsob'
  status: 'Stav'
  amount: 'Částka'
  refunded: 'Vráceno'
  net: 'Čistá částka'
  settlement: 'Při smazání'
method:
  bank_transfer: 'Převod'
  cash: 'Hotově'
  other: 'Jiné'
source:
  manual: 'Zaznamenáno ručně'
  mollie: 'Mollie'
  stripe: 'Stripe'
  fake: 'Testovací poskytovatel'
status:
  OPEN: 'Platba otevřena'
  PENDING: 'Zpracovává se'
  PAID: 'Zaplaceno'
  FAILED: 'Neúspěšné'
  CANCELED: 'Zrušeno'
  EXPIRED: 'Vypršelo'
settlement:
  retained: 'Ponecháno'
  settled_outside: 'Vráceno mimo aplikaci'
</i18n>
