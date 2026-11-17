<template>
  <div
    class="column no-wrap expenses-view"
    :class="{ 'expenses-view--xs': quasar.screen.xs }"
  >
    <!-- Wide screens: the totals lead -->
    <div
      v-if="wide"
      class="totals-strip rounded-xl row items-center no-wrap q-px-lg q-py-md"
      data-test="expense-totals"
    >
      <div class="column">
        <span class="text-body2 text-on-surface-variant">
          {{ t('finance.summary.net') }}
        </span>
        <span class="text-h5 text-weight-medium amount">
          {{ money(net) }}
        </span>
      </div>
      <q-separator
        vertical
        class="q-mx-lg"
      />
      <div class="column">
        <span class="text-caption text-on-surface-variant">
          {{ t('finance.summary.expenses') }}
        </span>
        <span class="text-subtitle1 amount">{{ money(totals.expenses) }}</span>
      </div>
      <div class="column q-ml-xl">
        <span class="text-caption text-on-surface-variant">
          {{ t('finance.summary.refunds') }}
        </span>
        <span class="text-subtitle1 amount text-refund">
          −{{ money(totals.refunds) }}
        </span>
      </div>
      <q-space />
      <span class="text-body2 text-on-surface-variant">
        {{ t('finance.receiptCount', filtered.length) }}
      </span>
    </div>

    <!-- Narrow screens: the total leads too, with the phone's filter button -->
    <div
      v-else
      class="totals-strip rounded-xl row items-center no-wrap q-pl-md q-pr-sm q-py-sm"
      data-test="expense-totals"
    >
      <div class="column col">
        <span class="text-caption text-on-surface-variant ellipsis">
          {{ t('finance.summary.net') }} ·
          {{ t('finance.receiptCount', filtered.length) }}
        </span>
        <span class="text-h6 amount">{{ money(net) }}</span>
      </div>
      <q-chip
        v-if="quasar.screen.xs"
        icon="filter_list"
        clickable
        class="filter-chip"
        :class="{ 'filter-chip--active': activeChips.length }"
        data-test="expense-filter-open"
        @click="filterSheetOpen = true"
      >
        {{
          activeChips.length
            ? t('finance.filter.activeCount', { count: activeChips.length })
            : t('finance.filter.title')
        }}
      </q-chip>
    </div>

    <!-- Filters: chips where there is room, a sheet on phones -->
    <div
      v-if="!quasar.screen.xs"
      class="row items-center filter-row"
    >
      <q-chip
        icon="category"
        icon-right="arrow_drop_down"
        clickable
        class="filter-chip"
        :class="{ 'filter-chip--active': categoryFilter }"
        data-test="expense-filter-category"
      >
        {{
          optionLabel(categoryOptions, categoryFilter) ??
          t('finance.field.category')
        }}
        <q-menu auto-close>
          <q-list class="filter-menu">
            <q-item
              v-for="option in categoryOptions"
              :key="option.value"
              clickable
              :active="categoryFilter === option.value"
              @click="
                toggle(
                  categoryFilter,
                  option.value,
                  (v) => (categoryFilter = v),
                )
              "
            >
              <q-item-section>{{ option.label }}</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-chip>
      <q-chip
        icon="person"
        icon-right="arrow_drop_down"
        clickable
        class="filter-chip"
        :class="{ 'filter-chip--active': payerFilter }"
        data-test="expense-filter-payer"
      >
        {{
          optionLabel(payerOptions, payerFilter) ?? t('finance.field.paidBy')
        }}
        <q-menu auto-close>
          <q-list class="filter-menu">
            <q-item
              v-for="option in payerOptions"
              :key="option.value"
              clickable
              :active="payerFilter === option.value"
              @click="
                toggle(payerFilter, option.value, (v) => (payerFilter = v))
              "
            >
              <q-item-section>{{ option.label }}</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-chip>
      <q-chip
        icon="no_photography"
        clickable
        class="filter-chip"
        :class="{ 'filter-chip--active': missingFileOnly }"
        data-test="expense-filter-missing"
        @click="missingFileOnly = !missingFileOnly"
      >
        {{ t('finance.filter.missingFile', { count: missingCount }) }}
      </q-chip>
      <q-chip
        v-if="categoryFilterShown"
        icon="label_off"
        clickable
        class="filter-chip"
        :class="{ 'filter-chip--active': missingCategoryOnly }"
        data-test="expense-filter-no-category"
        @click="missingCategoryOnly = !missingCategoryOnly"
      >
        {{
          t('finance.filter.missingCategory', { count: missingCategoryCount })
        }}
      </q-chip>
      <q-chip
        v-if="pendingCount > 0"
        icon="hourglass_empty"
        clickable
        class="filter-chip"
        :class="{ 'filter-chip--active': pendingOnly }"
        data-test="expense-filter-pending"
        @click="pendingOnly = !pendingOnly"
      >
        {{ t('finance.filter.pending', { count: pendingCount }) }}
      </q-chip>
      <q-btn
        v-if="activeFilterCount > 0"
        :label="t('finance.filter.reset')"
        color="primary"
        flat
        dense
        rounded
        no-caps
        class="q-px-sm"
        @click="resetFilters"
      />
    </div>
    <div
      v-else-if="activeChips.length"
      class="row no-wrap items-center filter-scroll"
    >
      <q-chip
        v-for="chip in activeChips"
        :key="chip.key"
        :icon="chip.icon"
        removable
        class="filter-chip"
        @remove="chip.clear"
      >
        {{ chip.label }}
      </q-chip>
    </div>

    <bottom-sheet
      v-if="quasar.screen.xs"
      v-model="filterSheetOpen"
      :snap-points="['half', 'full']"
    >
      <div class="row items-center justify-between q-mb-sm">
        <div class="text-subtitle1 text-weight-medium">
          {{ t('finance.filter.title') }}
        </div>
        <q-btn
          v-if="activeFilterCount > 0"
          :label="t('finance.filter.reset')"
          color="primary"
          flat
          dense
          no-caps
          @click="resetFilters"
        />
      </div>
      <q-list>
        <q-item
          tag="label"
          class="q-px-none"
        >
          <q-item-section avatar>
            <q-icon name="no_photography" />
          </q-item-section>
          <q-item-section>
            {{ t('finance.filter.missingFile', { count: missingCount }) }}
          </q-item-section>
          <q-item-section side>
            <q-toggle v-model="missingFileOnly" />
          </q-item-section>
        </q-item>
        <q-item
          v-if="categoryFilterShown"
          tag="label"
          class="q-px-none"
        >
          <q-item-section avatar>
            <q-icon name="label_off" />
          </q-item-section>
          <q-item-section>
            {{
              t('finance.filter.missingCategory', {
                count: missingCategoryCount,
              })
            }}
          </q-item-section>
          <q-item-section side>
            <q-toggle v-model="missingCategoryOnly" />
          </q-item-section>
        </q-item>
        <q-item
          v-if="pendingCount > 0"
          tag="label"
          class="q-px-none"
        >
          <q-item-section avatar>
            <q-icon name="hourglass_empty" />
          </q-item-section>
          <q-item-section>
            {{ t('finance.filter.pending', { count: pendingCount }) }}
          </q-item-section>
          <q-item-section side>
            <q-toggle v-model="pendingOnly" />
          </q-item-section>
        </q-item>
      </q-list>
      <div class="column q-gutter-y-sm q-mt-sm q-pb-md">
        <q-select
          v-model="categoryFilter"
          :options="categoryOptions"
          :label="t('finance.field.category')"
          emit-value
          map-options
          clearable
          outlined
          rounded
        />
        <q-select
          v-model="payerFilter"
          :options="payerOptions"
          :label="t('finance.field.paidBy')"
          emit-value
          map-options
          clearable
          outlined
          rounded
        />
      </div>
    </bottom-sheet>

    <div
      v-if="filtered.length === 0"
      class="row items-center q-gutter-x-sm text-body2 text-on-surface-variant q-py-lg"
    >
      <q-icon
        name="filter_alt_off"
        size="20px"
      />
      <span>{{ t('finance.filter.noMatch') }}</span>
    </div>

    <!-- Grouped by day, newest first; receipts still to come last -->
    <template v-else>
      <div
        v-for="day in days"
        :key="day.date ?? 'pending'"
        class="column no-wrap day-group"
      >
        <div
          class="day-header row items-center justify-between no-wrap q-px-sm"
          :class="{ 'day-header--pending': !day.date }"
        >
          <span
            v-if="day.date"
            class="text-overline text-on-surface-variant"
          >
            {{ d(parseLocalDate(day.date), 'date') }}
          </span>
          <span
            v-else
            class="row items-center no-wrap q-gutter-x-xs text-body2 text-weight-medium"
          >
            <q-icon
              name="hourglass_empty"
              size="18px"
            />
            <span>
              {{ t('finance.receiptPending') }} · {{ day.expenses.length }}
            </span>
          </span>
          <span
            v-if="wide"
            class="text-caption text-on-surface-variant amount"
          >
            {{ money(day.total) }}
          </span>
        </div>

        <q-list
          separator
          class="expense-list rounded-xl"
          :class="{ 'expense-list--pending': !day.date }"
        >
          <q-item
            v-for="expense in day.expenses"
            :key="expense.id"
            clickable
            class="expense-item"
            data-test="expense-item"
            @click="
              dialogs.details(expense, canEdit(expense), canDelete(expense))
            "
          >
            <q-item-section avatar>
              <div
                class="receipt-badge rounded-md column items-center justify-center"
                :class="
                  expense.date
                    ? ''
                    : 'bg-warning-container text-on-warning-container'
                "
              >
                <q-icon
                  v-if="!expense.date"
                  name="hourglass_empty"
                  size="14px"
                >
                  <q-tooltip>{{ t('finance.receiptPending') }}</q-tooltip>
                </q-icon>
                #{{ expense.receiptNumber }}
              </div>
            </q-item-section>

            <q-item-section class="expense-main">
              <q-item-label class="row items-center no-wrap q-gutter-x-sm">
                <span class="ellipsis text-weight-medium">
                  {{ expense.description }}
                </span>
                <span
                  v-if="expense.vendor"
                  class="ellipsis text-on-surface-variant"
                >
                  {{ expense.vendor }}
                </span>
                <q-badge
                  v-if="wide && expense.type === 'REFUND'"
                  color="tertiary-container"
                  text-color="on-tertiary-container"
                  :label="t('finance.type.refund')"
                />
              </q-item-label>
              <q-item-label
                v-if="wide"
                caption
                class="ellipsis"
              >
                <q-badge
                  v-if="missingCategory(expense)"
                  color="warning-container"
                  text-color="on-warning-container"
                  :label="t('finance.noCategory')"
                  data-test="expense-no-category"
                />
                <template v-else>{{ categoryCaption(expense) }}</template>
              </q-item-label>
              <q-item-label
                v-else
                caption
                class="row items-center q-gutter-x-xs no-wrap"
              >
                <span class="ellipsis">{{ meta(expense) }}</span>
                <q-badge
                  v-if="missingCategory(expense)"
                  color="warning-container"
                  text-color="on-warning-container"
                  :label="t('finance.noCategory')"
                  data-test="expense-no-category"
                />
                <q-badge
                  v-if="expense.files.length === 0 && expense.date"
                  color="warning-container"
                  text-color="on-warning-container"
                  :label="t('finance.noFile')"
                />
              </q-item-label>
            </q-item-section>

            <template v-if="wide">
              <q-item-section
                side
                class="payer-cell"
              >
                <span
                  class="ellipsis"
                  :class="
                    expense.paidByName
                      ? 'text-on-surface'
                      : 'text-italic text-on-surface-variant'
                  "
                >
                  {{ payerName(expense) }}
                </span>
              </q-item-section>

              <q-item-section
                side
                class="file-cell"
              >
                <q-btn
                  v-if="expense.files.length > 0"
                  icon="attach_file"
                  color="primary"
                  flat
                  round
                  dense
                  :aria-label="
                    expense.files.length === 1
                      ? t('finance.action.openFile', {
                          name: expense.files[0]!.name,
                        })
                      : t('finance.files', expense.files.length)
                  "
                  data-test="expense-files"
                  @click.stop="
                    expense.files.length === 1 && openURL(expense.files[0]!.url)
                  "
                >
                  <q-badge
                    v-if="expense.files.length > 1"
                    :label="expense.files.length"
                    color="primary"
                    text-color="on-primary"
                    floating
                    rounded
                  />
                  <q-tooltip v-if="expense.files.length === 1">
                    {{ expense.files[0]!.name }}
                  </q-tooltip>
                  <q-menu
                    v-if="expense.files.length > 1"
                    auto-close
                  >
                    <q-list dense>
                      <q-item
                        v-for="file in expense.files"
                        :key="file.id"
                        clickable
                        @click="openURL(file.url)"
                      >
                        <q-item-section avatar>
                          <q-icon
                            :name="
                              file.type.startsWith('image/')
                                ? 'image'
                                : 'description'
                            "
                          />
                        </q-item-section>
                        <q-item-section>{{ file.name }}</q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-btn>
                <!-- A pending receipt is expected to lack a file: no warning yet. -->
                <q-icon
                  v-else
                  name="no_photography"
                  :color="expense.date ? 'warning' : 'on-surface-variant'"
                  size="20px"
                  data-test="expense-no-file"
                >
                  <q-tooltip>{{ t('finance.noFile') }}</q-tooltip>
                </q-icon>
              </q-item-section>
            </template>

            <q-item-section
              side
              class="amount-cell"
            >
              <q-item-label
                class="amount"
                :class="{
                  'text-refund': expense.type === 'REFUND',
                  'text-weight-medium': wide,
                }"
              >
                {{ signedMoney(expense) }}
              </q-item-label>
              <q-item-label
                v-if="wide && expense.originalCurrency"
                caption
              >
                {{
                  money(expense.originalAmount ?? 0, expense.originalCurrency)
                }}
              </q-item-label>
              <q-item-label
                v-else-if="!wide && expense.type === 'REFUND'"
                caption
                class="text-refund"
              >
                {{ t('finance.type.refund') }}
              </q-item-label>
            </q-item-section>

            <q-item-section
              v-if="wide"
              side
              class="action-cell"
            >
              <q-btn
                v-if="canDelete(expense)"
                icon="delete"
                flat
                round
                dense
                size="sm"
                class="delete-btn"
                :aria-label="t('finance.action.delete')"
                @click.stop="dialogs.remove(expense)"
              />
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { openURL, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useRouteQueryParams } from '@/composables/useRouteQueryParams';
import type {
  Expense,
  ExpenseCategory,
} from '@camp-registration/common/entities';
import { payerKey } from '@camp-registration/common/utils';
import { groupCategories, useFinanceFormat } from '@/composables/financeFormat';
import { useFinanceDialogs } from '@/composables/financeDialogs';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { usePermissions } from '@/composables/permissions';
import BottomSheet from '@/components/BottomSheet.vue';
import { useFinanceStore } from '@/stores/finance-store';
import { parseLocalDate } from '@/utils/date';

const { expenses, categories } = defineProps<{
  expenses: readonly Expense[];
  categories: readonly ExpenseCategory[];
}>();

const quasar = useQuasar();
const { t, d } = useI18n();
const { to } = useObjectTranslation();
const { canOn } = usePermissions();
const dialogs = useFinanceDialogs();
const financeStore = useFinanceStore();
const { money, signedMoney, categoryName, categoryGroupName, payerName } =
  useFinanceFormat();

// Payer, receipt and actions get their own columns once there is room.
const wide = computed(() => quasar.screen.gt.sm);

// Filters live in the query, so the summary and the dashboard can link to
// a filtered list and a reload keeps it.
const { getStringQueryParam, getBooleanQueryParam, setQueryParams } =
  useRouteQueryParams();

function queryValue(field: string) {
  return computed<string | null>({
    get: () => getStringQueryParam(field) || null,
    set: (value) => setQueryParams({ [field]: value }),
  });
}

function queryFlag(field: string) {
  return computed<boolean>({
    get: () => getBooleanQueryParam(field) ?? false,
    set: (value) => setQueryParams({ [field]: value || null }),
  });
}

const categoryFilter = queryValue('category');
const payerFilter = queryValue('payer');
const missingFileOnly = queryFlag('noFile');
const missingCategoryOnly = queryFlag('noCategory');
const pendingOnly = queryFlag('pending');
const filterSheetOpen = ref(false);

interface FilterOption {
  value: string;
  label: string;
}

function optionLabel(
  options: readonly FilterOption[],
  value: string | null,
): string | undefined {
  return value === null
    ? undefined
    : options.find((o) => o.value === value)?.label;
}

/** Picking the active option again clears the filter. */
function toggle(
  current: string | null,
  value: string,
  set: (value: string | null) => void,
) {
  set(current === value ? null : value);
}

// On phones each active filter shows as a chip that removes it.
const activeChips = computed(() =>
  [
    categoryFilter.value && {
      key: 'category',
      icon: 'category',
      label: optionLabel(categoryOptions.value, categoryFilter.value) ?? '',
      clear: () => (categoryFilter.value = null),
    },
    payerFilter.value && {
      key: 'payer',
      icon: 'person',
      label: optionLabel(payerOptions.value, payerFilter.value) ?? '',
      clear: () => (payerFilter.value = null),
    },
    missingFileOnly.value && {
      key: 'missing',
      icon: 'no_photography',
      label: t('finance.noFile'),
      clear: () => (missingFileOnly.value = false),
    },
    noCategoryFilter.value && {
      key: 'no-category',
      icon: 'label_off',
      label: t('finance.noCategory'),
      clear: () => (missingCategoryOnly.value = false),
    },
    pendingOnly.value && {
      key: 'pending',
      icon: 'hourglass_empty',
      label: t('finance.receiptPending'),
      clear: () => (pendingOnly.value = false),
    },
  ].filter((chip) => !!chip),
);
const activeFilterCount = computed(() => activeChips.value.length);

// One navigation: separate writes would each start from the old query.
function resetFilters() {
  setQueryParams({
    category: null,
    payer: null,
    noFile: null,
    noCategory: null,
    pending: null,
  });
}

// Expenses from event funds have no payer: filtered as their own entry.
const payerFilterKey = (expense: Expense) => payerKey(expense) ?? 'funds';

const categoryOptions = computed<FilterOption[]>(() =>
  groupCategories(categories).flatMap((group) =>
    group.categories.map((c) => ({
      value: c.id,
      label: group.group
        ? `${to(group.group.name)} · ${to(c.name)}`
        : to(c.name),
    })),
  ),
);

const payerOptions = computed<FilterOption[]>(() => {
  const seen = new Map<string, string>();
  for (const expense of expenses) {
    seen.set(payerFilterKey(expense), payerName(expense));
  }
  return [...seen].map(([value, label]) => ({ value, label }));
});

// A receipt still to come is expected to lack its file, as in the badge.
const missingCount = computed(
  () => expenses.filter((e) => e.files.length === 0 && e.date).length,
);

// Offered only where missing categories are marked, and while there are any.
const missingCategoryCount = computed(
  () => expenses.filter((e) => !e.categoryId).length,
);
const categoryFilterShown = computed(
  () =>
    financeStore.display.flagMissingCategories &&
    (missingCategoryCount.value > 0 || missingCategoryOnly.value),
);
// Turning the mark off in the settings drops the filter with it.
const noCategoryFilter = computed(
  () => missingCategoryOnly.value && financeStore.display.flagMissingCategories,
);

// No date yet: the receipt is still to come.
const pendingCount = computed(
  () => expenses.filter((e) => e.date === null).length,
);

const filtered = computed(() =>
  expenses.filter(
    (e) =>
      (!categoryFilter.value || e.categoryId === categoryFilter.value) &&
      (!payerFilter.value || payerFilterKey(e) === payerFilter.value) &&
      (!missingFileOnly.value || (e.files.length === 0 && !!e.date)) &&
      (!noCategoryFilter.value || !e.categoryId) &&
      (!pendingOnly.value || e.date === null),
  ),
);

function signedAmount(expense: Expense): number {
  return expense.type === 'REFUND' ? -expense.amount : expense.amount;
}

// Newest first, as a log is read during the event. Receipts still to come
// have no date and go last: they stay for weeks, and would otherwise push
// today down every time. Their warning colour and the filter find them.
const days = computed(() => {
  const byDate = new Map<string | null, Expense[]>();
  const sorted = [...filtered.value].sort(
    (a, b) =>
      (b.date ?? '0000').localeCompare(a.date ?? '0000') ||
      b.receiptNumber - a.receiptNumber,
  );
  for (const expense of sorted) {
    byDate.set(expense.date, [...(byDate.get(expense.date) ?? []), expense]);
  }
  return [...byDate].map(([date, list]) => ({
    date,
    expenses: list,
    total: list.reduce((sum, e) => sum + signedAmount(e), 0),
  }));
});

const totals = computed(() =>
  filtered.value.reduce(
    (sum, e) =>
      e.type === 'REFUND'
        ? { ...sum, refunds: sum.refunds + e.amount }
        : { ...sum, expenses: sum.expenses + e.amount },
    { expenses: 0, refunds: 0 },
  ),
);
const net = computed(() => totals.value.expenses - totals.value.refunds);

function meta(expense: Expense): string {
  return [categoryName(expense.categoryId), payerName(expense)]
    .filter(Boolean)
    .join(' · ');
}

/** Unless the event doesn't sort its expenses into categories. */
function missingCategory(expense: Expense): boolean {
  return financeStore.display.flagMissingCategories && !expense.categoryId;
}

function categoryCaption(expense: Expense): string {
  return [
    categoryGroupName(expense.categoryId),
    categoryName(expense.categoryId),
  ]
    .filter(Boolean)
    .join(' · ');
}

function canEdit(expense: Expense): boolean {
  return canOn('event.expenses.edit', expense);
}

function canDelete(expense: Expense): boolean {
  return canOn('event.expenses.delete', expense);
}
</script>

<style scoped>
/* Flex gap, not q-gutter: the page's gutter would cancel a gutter's negative margin. */
.expenses-view {
  gap: 16px;
}

.expenses-view--xs {
  gap: 8px;
}

.totals-strip {
  background: var(--md3-surface-container);
}

.filter-row {
  gap: 8px;
}

.filter-scroll {
  overflow-x: auto;
  gap: 8px;
  scrollbar-width: none;
}

/* The compact MD3 filter chip, as on the tasks page. */
.filter-chip {
  height: 32px;
  margin: 0;
  padding: 0 12px;
  flex: 0 0 auto;
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

.filter-menu {
  min-width: 200px;
}

.day-group {
  gap: 4px;
}

.day-header {
  min-height: 28px;
}

.day-header--pending {
  color: var(--md3-warning);
}

.expense-list {
  overflow: hidden;
  border: 1px solid var(--md3-outline-variant);
  background: var(--md3-surface-container-low);
}

.expense-list--pending {
  border-color: color-mix(in srgb, var(--md3-warning) 40%, transparent);
}

.expense-item {
  min-height: 64px;
  padding: 10px 16px;
}

.expense-main {
  min-width: 0;
}

.receipt-badge {
  width: 44px;
  height: 44px;
  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface-variant);
  font-family: 'Roboto Mono', ui-monospace, monospace;
  font-size: 13px;
  font-weight: 500;
}

.payer-cell {
  width: 180px;
  min-width: 0;
  align-items: flex-start;
}

.payer-cell > span {
  max-width: 100%;
}

.file-cell {
  width: 48px;
  align-items: center;
}

.amount-cell {
  min-width: 112px;
  /* The list's side slot is muted by default; an amount must stay legible. */
  color: var(--md3-on-surface);
}

.amount {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.action-cell {
  width: 40px;
}

/* With a mouse, delete only shows on the hovered row. */
@media (hover: hover) {
  .delete-btn {
    opacity: 0;
    transition: opacity 150ms ease;
  }

  .expense-item:hover .delete-btn,
  .delete-btn:focus-visible {
    opacity: 1;
  }
}

.text-refund {
  color: var(--md3-tertiary);
}
</style>
