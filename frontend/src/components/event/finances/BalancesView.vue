<template>
  <div class="column no-wrap balances-view">
    <div
      v-if="viewsAll"
      class="row q-col-gutter-md"
    >
      <div class="col-12 col-sm-4">
        <div class="stat-tile stat-tile--primary rounded-lg column q-pa-md">
          <span class="text-body2">{{
            t('finance.balance.owedToPeople')
          }}</span>
          <span class="text-h5 amount">{{ money(owedToPeople) }}</span>
        </div>
      </div>
      <div class="col-12 col-sm-4">
        <div class="stat-tile stat-tile--warning rounded-lg column q-pa-md">
          <span class="text-body2">{{ t('finance.balance.owedToEvent') }}</span>
          <span class="text-h5 amount">{{ money(owedToEvent) }}</span>
        </div>
      </div>
      <div class="col-12 col-sm-4">
        <div class="stat-tile rounded-lg column q-pa-md">
          <span class="text-body2 text-on-surface-variant">
            {{ t('finance.balance.settled') }}
          </span>
          <span class="text-h5">
            {{
              t('finance.balance.settledCount', {
                settled,
                total: balances.length,
              })
            }}
          </span>
        </div>
      </div>
    </div>

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
      <q-card
        v-for="balance in balances"
        :key="balance.userId ?? balance.name"
        flat
        bordered
        class="rounded-xl column no-wrap"
        data-test="balance-card"
      >
        <q-card-section class="row items-center no-wrap q-gutter-x-md">
          <q-avatar
            color="primary-container"
            text-color="on-primary-container"
            :icon="balance.userId ? undefined : 'badge'"
          >
            <template v-if="balance.userId">{{
              initial(balance.name)
            }}</template>
          </q-avatar>
          <div class="col">
            <div class="text-subtitle1 text-weight-medium ellipsis">
              {{ balance.name }}
            </div>
            <div class="text-caption text-on-surface-variant">
              {{
                balance.userId
                  ? t('finance.balance.manager')
                  : t('finance.balance.other')
              }}
            </div>
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="text-h4 amount">{{ money(balance.balance) }}</div>
          <q-badge
            v-bind="status(balance)"
            class="q-mt-xs status-badge"
          />
        </q-card-section>

        <q-card-section class="q-pt-none">
          <dl class="breakdown">
            <dt>{{ t('finance.balance.paid') }}</dt>
            <dd>{{ money(balance.paid) }}</dd>
            <dt>{{ t('finance.balance.refunds') }}</dt>
            <dd>{{ money(balance.refunds) }}</dd>
            <dt>{{ t('finance.balance.paidOut') }}</dt>
            <dd>{{ money(balance.paidOut) }}</dd>
            <dt>{{ t('finance.balance.paidBack') }}</dt>
            <dd>{{ money(balance.paidBack) }}</dd>
            <template v-if="balance.toPay > 0">
              <dt class="text-tertiary">{{ t('finance.balance.toPay') }}</dt>
              <dd class="text-tertiary">{{ money(balance.toPay) }}</dd>
            </template>
            <template v-if="balance.toReceive > 0">
              <dt class="text-tertiary">
                {{ t('finance.balance.toReceive') }}
              </dt>
              <dd class="text-tertiary">{{ money(balance.toReceive) }}</dd>
            </template>
          </dl>
        </q-card-section>

        <q-separator inset />

        <q-card-section class="col">
          <div class="text-overline text-on-surface-variant">
            {{ t('finance.balance.payouts') }}
          </div>
          <div
            v-if="payoutsOf(balance).length === 0"
            class="text-body2 text-on-surface-variant"
          >
            {{ t('finance.balance.noPayouts') }}
          </div>
          <q-list dense>
            <q-item
              v-for="payout in payoutsOf(balance)"
              :id="`payout-${payout.id}`"
              :key="payout.id"
              :clickable="can('event.payouts.edit')"
              class="q-px-none rounded-sm"
              :class="{ 'payout-linked': linkedPayoutId === payout.id }"
              @click="can('event.payouts.edit') && dialogs.editPayout(payout)"
            >
              <q-item-section>
                <q-item-label class="payout-line text-body2">
                  <span class="receipt-mono">{{ payout.label }}</span>
                  <q-icon
                    v-if="payout.signedAt"
                    name="verified"
                    color="positive"
                    size="16px"
                    class="q-ml-xs"
                  >
                    <q-tooltip>{{ t('finance.statement.signed') }}</q-tooltip>
                  </q-icon>
                  ·
                  <template v-if="payout.paidOn">
                    {{ d(parseLocalDate(payout.paidOn), 'date') }}
                  </template>
                  <q-badge
                    v-else
                    color="tertiary-container"
                    text-color="on-tertiary-container"
                    :label="t('finance.payout.toPay')"
                  />
                </q-item-label>
                <q-item-label
                  v-if="payout.note"
                  caption
                  class="ellipsis"
                >
                  {{ payout.note }}
                </q-item-label>
              </q-item-section>
              <q-item-section
                side
                class="amount"
              >
                {{ payout.direction === 'OUT' ? '−' : '+'
                }}{{ money(payout.amount) }}
              </q-item-section>
              <q-item-section side>
                <responsive-menu
                  :items="payoutActions(payout)"
                  :label="t('finance.balance.payoutActions')"
                  :title="`${payout.label} · ${payout.recipientName}`"
                  size="sm"
                  @click.stop
                />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-actions
          v-if="can('event.payouts.create')"
          class="q-pa-md q-gutter-sm"
        >
          <m-btn
            :label="t('finance.action.payOut')"
            :color="balance.open > 0 ? 'primary' : undefined"
            :tonal="balance.open <= 0"
            class="col"
            data-test="balance-pay-out"
            @click="dialogs.payout(balance, 'OUT')"
          />
          <m-btn
            :label="t('finance.action.receive')"
            :color="balance.open < 0 ? 'primary' : undefined"
            :tonal="balance.open >= 0"
            class="col"
            @click="dialogs.payout(balance, 'IN')"
          />
        </q-card-actions>
      </q-card>
    </div>

    <p class="text-caption text-on-surface-variant q-mb-none">
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
import { copyToClipboard, useQuasar } from 'quasar';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import type {
  FinanceBalance,
  Payout,
} from '@camp-registration/common/entities';
import { useFinanceFormat } from '@/composables/financeFormat';
import { useFinanceDialogs } from '@/composables/financeDialogs';
import { usePermissions } from '@/composables/permissions';
import ResponsiveMenu, {
  type ResponsiveMenuItem,
} from '@/components/common/ResponsiveMenu.vue';
import { usePayoutSlip } from '@/composables/payoutSlip';
import { useFinanceStore } from '@/stores/finance-store';
import { formatLocalDate, parseLocalDate } from '@/utils/date';

const { balances, payouts } = defineProps<{
  balances: readonly FinanceBalance[];
  payouts: readonly Payout[];
}>();

const { t, d } = useI18n();
const { can, canOn } = usePermissions();
const { money } = useFinanceFormat();
const dialogs = useFinanceDialogs();
const financeStore = useFinanceStore();
const route = useRoute();
const router = useRouter();
const quasar = useQuasar();
const viewsAll = computed(() => can('event.expenses.view'));

// --- Links: `?tab=balances&payout=<id>` opens a payout, e.g. to sign it ----

const linkedPayoutId = ref<string | null>(null);

function payoutLink(payout: Payout): string {
  const { href } = router.resolve({
    name: 'management.event.finances',
    params: route.params,
    query: { tab: 'balances', payout: payout.id },
  });
  return window.location.origin + href;
}

async function copyPayoutLink(payout: Payout) {
  try {
    await copyToClipboard(payoutLink(payout));
    quasar.notify({
      type: 'positive',
      message: t('finance.payout.linkCopied'),
      icon: 'assignment_turned_in',
    });
  } catch {
    quasar.notify({
      type: 'negative',
      message: t('finance.payout.linkFailed'),
    });
  }
}

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
  if (canSign(payout) && !payout.signedAt) {
    dialogs.signPayout(payout);
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

const owedToPeople = computed(() =>
  balances.reduce((sum, b) => sum + Math.max(b.balance, 0), 0),
);
const owedToEvent = computed(() =>
  balances.reduce((sum, b) => sum + Math.max(-b.balance, 0), 0),
);
const settled = computed(() => balances.filter((b) => b.balance === 0).length);

const printSlip = usePayoutSlip();

function canSign(payout: Payout): boolean {
  return canOn('event.payouts.sign', payout);
}

/** The transfer is made: today, editable afterwards like any date. */
function markPaid(payout: Payout) {
  financeStore
    .updatePayout(payout.id, { paidOn: formatLocalDate(new Date()) })
    .catch(() => undefined);
}

function payoutActions(payout: Payout): ResponsiveMenuItem[] {
  return [
    {
      label: payout.signedAt
        ? t('finance.statement.signAgain')
        : t('finance.statement.sign'),
      icon: 'draw',
      hidden: !canSign(payout),
      onClick: () => dialogs.signPayout(payout),
    },
    {
      label: t('finance.statement.unsign.action'),
      icon: 'edit_off',
      hidden: !payout.signedAt || !can('event.payouts.edit'),
      onClick: () => dialogs.unsignPayout(payout),
    },
    {
      label: t('finance.payout.markPaid'),
      icon: 'task_alt',
      hidden: !!payout.paidOn || !can('event.payouts.edit'),
      onClick: () => markPaid(payout),
    },
    {
      label: t('finance.action.printSlip'),
      icon: 'print',
      onClick: () => printSlip(payout),
    },
    {
      label: t('finance.payout.copyLink'),
      icon: 'link',
      onClick: () => void copyPayoutLink(payout),
    },
    {
      label: t('finance.payout.editTitle'),
      icon: 'edit',
      hidden: !can('event.payouts.edit'),
      onClick: () => dialogs.editPayout(payout),
    },
  ];
}

function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

function payoutsOf(balance: FinanceBalance): Payout[] {
  return payouts.filter((p) =>
    balance.userId
      ? p.recipientUserId === balance.userId
      : !p.recipientUserId && p.recipientName === balance.name,
  );
}

// By what is left to arrange: an agreed payout no longer reads as owed.
function status(balance: FinanceBalance) {
  const first = balance.name.split(' ')[0] ?? balance.name;
  if (balance.open > 0) {
    return {
      color: 'primary-container',
      textColor: 'on-primary-container',
      label: t('finance.balance.eventOwes', { name: first }),
    };
  }
  if (balance.open < 0) {
    return {
      color: 'warning-container',
      textColor: 'on-warning-container',
      label: t('finance.balance.owesEvent', { name: first }),
    };
  }
  if (balance.balance !== 0) {
    return {
      color: 'tertiary-container',
      textColor: 'on-tertiary-container',
      label: t('finance.balance.pending'),
    };
  }
  return {
    color: 'positive-container',
    textColor: 'on-positive-container',
    label: t('finance.balance.settled'),
  };
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

.stat-tile {
  background: var(--md3-surface-container);
  gap: 4px;
}

.stat-tile--primary {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
}

.stat-tile--warning {
  background: var(--md3-warning-container);
  color: var(--md3-on-warning-container);
}

.amount {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* Label, signed mark and date stay on one line. */
.payout-line {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.payout-linked {
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}

.status-badge {
  padding: 4px 10px;
}

.breakdown {
  display: grid;
  grid-template-columns: 1fr auto;
  row-gap: 4px;
  margin: 0;
}

.breakdown dt {
  color: var(--md3-on-surface-variant);
}

.breakdown dd {
  margin: 0;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.receipt-mono {
  font-family: 'Roboto Mono', ui-monospace, monospace;
}
</style>
