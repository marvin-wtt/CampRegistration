<template>
  <page-state-handler :error>
    <div class="admin-page column no-wrap fit">
      <div class="row items-center q-col-gutter-sm q-mb-md">
        <div class="col-auto">
          <q-btn
            :to="{ name: 'administration.billing' }"
            :aria-label="t('back')"
            icon="arrow_back"
            flat
            round
          >
            <q-tooltip>{{ t('back') }}</q-tooltip>
          </q-btn>
        </div>
        <div class="col column">
          <div class="text-h6 text-weight-medium">{{ t('title') }}</div>
          <div class="text-caption text-on-surface-variant">
            {{ t('subtitle') }}
          </div>
        </div>
        <div class="col-auto">
          <q-select
            v-model="year"
            :options="yearOptions"
            :label="t('year')"
            :disable="yearOptions.length < 2"
            dense
            outlined
            rounded
            options-dense
            style="min-width: 110px"
          />
        </div>
        <div class="col-auto">
          <q-btn
            :href="yearExportUrl ?? undefined"
            :disable="!yearExportUrl"
            :label="t('export.year', { year })"
            icon="download"
            color="primary"
            type="a"
            unelevated
            rounded
            no-caps
          />
        </div>
        <div class="col-auto">
          <q-btn
            :loading
            icon="refresh"
            flat
            round
            @click="load"
          >
            <q-tooltip>{{ t('refresh') }}</q-tooltip>
          </q-btn>
        </div>
      </div>

      <q-card
        flat
        bordered
        class="col overflow-auto rounded-borders"
      >
        <div
          v-if="!loading && months.length === 0"
          class="text-body2 text-on-surface-variant q-pa-lg text-center"
        >
          {{ t('empty') }}
        </div>
        <q-markup-table
          v-else
          flat
          separator="horizontal"
          class="overview-table"
        >
          <thead>
            <tr>
              <th class="text-left">{{ t('column.month') }}</th>
              <th class="text-right">{{ t('column.bills') }}</th>
              <th class="text-right">{{ t('column.net') }}</th>
              <th class="text-right">{{ t('column.tax') }}</th>
              <th class="text-right">{{ t('column.gross') }}</th>
              <th class="text-right">{{ t('column.received') }}</th>
              <th class="text-right">{{ t('column.open') }}</th>
              <th class="text-right">
                <span class="sr-only">{{ t('column.actions') }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-if="loading">
              <tr
                v-for="index in 4"
                :key="index"
              >
                <td
                  v-for="column in 8"
                  :key="column"
                >
                  <q-skeleton type="text" />
                </td>
              </tr>
            </template>
            <tr
              v-for="row in months"
              v-else
              :key="`${row.month}|${row.currency}`"
              class="overview-row cursor-pointer"
              tabindex="0"
              @click="openMonth(row.month)"
              @keyup.enter="openMonth(row.month)"
            >
              <td class="text-left">
                {{ formatMonth(row.month) }}
                <span
                  v-if="multipleCurrencies"
                  class="text-caption text-on-surface-variant q-ml-xs"
                >
                  {{ row.currency }}
                </span>
                <q-tooltip>{{ t('openMonth') }}</q-tooltip>
              </td>
              <td class="text-right">{{ row.bills }}</td>
              <td class="text-right">{{ money(row.netAmount, row) }}</td>
              <td class="text-right">{{ money(row.taxAmount, row) }}</td>
              <td class="text-right text-weight-medium">
                {{ money(row.grossAmount, row) }}
              </td>
              <td class="text-right">{{ money(row.receivedAmount, row) }}</td>
              <td
                :class="{ 'text-warning': row.openAmount !== '0.00' }"
                class="text-right"
              >
                {{ money(row.openAmount, row) }}
              </td>
              <td class="text-right">
                <q-btn
                  :href="api.billsExportUrl({ from: row.month, to: row.month })"
                  :aria-label="
                    t('export.month', { month: formatMonth(row.month) })
                  "
                  :disable="row.bills === 0"
                  icon="download"
                  type="a"
                  size="sm"
                  flat
                  round
                  @click.stop
                >
                  <q-tooltip>
                    {{ t('export.month', { month: formatMonth(row.month) }) }}
                  </q-tooltip>
                </q-btn>
              </td>
            </tr>
          </tbody>
          <tfoot v-if="!loading && totals.length > 0">
            <tr
              v-for="total in totals"
              :key="total.currency"
              class="overview-total"
            >
              <td class="text-left">
                {{ t('total', { year }) }}
                <span
                  v-if="multipleCurrencies"
                  class="text-caption q-ml-xs"
                >
                  {{ total.currency }}
                </span>
              </td>
              <td class="text-right">{{ total.bills }}</td>
              <td class="text-right">{{ money(total.netAmount, total) }}</td>
              <td class="text-right">{{ money(total.taxAmount, total) }}</td>
              <td class="text-right">{{ money(total.grossAmount, total) }}</td>
              <td class="text-right">
                {{ money(total.receivedAmount, total) }}
              </td>
              <td class="text-right">{{ money(total.openAmount, total) }}</td>
              <td />
            </tr>
          </tfoot>
        </q-markup-table>
      </q-card>

      <div class="text-caption text-on-surface-variant q-mt-sm">
        {{ t('hint') }}
      </div>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import type {
  BillingMonth,
  BillingSummary,
  BillingTotal,
} from '@camp-registration/common/entities';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import { useAPIService } from '@/services/APIService';
import { useErrorExtractor } from '@/composables/serviceHandler';
import { useRouteQueryParams } from '@/composables/useRouteQueryParams';
import { formatMoney } from '@/utils/money';

const { t, locale } = useI18n();
const router = useRouter();
const api = useAPIService();
const routeQuery = useRouteQueryParams();
const { extractErrorText } = useErrorExtractor();

const summary = ref<BillingSummary | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

/** `null` until the server says which year is current. */
const year = ref<number | null>(routeQuery.getNumericQueryParam('year'));

async function load() {
  loading.value = true;
  error.value = null;
  try {
    summary.value = await api.fetchBillingSummary(
      year.value === null ? {} : { year: year.value },
    );
    year.value = summary.value.year;
  } catch (err: unknown) {
    error.value = extractErrorText(err);
  } finally {
    loading.value = false;
  }
}

void load();

watch(year, (value, previous) => {
  // The first answer fills in the year; only a choice reloads.
  if (previous === null || value === summary.value?.year) {
    return;
  }
  routeQuery.setQueryParams({ year: value });
  void load();
});

const months = computed<BillingMonth[]>(() => summary.value?.months ?? []);
const totals = computed<BillingTotal[]>(() => summary.value?.totals ?? []);

const yearOptions = computed<number[]>(() => {
  const years = summary.value?.years ?? [];

  return years.length > 0 ? years : year.value === null ? [] : [year.value];
});

const multipleCurrencies = computed(
  () => new Set(months.value.map((row) => row.currency)).size > 1,
);

const yearExportUrl = computed(() => {
  const shown = months.value;
  const to = shown[0]?.month;
  const from = shown[shown.length - 1]?.month;

  return from && to ? api.billsExportUrl({ from, to }) : null;
});

function openMonth(month: string) {
  void router.push({ name: 'administration.billing', query: { month } });
}

/** Numeric, e.g. "10.2026" or "10/2026", like the app's dates. */
function formatMonth(month: string): string {
  const [yearPart = 0, monthNumber = 1] = month.split('-').map(Number);

  return new Intl.DateTimeFormat(locale.value, {
    year: 'numeric',
    month: '2-digit',
  }).format(new Date(yearPart, monthNumber - 1, 1));
}

function money(amount: string, row: { currency: string }): string {
  return formatMoney(amount, row.currency, locale.value);
}
</script>

<style scoped lang="scss">
.overview-table {
  background: transparent;

  thead th {
    position: sticky;
    top: 0;
    z-index: 1;
    background: var(--md3-surface);
  }
}

.overview-row {
  &:hover,
  &:focus-visible {
    background: var(--md3-surface-container-high);
    outline: none;
  }
}

.overview-total td {
  font-weight: 600;
  background: var(--md3-surface-container);
  border-top: 2px solid var(--md3-outline-variant);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>

<i18n lang="yaml" locale="en">
title: 'Monthly overview'
subtitle: 'Billing per calendar month'
back: 'Back to bills'
year: 'Year'
refresh: 'Refresh'
empty: 'Nothing billed in this year.'
total: 'Total {year}'
openMonth: 'Show the bills of this month'
hint: 'By invoice date, without voided bills. Received counts by payment date. The export includes voided bills, marked as such.'
export:
  year: 'Export {year}'
  month: 'Export {month} as CSV'
column:
  month: 'Month'
  bills: 'Bills'
  net: 'Net'
  tax: 'Tax'
  gross: 'Gross'
  received: 'Received'
  open: 'Open'
  actions: 'Actions'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Monatsübersicht'
subtitle: 'Abrechnung pro Kalendermonat'
back: 'Zurück zu den Rechnungen'
year: 'Jahr'
refresh: 'Aktualisieren'
empty: 'In diesem Jahr wurde nichts abgerechnet.'
total: 'Summe {year}'
openMonth: 'Rechnungen dieses Monats anzeigen'
hint: 'Nach Rechnungsdatum, ohne stornierte Rechnungen. Eingänge nach Zahlungsdatum. Der Export enthält stornierte Rechnungen, entsprechend gekennzeichnet.'
export:
  year: '{year} exportieren'
  month: '{month} als CSV exportieren'
column:
  month: 'Monat'
  bills: 'Rechnungen'
  net: 'Netto'
  tax: 'Steuer'
  gross: 'Brutto'
  received: 'Eingegangen'
  open: 'Offen'
  actions: 'Aktionen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Aperçu mensuel'
subtitle: 'Facturation par mois civil'
back: 'Retour aux factures'
year: 'Année'
refresh: 'Actualiser'
empty: 'Rien de facturé cette année.'
total: 'Total {year}'
openMonth: 'Afficher les factures de ce mois'
hint: "Par date de facture, sans les factures annulées. Les encaissements comptent à la date de paiement. L'export inclut les factures annulées, signalées comme telles."
export:
  year: 'Exporter {year}'
  month: 'Exporter {month} en CSV'
column:
  month: 'Mois'
  bills: 'Factures'
  net: 'HT'
  tax: 'Taxe'
  gross: 'TTC'
  received: 'Encaissé'
  open: 'Ouvert'
  actions: 'Actions'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Przegląd miesięczny'
subtitle: 'Rozliczenia według miesięcy kalendarzowych'
back: 'Powrót do rachunków'
year: 'Rok'
refresh: 'Odśwież'
empty: 'W tym roku nic nie zafakturowano.'
total: 'Suma {year}'
openMonth: 'Pokaż rachunki z tego miesiąca'
hint: 'Według daty faktury, bez anulowanych rachunków. Wpływy według daty płatności. Eksport zawiera anulowane rachunki, odpowiednio oznaczone.'
export:
  year: 'Eksportuj {year}'
  month: 'Eksportuj {month} jako CSV'
column:
  month: 'Miesiąc'
  bills: 'Rachunki'
  net: 'Netto'
  tax: 'Podatek'
  gross: 'Brutto'
  received: 'Wpłynęło'
  open: 'Otwarte'
  actions: 'Akcje'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Měsíční přehled'
subtitle: 'Vyúčtování po kalendářních měsících'
back: 'Zpět na faktury'
year: 'Rok'
refresh: 'Obnovit'
empty: 'V tomto roce nebylo nic vyúčtováno.'
total: 'Celkem {year}'
openMonth: 'Zobrazit faktury tohoto měsíce'
hint: 'Podle data faktury, bez stornovaných faktur. Příjmy podle data platby. Export obsahuje i stornované faktury s odpovídajícím označením.'
export:
  year: 'Exportovat {year}'
  month: 'Exportovat {month} jako CSV'
column:
  month: 'Měsíc'
  bills: 'Faktury'
  net: 'Bez DPH'
  tax: 'Daň'
  gross: 'S DPH'
  received: 'Přijato'
  open: 'Otevřeno'
  actions: 'Akce'
</i18n>
