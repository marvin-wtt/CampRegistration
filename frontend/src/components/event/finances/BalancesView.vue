<template>
  <div class="column no-wrap balances-view">
    <!-- What is left to do, by the same rule as each card's status. -->
    <finance-totals-strip
      v-if="viewsAll && balances.length > 0"
      :alert="toComeBack > 0"
      data-test="balance-totals"
    >
      <div class="figures row items-end">
        <finance-figure
          :label="t('finance.balance.stillOpen')"
          :value="money(stillOpen)"
          lead
        />
        <finance-figure
          :label="t('finance.balance.agreedUnpaid')"
          :value="money(agreedUnpaid)"
        />
        <!-- Rare: only while someone owes the event. -->
        <finance-figure
          v-if="toComeBack > 0"
          :label="t('finance.balance.toComeBack')"
          :value="money(toComeBack)"
          tone="warning"
        />
      </div>
      <div class="row items-center no-wrap q-gutter-x-md q-mt-sm">
        <q-linear-progress
          :value="settled / balances.length"
          color="primary"
          track-color="surface-container-highest"
          rounded
          size="6px"
          class="col"
        />
        <span class="text-caption text-on-surface-variant no-wrap">
          {{
            t('finance.balance.settledProgress', {
              settled,
              total: balances.length,
            })
          }}
        </span>
      </div>
    </finance-totals-strip>

    <div
      v-if="balances.length === 0"
      class="column items-center q-py-xl text-center"
    >
      <q-icon
        name="account_balance_wallet"
        size="56px"
        class="text-on-surface-variant"
      />
      <div class="text-h6 q-mt-md">{{ t('finance.balance.emptyTitle') }}</div>
      <div class="text-body2 text-on-surface-variant q-mt-xs">
        {{ t('finance.balance.emptyMessage') }}
      </div>
    </div>

    <div
      v-else
      class="balance-grid"
    >
      <balance-card
        v-for="balance in balances"
        :key="balance.userId ?? balance.name"
        :balance
        :payouts="payoutsOf(balance)"
        :linked-payout-id="linkedPayoutId"
        @open="dialogs.payoutDetails"
        @pay="(direction) => pay(balance, direction)"
      />
    </div>

    <!-- Explains the cards; with none, the empty state says enough. -->
    <p
      v-if="balances.length > 0"
      class="text-caption text-on-surface-variant q-mb-none"
    >
      {{
        viewsAll ? t('finance.balance.formula') : t('finance.balance.ownOnly')
      }}
    </p>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import type {
  FinanceBalance,
  Payout,
  PayoutDirection,
} from '@camp-registration/common/entities';
import { partyKey, recipientKey } from '@camp-registration/common/utils';
import BalanceCard from '@/components/event/finances/BalanceCard.vue';
import FinanceFigure from '@/components/event/finances/FinanceFigure.vue';
import FinanceTotalsStrip from '@/components/event/finances/FinanceTotalsStrip.vue';
import { useFinanceDialogs } from '@/composables/financeDialogs';
import { useFinanceFormat } from '@/composables/financeFormat';
import { usePayoutActions } from '@/composables/payoutActions';
import { usePermissions } from '@/composables/permissions';
import { useFinanceStore } from '@/stores/finance-store';

const { balances, payouts } = defineProps<{
  balances: readonly FinanceBalance[];
  payouts: readonly Payout[];
}>();

const { t } = useI18n();
const { can } = usePermissions();
const { money } = useFinanceFormat();
const { create, sign, awaitsSignature } = usePayoutActions();
const dialogs = useFinanceDialogs();
const financeStore = useFinanceStore();
const route = useRoute();
const router = useRouter();
const quasar = useQuasar();
const viewsAll = computed(() => can('event.expenses.view'));

function payoutsOf(balance: FinanceBalance): Payout[] {
  const key = partyKey(balance.userId, balance.name);
  return payouts.filter((p) => recipientKey(p) === key);
}

// Nothing arranged yet: a payout is still to be made.
const stillOpen = computed(() =>
  balances.reduce((sum, b) => sum + Math.max(b.open, 0), 0),
);
// Arranged, but the money hasn't moved yet.
const agreedUnpaid = computed(() =>
  balances.reduce((sum, b) => sum + b.toPay, 0),
);
const toComeBack = computed(() =>
  balances.reduce((sum, b) => sum + Math.max(-b.balance, 0), 0),
);
const settled = computed(() => balances.filter((b) => b.balance === 0).length);

// --- Links: `?tab=balances&payout=<id>` opens a payout, e.g. to sign it ----

const linkedPayoutId = ref<string | null>(null);

function openLinkedPayout(id: string) {
  const payout = payouts.find((p) => p.id === id);
  if (!payout) {
    quasar.notify({ type: 'warning', message: t('finance.payout.notFound') });
    return;
  }

  linkedPayoutId.value = id;
  document
    .getElementById(`payout-${id}`)
    ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  if (awaitsSignature(payout)) {
    sign(payout);
  }
}

// Payouts and parties load beside the expenses this view waits for, so the
// link is handled once both are in. The parameter is consumed, so a reload
// doesn't reopen the dialog.
onMounted(() => {
  const id = route.query.payout;
  if (typeof id !== 'string') {
    return;
  }
  void router.replace({ query: { ...route.query, payout: undefined } });
  let handled = false;
  watch(
    () =>
      financeStore.payouts !== undefined && financeStore.parties !== undefined,
    async (ready) => {
      if (!ready || handled) {
        return;
      }
      handled = true;
      await nextTick();
      openLinkedPayout(id);
    },
    { immediate: true },
  );
});

// After creating, its details open: the next step is signing it.
function pay(balance: FinanceBalance, direction: PayoutDirection) {
  create(balance, direction, dialogs.payoutDetails);
}
</script>

<style scoped>
.balances-view {
  gap: 24px;
}

.balance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.figures {
  gap: 8px 32px;
}
</style>
