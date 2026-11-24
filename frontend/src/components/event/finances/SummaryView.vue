<template>
  <finance-tab-layout loose>
    <!-- The answer first: what the event ends with if everything due comes
         in. What is still open and the cash as of today follow. -->
    <finance-headline
      icon="insights"
      :eyebrow="t('expectedResult')"
      :amount="money(summary.result)"
      :amount-tone="summary.result < 0 ? 'error' : undefined"
      :accent="summary.result < 0 ? 'error' : 'primary'"
      :caption="
        t('equation', {
          income: money(incomeTotal),
          expenses: money(summary.total),
        })
      "
      :stats="[
        {
          key: 'today',
          label: t('asOfToday'),
          value: money(summary.receivedResult),
          tone: summary.receivedResult < 0 ? 'error' : 'positive',
        },
        {
          key: 'open-fees',
          label: t('openFees'),
          value: money(summary.feesOutstanding),
          tone: 'warning',
          shown: summary.feesOutstanding > 0,
          to: can('event.payments.view')
            ? { query: { tab: 'income', view: 'fees', fees: 'owing' } }
            : undefined,
        },
        {
          key: 'promised',
          label: t('openPromised'),
          value: money(summary.incomeExpected),
          tone: 'info',
          shown: summary.incomeExpected > 0,
          to: incomeTab,
        },
        // With these, today's cash adds up to the expected result.
        {
          key: 'to-refund',
          label: t('toRefund'),
          value: money(summary.feesToRefund),
          tone: 'refund',
          shown: summary.feesToRefund > 0,
          to: can('event.payments.view')
            ? { query: { tab: 'income', view: 'fees', fees: 'overpaid' } }
            : undefined,
        },
        {
          key: 'unconverted',
          label: t('unconverted'),
          value: unconverted,
          shown: !!unconverted,
        },
      ]"
      data-test="finance-summary-result"
    />

    <!-- Where it comes from and where it goes, side by side when wide. -->
    <div class="summary-split">
      <category-totals-card
        :title="t('incomeByCategory')"
        :empty="t('noIncome')"
        :groups="incomeGroups"
        :total="incomeTotal"
        :total-label="t('finance.tab.income')"
        data-test="finance-summary-income"
      />
      <category-totals-card
        :title="t('expensesByCategory')"
        :empty="t('noExpenses')"
        :groups="expenseGroups"
        :total="summary.total"
        :total-label="t('finance.summary.expenses')"
        data-test="finance-summary-expenses"
      >
        <template
          v-if="summary.refunds > 0"
          #footer
        >
          <span class="text-caption text-on-surface-variant">
            {{
              t('finance.summary.totalCaption', {
                expenses: money(summary.expenses),
                refunds: money(summary.refunds),
              })
            }}
          </span>
        </template>
      </category-totals-card>
    </div>

    <q-card
      flat
      bordered
      class="rounded-xl"
      data-test="finance-summary-todo"
    >
      <q-card-section class="text-subtitle1 text-weight-medium q-pb-xs">
        {{ t('todo') }}
      </q-card-section>

      <!-- Each open point leads to its list, filtered to it. -->
      <q-list>
        <q-item
          v-for="item in openPoints"
          :key="item.key"
          :to="item.to"
          active-class=""
          exact-active-class=""
          clickable
          :data-test="`finance-summary-${item.key}`"
        >
          <q-item-section avatar>
            <q-icon
              :name="item.icon"
              color="warning"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ item.label }}</q-item-label>
            <q-item-label
              v-if="item.numbers"
              caption
              class="ellipsis"
            >
              {{ item.numbers }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="chevron_right" />
          </q-item-section>
        </q-item>
        <q-item v-if="openPoints.length === 0">
          <q-item-section avatar>
            <q-icon
              name="task_alt"
              color="positive"
            />
          </q-item-section>
          <q-item-section>{{ t('nothingOpen') }}</q-item-section>
        </q-item>
      </q-list>

      <q-card-section class="q-pt-sm">
        <span class="text-caption text-on-surface-variant">
          {{ t('finance.summary.recordsNote') }}
        </span>
      </q-card-section>
    </q-card>

    <q-card
      flat
      class="export-card rounded-xl"
    >
      <q-card-section class="column q-gutter-y-md">
        <div>
          <div class="text-subtitle1 text-weight-medium">
            {{ t('finance.export.title') }}
          </div>
          <div class="text-body2 text-on-surface-variant">
            {{ t('finance.export.text') }}
          </div>
        </div>
        <div class="row q-gutter-sm">
          <m-btn
            :label="t('finance.export.xlsx')"
            icon="download"
            color="primary"
            data-test="finance-export-xlsx"
            @click="download('xlsx')"
          />
          <m-btn
            :label="t('finance.export.csv')"
            icon="download"
            tonal
            @click="download('csv')"
          />
        </div>
        <q-separator />
        <div class="row items-center q-gutter-sm">
          <div class="col-12 col-sm text-body2 text-on-surface-variant">
            {{ t('finance.export.receiptsText') }}
          </div>
          <m-btn
            :label="t('finance.export.receipts')"
            icon="folder_zip"
            icon-right="arrow_drop_down"
            tonal
            :disable="noReceiptFiles"
            data-test="finance-export-receipts"
          >
            <q-menu auto-close>
              <q-list>
                <q-item
                  clickable
                  data-test="finance-export-receipts-flat"
                  @click="download('receipts')"
                >
                  <q-item-section avatar>
                    <q-icon name="folder" />
                  </q-item-section>
                  <q-item-section>
                    {{ t('finance.export.receiptsFlat') }}
                  </q-item-section>
                </q-item>
                <q-item
                  clickable
                  data-test="finance-export-receipts-by-group"
                  @click="download('receiptsByGroup')"
                >
                  <q-item-section avatar>
                    <q-icon name="folder_copy" />
                  </q-item-section>
                  <q-item-section>
                    {{ t('finance.export.receiptsByGroup') }}
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </m-btn>
        </div>
      </q-card-section>
    </q-card>
  </finance-tab-layout>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import { useI18n } from 'vue-i18n';
import type {
  FinanceCategory,
  FinanceSummary,
} from '@camp-registration/common/entities';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import CategoryTotalsCard from '@/components/event/finances/CategoryTotalsCard.vue';
import type {
  CategoryTotalGroup,
  CategoryTotalRow,
} from '@/types/categoryTotals';
import FinanceHeadline from '@/components/event/finances/FinanceHeadline.vue';
import FinanceTabLayout from '@/components/event/finances/FinanceTabLayout.vue';
import { groupCategories, useFinanceFormat } from '@/composables/financeFormat';
import { useFinanceStore } from '@/stores/finance-store';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { useGroupLabel } from '@/composables/groupLabel';
import { usePermissions } from '@/composables/permissions';

const { summary, categories } = defineProps<{
  summary: FinanceSummary;
  categories: readonly FinanceCategory[];
}>();

const { t } = useI18n();
const { to } = useObjectTranslation();
const { money } = useFinanceFormat();
const financeStore = useFinanceStore();
const groupLabel = useGroupLabel();
const { can } = usePermissions();

// Income categories aren't part of the expense data the page loads.
void financeStore.loadIncomeCategories();

const incomeTab: RouteLocationRaw = { query: { tab: 'income' } };

/** A group's fees as they will end: received, plus owed, less paid back. */
const feesExpected = (t: {
  received: number;
  outstanding: number;
  toRefund: number;
}) => t.received + t.outstanding - t.toRefund;

// Everything expected, in the event's currency; the result's first term.
const incomeTotal = computed(
  () =>
    summary.incomeReceived +
    summary.incomeExpected +
    feesExpected({
      received: summary.feesReceived,
      outstanding: summary.feesOutstanding,
      toRefund: summary.feesToRefund,
    }),
);

// Fees first, a row per group when there are several; then the categories.
const incomeGroups = computed<CategoryTotalGroup[]>(() => {
  const byId = financeStore.incomeCategoriesById;
  const own = (currency: string) =>
    currency === summary.currency ? undefined : currency;
  const openCaption = (amount: number, currency?: string) =>
    amount > 0 ? t('ofWhichOpen', { amount: money(amount, currency) }) : '';
  const feeRows: CategoryTotalRow[] = summary.feesByGroup.map((total) => ({
    key: `fees-${total.group ?? ''}-${total.currency}`,
    name: total.group ? groupLabel(total.group) : t('finance.summary.noGroup'),
    caption: openCaption(total.outstanding, total.currency),
    total: feesExpected(total),
    currency: own(total.currency),
    to: {
      query: { tab: 'income', view: 'fees', group: total.group ?? undefined },
    },
  }));
  const feesTotal = feesExpected({
    received: summary.feesReceived,
    outstanding: summary.feesOutstanding,
    toRefund: summary.feesToRefund,
  });
  const fees: CategoryTotalGroup[] =
    feeRows.length > 1
      ? [
          {
            key: 'fees',
            name: t('finance.summary.feesReceived'),
            total: feesTotal,
            rows: feeRows,
          },
        ]
      : feeRows.map((row) => ({
          key: 'fees',
          name: '',
          total: row.total,
          rows: [{ ...row, name: t('finance.summary.feesReceived') }],
        }));

  const categories = summary.incomeByCategory
    .map((total) => {
      const category = total.categoryId
        ? byId.get(total.categoryId)
        : undefined;
      return {
        key: total.categoryId ?? 'none',
        name: category ? to(category.name) : t('finance.summary.uncategorized'),
        caption:
          total.expected > 0
            ? t('ofWhichPromised', { amount: money(total.expected) })
            : t('entries', total.count),
        total: total.received + total.expected,
        to: incomeTab,
      };
    })
    .sort((x, y) => y.total - x.total);

  return [
    ...fees,
    ...(categories.length > 0
      ? [{ key: 'other', name: '', total: 0, rows: categories }]
      : []),
  ];
});

// Fees in another currency, never converted: named, not counted.
const unconverted = computed(() =>
  summary.feesByGroup
    .filter((total) => total.currency !== summary.currency)
    .map((total) => money(feesExpected(total), total.currency))
    .join(', '),
);

const noReceiptFiles = computed(
  () => summary.receiptCount === summary.receiptsWithoutFile.length,
);

/** The expenses tab with these filters, read by `ExpensesView`. */
function expensesWith(filters: Record<string, string>): RouteLocationRaw {
  return { query: { tab: 'expenses', ...filters } };
}

const numbers = (list: readonly number[]) =>
  list.map((n) => `#${n.toString()}`).join(', ');

// A receipt still to come is expected to lack its file: not missing yet.
const missingFiles = computed(() =>
  summary.receiptsWithoutFile.filter(
    (n) => !summary.receiptsPending.includes(n),
  ),
);
const openPoints = computed(() => {
  const uncategorized = financeStore.display.flagMissingCategories
    ? (summary.byCategory.find((c) => c.categoryId === null)?.count ?? 0)
    : 0;
  return [
    missingFiles.value.length > 0 && {
      key: 'missing-files',
      icon: 'no_photography',
      label: t('finance.filter.missingFile', {
        count: missingFiles.value.length,
      }),
      numbers: numbers(missingFiles.value),
      to: expensesWith({ noFile: 'true' }),
    },
    summary.receiptsPending.length > 0 && {
      key: 'pending',
      icon: 'hourglass_empty',
      label: t('finance.filter.pending', {
        count: summary.receiptsPending.length,
      }),
      numbers: numbers(summary.receiptsPending),
      to: expensesWith({ pending: 'true' }),
    },
    uncategorized > 0 && {
      key: 'no-category',
      icon: 'label_off',
      label: t('finance.filter.missingCategory', { count: uncategorized }),
      numbers: '',
      to: expensesWith({ noCategory: 'true' }),
    },
    // Only for those who can open the fee ledger it leads to.
    summary.feesOutstanding > 0 &&
      can('event.payments.view') && {
        key: 'open-fees',
        icon: 'payments',
        label: t('openFeesTodo', { amount: money(summary.feesOutstanding) }),
        numbers: '',
        to: { query: { tab: 'income', view: 'fees', fees: 'owing' } },
      },
  ].filter((item) => !!item);
});

function download(kind: 'xlsx' | 'csv' | 'receipts' | 'receiptsByGroup') {
  // Reported by the store.
  financeStore.download(kind).catch(() => undefined);
}

// Totals per category with group subtotals; archived categories still count.
const expenseGroups = computed<CategoryTotalGroup[]>(() => {
  const totals = new Map(summary.byCategory.map((c) => [c.categoryId, c]));
  const caption = (count: number, refunds: number) =>
    [
      t('finance.receiptCount', count),
      refunds > 0 &&
        t('finance.summary.refundedCaption', { amount: money(refunds) }),
    ]
      .filter(Boolean)
      .join(' · ');
  const toRow = (category: FinanceCategory): CategoryTotalRow | null => {
    const total = totals.get(category.id);
    return total
      ? {
          key: category.id,
          to: expensesWith({ category: category.id }),
          name: to(category.name),
          caption: caption(total.count, total.refunds),
          total: total.total,
        }
      : null;
  };

  const groups = groupCategories(categories).map((group) => {
    const list = group.categories
      .map(toRow)
      .filter((row): row is CategoryTotalRow => row !== null)
      .sort((a, b) => b.total - a.total);
    return {
      key: group.group?.id ?? 'top',
      name: group.group ? to(group.group.name) : '',
      total: list.reduce((sum, row) => sum + row.total, 0),
      rows: list,
    };
  });

  const uncategorized = totals.get(null);
  if (uncategorized) {
    groups.push({
      key: 'none',
      name: '',
      total: uncategorized.total,
      rows: [
        {
          key: 'none',
          to: expensesWith({ noCategory: 'true' }),
          name: t('finance.summary.uncategorized'),
          caption: caption(uncategorized.count, uncategorized.refunds),
          total: uncategorized.total,
        },
      ],
    });
  }

  return groups.filter((group) => group.rows.length > 0);
});
</script>

<style scoped>
.export-card {
  background: var(--md3-surface-container);
}

.summary-split {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 360px), 1fr));
  gap: 16px;
}
</style>

<i18n lang="yaml" locale="en">
expectedResult: 'Expected result'
incomeByCategory: 'Income by category'
expensesByCategory: 'Expenses by category'
noIncome: 'No income yet.'
noExpenses: 'No expenses yet.'
entries: '{n} entry | {n} entries'
todo: 'Still to do'
nothingOpen: 'Nothing open.'
openFees: 'Fees still open'
openPromised: 'Income promised'
toRefund: 'To pay back'
asOfToday: 'Received so far'
equation: '{income} income − {expenses} expenses'
unconverted: 'Not converted'
ofWhichOpen: '{amount} of it still open'
ofWhichPromised: '{amount} of it promised'
openFeesTodo: '{amount} in fees still open'
</i18n>

<i18n lang="yaml" locale="de">
expectedResult: 'Erwartetes Ergebnis'
incomeByCategory: 'Einnahmen nach Kategorie'
expensesByCategory: 'Ausgaben nach Kategorie'
noIncome: 'Noch keine Einnahmen.'
noExpenses: 'Noch keine Ausgaben.'
entries: '{n} Eintrag | {n} Einträge'
todo: 'Noch zu erledigen'
nothingOpen: 'Nichts offen.'
openFees: 'Beiträge offen'
openPromised: 'Einnahmen zugesagt'
toRefund: 'Zurückzuzahlen'
asOfToday: 'Bisher eingegangen'
equation: '{income} Einnahmen − {expenses} Ausgaben'
unconverted: 'Nicht umgerechnet'
ofWhichOpen: 'davon {amount} offen'
ofWhichPromised: 'davon {amount} zugesagt'
openFeesTodo: '{amount} Beiträge noch offen'
</i18n>

<i18n lang="yaml" locale="fr">
expectedResult: 'Résultat attendu'
incomeByCategory: 'Recettes par catégorie'
expensesByCategory: 'Dépenses par catégorie'
noIncome: 'Aucune recette pour le moment.'
noExpenses: 'Aucune dépense pour le moment.'
entries: '{n} entrée | {n} entrées'
todo: 'Reste à faire'
nothingOpen: 'Rien en attente.'
openFees: 'Frais en attente'
openPromised: 'Recettes promises'
toRefund: 'À rembourser'
asOfToday: 'Reçu à ce jour'
equation: '{income} de recettes − {expenses} de dépenses'
unconverted: 'Non converti'
ofWhichOpen: 'dont {amount} en attente'
ofWhichPromised: 'dont {amount} promis'
openFeesTodo: '{amount} de frais en attente'
</i18n>

<i18n lang="yaml" locale="pl">
expectedResult: 'Oczekiwany wynik'
incomeByCategory: 'Przychody według kategorii'
expensesByCategory: 'Wydatki według kategorii'
noIncome: 'Brak przychodów.'
noExpenses: 'Brak wydatków.'
entries: '{n} wpis | {n} wpisy | {n} wpisów'
todo: 'Do zrobienia'
nothingOpen: 'Nic nie zostało.'
openFees: 'Opłaty do zapłaty'
openPromised: 'Obiecane wpływy'
toRefund: 'Do zwrotu'
asOfToday: 'Dotychczas wpłynęło'
equation: '{income} przychodów − {expenses} wydatków'
unconverted: 'Nieprzeliczone'
ofWhichOpen: 'w tym {amount} do zapłaty'
ofWhichPromised: 'w tym {amount} obiecano'
openFeesTodo: '{amount} opłat do zapłaty'
</i18n>

<i18n lang="yaml" locale="cs">
expectedResult: 'Očekávaný výsledek'
incomeByCategory: 'Příjmy podle kategorie'
expensesByCategory: 'Výdaje podle kategorie'
noIncome: 'Zatím žádné příjmy.'
noExpenses: 'Zatím žádné výdaje.'
entries: '{n} záznam | {n} záznamy | {n} záznamů'
todo: 'Zbývá udělat'
nothingOpen: 'Nic nezbývá.'
openFees: 'Neuhrazené poplatky'
openPromised: 'Přislíbené příjmy'
toRefund: 'K vrácení'
asOfToday: 'Dosud přijato'
equation: '{income} příjmů − {expenses} výdajů'
unconverted: 'Nepřepočteno'
ofWhichOpen: 'z toho {amount} otevřeno'
ofWhichPromised: 'z toho {amount} přislíbeno'
openFeesTodo: '{amount} poplatků otevřeno'
</i18n>
