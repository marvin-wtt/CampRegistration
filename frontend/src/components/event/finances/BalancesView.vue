<template>
  <finance-tab-layout loose>
    <!-- What is left to do, by the same rule as each card's status. -->
    <finance-headline
      v-if="viewsAll && balances.length > 0"
      :icon="allSettled ? 'task_alt' : 'account_balance_wallet'"
      :eyebrow="t('headline.toPay')"
      :amount="allSettled ? t('headline.allSettled') : money(stillOpen)"
      :amount-tone="allSettled ? 'positive' : undefined"
      :accent="allSettled ? 'positive' : 'primary'"
      :caption="allSettled ? undefined : t('headline.people', openPeople)"
      :badge="{
        label: t('finance.balance.settledProgress', {
          settled,
          total: balances.length,
        }),
        tone: allSettled ? 'positive' : 'primary',
        icon: allSettled ? 'check' : 'group',
      }"
      :segments="[
        { key: 'settled', value: settled, tone: 'positive' },
        { key: 'agreed', value: agreedPeople, tone: 'info' },
        {
          key: 'open',
          value: balances.length - settled - agreedPeople,
          tone: 'neutral',
        },
      ]"
      :stats="[
        {
          key: 'agreed',
          label: t('headline.agreed'),
          value: money(agreedUnpaid),
          tone: 'info',
          shown: agreedUnpaid > 0,
        },
        {
          key: 'back',
          label: t('headline.toComeBack'),
          value: money(toComeBack),
          tone: 'warning',
          shown: toComeBack > 0,
        },
      ]"
      data-test="balance-totals"
    />

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
  </finance-tab-layout>
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
import FinanceHeadline from '@/components/event/finances/FinanceHeadline.vue';
import FinanceTabLayout from '@/components/event/finances/FinanceTabLayout.vue';
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
// Arranged but not paid yet: neither settled nor still to arrange.
const agreedPeople = computed(
  () => balances.filter((b) => b.balance !== 0 && b.toPay > 0).length,
);
const openPeople = computed(
  () => balances.filter((b) => b.balance !== 0).length,
);
const allSettled = computed(
  () => settled.value === balances.length && agreedUnpaid.value === 0,
);

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
.balance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
</style>

<i18n lang="yaml" locale="en">
headline:
  toPay: 'Still to pay out'
  allSettled: 'All settled'
  people: '{n} person not settled | {n} people not settled'
  agreed: 'Agreed, not transferred'
  toComeBack: 'To come back'
</i18n>

<i18n lang="yaml" locale="de">
headline:
  toPay: 'Noch auszuzahlen'
  allSettled: 'Alles ausgeglichen'
  people: '{n} Person nicht ausgeglichen | {n} Personen nicht ausgeglichen'
  agreed: 'Vereinbart, nicht überwiesen'
  toComeBack: 'Zurückzubekommen'
</i18n>

<i18n lang="yaml" locale="fr">
headline:
  toPay: 'Encore à rembourser'
  allSettled: 'Tout est réglé'
  people: '{n} personne non réglée | {n} personnes non réglées'
  agreed: 'Convenu, pas encore viré'
  toComeBack: 'À récupérer'
</i18n>

<i18n lang="yaml" locale="pl">
headline:
  toPay: 'Jeszcze do wypłaty'
  allSettled: 'Wszystko rozliczone'
  people: 'Nierozliczone osoby: {n}'
  agreed: 'Uzgodniono, nie przelano'
  toComeBack: 'Do odzyskania'
</i18n>

<i18n lang="yaml" locale="cs">
headline:
  toPay: 'Zbývá vyplatit'
  allSettled: 'Vše vyrovnáno'
  people: 'Nevyrovnané osoby: {n}'
  agreed: 'Dohodnuto, nepřevedeno'
  toComeBack: 'K vrácení'
</i18n>
