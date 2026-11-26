import { defineStore } from 'pinia';
import { exportFile } from 'quasar';
import { useAction } from '@/composables/action';
import { computed, watch } from 'vue';
import { useAPIService } from '@/services/APIService';
import {
  useCollection,
  useResource,
  useRouteKey,
} from '@/composables/resource';
import { removeById, replaceById, upsertById } from '@/utils/collection';
import { payerKey } from '@camp-registration/common/utils';
import { usePermissions } from '@/composables/permissions';
import { useProfileStore } from '@/stores/profile-store';
import { useEventSettings } from '@/composables/eventSettings';
import {
  SETTING_KEYS,
  type FinanceDisplaySettings,
} from '@camp-registration/common/settings';
import type {
  RecordView,
  ScopePermission,
} from '@camp-registration/common/permissions';
import type {
  Expense,
  FinanceCategory,
  FinanceCategoryCreateData,
  FinanceCategoryKind,
  FinanceCategoryOrderData,
  FinanceCategoryUpdateData,
  ExpenseCreateData,
  ExpenseUpdateData,
  FinanceBalance,
  FinanceParties,
  FinancePartyLinkData,
  FinancePartyLinkResult,
  FinanceSettings,
  FinanceSettingsUpdateData,
  FinanceSummary,
  Payout,
  PayoutCreateData,
  PayoutSignatureData,
  PayoutUpdateData,
} from '@camp-registration/common/entities';
import { hasNoCategory } from '@/utils/expenseState';

/** Which categories the expenses use, as a key that changes when that does. */
function categoryUse(list: readonly Expense[] | undefined): string {
  return (list ?? [])
    .map((expense) => `${expense.id}:${expense.categoryId ?? ''}`)
    .sort()
    .join(',');
}

/**
 * What payout statements depend on: the figures a statement freezes, and
 * whether it is paid. A description, date or file change leaves every
 * statement as it was.
 */
function statementUse(list: readonly Expense[] | undefined): string {
  return (list ?? [])
    .map(
      (e) =>
        `${e.id}:${e.type}:${e.amount.toString()}:${payerKey(e) ?? ''}:${e.paidOn === null ? 'unpaid' : 'paid'}`,
    )
    .sort()
    .join(',');
}

function ids(list: readonly Payout[] | undefined): Set<string> {
  return new Set((list ?? []).map((p) => p.id));
}

/**
 * Expenses, payouts and categories stay live; balances and the summary are
 * derived by the server, so they reload whenever either list changes —
 * here or, through realtime, elsewhere.
 */
export const useFinanceStore = defineStore('finance', () => {
  const api = useAPIService();
  const key = useRouteKey('eventId');
  const { canFor } = usePermissions();
  const profileStore = useProfileStore();

  /**
   * Everything with the full grant, otherwise what a `:own` grant reaches.
   * Waits for the profile: loaded beside the page, it would otherwise read as
   * no grant at all and leave the list at `own` until something reloads it.
   */
  async function viewFor(
    eventId: string,
    permission: ScopePermission<'event'>,
  ): Promise<RecordView> {
    if (profileStore.user === undefined) {
      await profileStore.fetchProfile();
    }
    return canFor(eventId, permission) ? 'all' : 'own';
  }

  const expenses = useCollection<Expense>({
    name: 'expense',
    key,
    fetch: async (eventId) =>
      api.fetchExpenses(eventId, {
        view: await viewFor(eventId, 'event.expenses.view'),
      }),
    realtime: {
      resource: 'expense',
      fetchOne: (eventId, id) => api.fetchExpense(eventId, id),
    },
  });

  const payouts = useCollection<Payout>({
    name: 'payout',
    key,
    fetch: async (eventId) =>
      api.fetchPayouts(eventId, await viewFor(eventId, 'event.payouts.view')),
    realtime: { resource: 'payout' },
  });

  const categories = useCollection<FinanceCategory>({
    name: 'financeCategory',
    key,
    fetch: (eventId) => api.fetchFinanceCategories(eventId),
    realtime: { resource: 'finance_category' },
  });

  // A list of their own: the expense screens never see income categories.
  const incomeCategories = useCollection<FinanceCategory>({
    name: 'financeCategory',
    key,
    fetch: (eventId) => api.fetchFinanceCategories(eventId, 'INCOME'),
    realtime: { resource: 'finance_category' },
  });

  function categoriesOf(kind: FinanceCategoryKind) {
    return kind === 'INCOME' ? incomeCategories : categories;
  }

  // Once for every view and row that names a category.
  const categoriesById = computed(
    () => new Map((categories.data.value ?? []).map((c) => [c.id, c])),
  );
  const incomeCategoriesById = computed(
    () => new Map((incomeCategories.data.value ?? []).map((c) => [c.id, c])),
  );

  const balances = useResource<FinanceBalance[]>({
    name: 'finance',
    key,
    fetch: async (eventId) =>
      api.fetchFinanceBalances(
        eventId,
        await viewFor(eventId, 'event.expenses.view'),
      ),
  });

  const summary = useResource<FinanceSummary>({
    name: 'finance',
    key,
    fetch: (eventId) => api.fetchFinanceSummary(eventId),
  });

  const parties = useResource<FinanceParties>({
    name: 'finance',
    key,
    fetch: (eventId) => api.fetchFinanceParties(eventId),
  });

  // One instance for the list and the settings dialog: own saves aren't echoed.
  const { settings: display } = useEventSettings<FinanceDisplaySettings>(
    SETTING_KEYS.FINANCES,
    { flagMissingCategories: true },
  );

  /** Without a category, unless the event doesn't sort its expenses. */
  function isMissingCategory(expense: Pick<Expense, 'categoryId'>): boolean {
    return display.flagMissingCategories && hasNoCategory(expense);
  }

  const settings = useResource<FinanceSettings>({
    name: 'finance',
    key,
    fetch: (eventId) => api.fetchFinanceSettings(eventId),
  });

  // Derived data follows every change of what it is derived from, including
  // realtime ones; a first load (nothing before) has nothing to refresh.
  // `outdated` is computed by the server from other records, so the payouts
  // reload when those change: a statement's figures, or a payout going. Then
  // balances and the summary reload once, after both.
  let followingChange = false;

  async function reloadPayouts() {
    followingChange = true;
    try {
      await payouts.reload();
    } finally {
      followingChange = false;
    }
  }

  function reloadTotals() {
    void balances.reload();
    void summary.reload();
  }

  // Income moves no balance: only the summary and its categories' counts.
  function reloadIncomeDerived() {
    void summary.reload();
    void incomeCategories.reload();
  }

  // Kept from the last change, so each change builds the keys once.
  let usedCategories = '';
  let usedInStatements = '';

  watch(expenses.data, async (next, prev) => {
    const nextCategories = categoryUse(next);
    const nextStatements = statementUse(next);
    const categoriesChanged = nextCategories !== usedCategories;
    const statementsChanged = nextStatements !== usedInStatements;
    usedCategories = nextCategories;
    usedInStatements = nextStatements;

    if (prev === undefined) {
      return;
    }
    if (categoriesChanged) {
      void categories.reload();
    }
    if (payouts.data.value !== undefined && statementsChanged) {
      await reloadPayouts();
    }
    reloadTotals();
  });

  watch(payouts.data, async (next, prev) => {
    if (prev === undefined || followingChange) {
      return;
    }
    // An undone payout drops out of the later statements it was listed on.
    const remaining = ids(next);
    if ([...ids(prev)].some((id) => !remaining.has(id))) {
      await reloadPayouts();
    }
    reloadTotals();
  });

  /** Everything the page shows except the summary, which needs its tab. */
  function fetchData() {
    return Promise.all([
      expenses.load(),
      payouts.load(),
      categories.load(),
      balances.load(),
      parties.load(),
      settings.load(),
    ]);
  }

  function loadSummary() {
    return summary.load();
  }

  /** After a failed load, which otherwise counts as loaded. */
  function retrySummary() {
    summary.invalidate();
    return summary.load();
  }

  // A free-text payer or recipient joins the suggestions.
  function reloadDerived() {
    void parties.reload();
  }

  /** Files a typed name's records under an account; both lists change. */
  async function linkParty(
    data: FinancePartyLinkData,
  ): Promise<FinancePartyLinkResult> {
    const result = await parties.mutate(
      'linkParty',
      (eventId) => api.linkFinanceParty(eventId, data),
      { reload: true, multiWrite: true, feedback: 'result' },
    );
    await Promise.all([expenses.reload(), reloadPayouts()]);
    return result;
  }

  async function createExpense(data: ExpenseCreateData): Promise<Expense> {
    const expense = await expenses.mutate(
      'create',
      (eventId) => api.createExpense(eventId, data),
      { apply: upsertById },
    );
    reloadDerived();
    return expense;
  }

  async function updateExpense(
    expenseId: string,
    data: ExpenseUpdateData,
  ): Promise<Expense> {
    const expense = await expenses.mutate(
      'update',
      (eventId) => api.updateExpense(eventId, expenseId, data),
      { apply: replaceById },
    );
    reloadDerived();
    return expense;
  }

  async function deleteExpense(expenseId: string): Promise<void> {
    await expenses.mutate(
      'delete',
      (eventId) => api.deleteExpense(eventId, expenseId),
      { apply: (list) => removeById(list, expenseId), feedback: 'result' },
    );
    reloadDerived();
  }

  async function createPayout(data: PayoutCreateData): Promise<Payout> {
    const payout = await payouts.mutate(
      'create',
      (eventId) => api.createPayout(eventId, data),
      { apply: upsertById, feedback: 'result' },
    );
    reloadDerived();
    // The first payout fixes the prefix.
    void settings.reload();
    return payout;
  }

  async function updatePayout(
    payoutId: string,
    data: PayoutUpdateData,
  ): Promise<Payout> {
    const payout = await payouts.mutate(
      'update',
      (eventId) => api.updatePayout(eventId, payoutId, data),
      { apply: replaceById },
    );
    reloadDerived();
    return payout;
  }

  /** A scan of the slip signed on paper, kept beside the earlier ones. */
  // One at a time, each from the payout as it is by then: two uploads in a
  // row would otherwise each keep only their own page.
  let scanQueue: Promise<unknown> = Promise.resolve();

  function attachPayoutScan(payout: Payout, file: File): Promise<Payout> {
    const attach = async () => {
      const uploaded = await run('uploadScan', () =>
        api.createTemporaryFile({ file }),
      );
      const current =
        payouts.data.value?.find((p) => p.id === payout.id) ?? payout;
      return updatePayout(payout.id, {
        fileIds: [...current.files.map((f) => f.id), uploaded.id],
      });
    };
    const result = scanQueue.then(attach, attach);
    scanQueue = result.catch(() => undefined);
    return result;
  }

  /** The recipient's signature under the statement. */
  function signPayout(
    payoutId: string,
    data: PayoutSignatureData,
  ): Promise<Payout> {
    return payouts.mutate(
      'sign',
      (eventId) => api.signPayout(eventId, payoutId, data),
      { apply: replaceById, feedback: 'result' },
    );
  }

  function unsignPayout(payoutId: string): Promise<Payout> {
    return payouts.mutate(
      'unsign',
      (eventId) => api.unsignPayout(eventId, payoutId),
      { apply: replaceById, feedback: 'result' },
    );
  }

  async function deletePayout(payoutId: string): Promise<void> {
    await payouts.mutate(
      'delete',
      (eventId) => api.deletePayout(eventId, payoutId),
      { apply: (list) => removeById(list, payoutId), feedback: 'result' },
    );
    reloadDerived();
  }

  function createCategory(
    data: FinanceCategoryCreateData,
    kind: FinanceCategoryKind = 'EXPENSE',
  ): Promise<FinanceCategory> {
    return categoriesOf(kind).mutate(
      'create',
      (eventId) => api.createFinanceCategory(eventId, { ...data, kind }),
      { apply: upsertById },
    );
  }

  function updateCategory(
    categoryId: string,
    data: FinanceCategoryUpdateData,
    kind: FinanceCategoryKind = 'EXPENSE',
  ): Promise<FinanceCategory> {
    return categoriesOf(kind).mutate(
      'update',
      (eventId) => api.updateFinanceCategory(eventId, categoryId, data),
      { apply: replaceById },
    );
  }

  function orderCategories(
    data: FinanceCategoryOrderData,
    kind: FinanceCategoryKind = 'EXPENSE',
  ): Promise<FinanceCategory[]> {
    return categoriesOf(kind).mutate(
      'order',
      (eventId) => api.orderFinanceCategories(eventId, data, kind),
      {
        // Shown in place while the request runs.
        optimistic: (list) =>
          list.map((category) => {
            const item = data.items.find((i) => i.id === category.id);
            return item ? { ...category, ...item } : category;
          }),
        apply: (_list, result) => result,
      },
    );
  }

  async function deleteCategory(
    categoryId: string,
    kind: FinanceCategoryKind = 'EXPENSE',
  ): Promise<void> {
    await categoriesOf(kind).mutate(
      'delete',
      (eventId) => api.deleteFinanceCategory(eventId, categoryId),
      { apply: (list) => removeById(list, categoryId) },
    );
  }

  const { run } = useAction('finance');

  /** Saves the export or a receipt ZIP; a running toast for the slow ZIPs. */
  async function download(
    kind: 'xlsx' | 'csv' | 'receipts' | 'receiptsByGroup',
  ): Promise<void> {
    const eventId = key();
    if (!eventId) {
      return;
    }
    const zip = kind === 'receipts' || kind === 'receiptsByGroup';
    const { blob, filename } = await run(
      zip ? 'downloadReceipts' : 'download',
      () =>
        zip
          ? api.downloadFinanceReceipts(
              eventId,
              kind === 'receiptsByGroup' ? 'group' : 'none',
            )
          : api.downloadFinanceExport(eventId, kind),
      { feedback: zip ? 'progress' : 'error' },
    );
    exportFile(filename ?? `finances.${zip ? 'zip' : kind}`, blob, {
      mimeType: blob.type,
    });
  }

  function updateSettings(
    data: FinanceSettingsUpdateData,
  ): Promise<FinanceSettings> {
    return settings.mutate(
      'updateSettings',
      (eventId) => api.updateFinanceSettings(eventId, data),
      { apply: (_current, result) => result, feedback: 'result' },
    );
  }

  return {
    expenses: expenses.data,
    payouts: payouts.data,
    categories: categories.data,
    categoriesById,
    incomeCategories: incomeCategories.data,
    incomeCategoriesById,
    loadIncomeCategories: () => incomeCategories.load(),
    reloadIncomeDerived,
    balances: balances.data,
    summary: summary.data,
    summaryIsLoading: summary.isLoading,
    summaryError: summary.error,
    parties: parties.data,
    settings: settings.data,
    display,
    isMissingCategory,
    isLoading: expenses.isLoading,
    error: expenses.error,
    fetchData,
    loadSummary,
    retrySummary,
    linkParty,
    createExpense,
    updateExpense,
    deleteExpense,
    createPayout,
    updatePayout,
    attachPayoutScan,
    deletePayout,
    signPayout,
    unsignPayout,
    createCategory,
    updateCategory,
    orderCategories,
    deleteCategory,
    updateSettings,
    download,
  };
});
