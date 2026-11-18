<template>
  <!-- One person's balance, how it came about, and their payouts. -->
  <q-card
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
        <template v-if="balance.userId">{{ initial }}</template>
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
      <div class="text-h4 text-amount">{{ money(balance.balance) }}</div>
      <q-badge
        v-bind="status"
        class="q-mt-xs status-badge"
      />
    </q-card-section>

    <q-card-section class="q-pt-none">
      <dl class="breakdown">
        <dt>{{ t('finance.balance.paid') }}</dt>
        <dd>{{ money(balance.paid) }}</dd>
        <!-- Refunds and money handed back are rare: shown when there are any. -->
        <template v-if="balance.refunds > 0">
          <dt>{{ t('finance.balance.refunds') }}</dt>
          <dd>{{ money(balance.refunds) }}</dd>
        </template>
        <dt>{{ t('finance.balance.paidOut') }}</dt>
        <dd>{{ money(balance.paidOut) }}</dd>
        <template v-if="balance.paidBack > 0">
          <dt>{{ t('finance.balance.paidBack') }}</dt>
          <dd>{{ money(balance.paidBack) }}</dd>
        </template>
        <template v-if="balance.toPay > 0">
          <dt class="text-tertiary">{{ t('finance.balance.toPay') }}</dt>
          <dd class="text-tertiary">{{ money(balance.toPay) }}</dd>
        </template>
        <template v-if="balance.toReceive > 0">
          <dt class="text-tertiary">{{ t('finance.balance.toReceive') }}</dt>
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
        v-if="payouts.length === 0"
        class="text-body2 text-on-surface-variant"
      >
        {{ t('finance.balance.noPayouts') }}
      </div>
      <q-list dense>
        <!-- One status word per payout: what is left to do, readable on
             touch where a tooltip never opens. -->
        <q-item
          v-for="{ payout, status: payoutState } in rows"
          :id="`payout-${payout.id}`"
          :key="payout.id"
          clickable
          class="q-px-none rounded-sm"
          :class="{ 'payout-linked': linkedPayoutId === payout.id }"
          data-test="payout-item"
          @click="emit('open', payout)"
        >
          <q-item-section>
            <q-item-label class="row items-center no-wrap q-gutter-x-sm">
              <span class="text-mono">{{ payout.label }}</span>
              <q-badge
                :color="payoutState.color"
                :text-color="payoutState.textColor"
                :data-test="`payout-status-${payoutState.key}`"
              >
                <q-icon
                  v-if="payoutState.icon"
                  :name="payoutState.icon"
                  size="14px"
                  class="q-mr-xs"
                />
                {{ payoutState.label }}
              </q-badge>
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
            class="text-amount text-on-surface"
          >
            {{ payout.direction === 'OUT' ? '−' : '+'
            }}{{ money(payout.amount) }}
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>

    <!-- The open balance's direction leads; the other stays at hand for an
         advance or money handed back early. -->
    <q-card-actions
      v-if="can('event.payouts.create')"
      class="q-pa-md q-gutter-sm"
    >
      <m-btn
        :label="t('finance.action.payOut')"
        color="primary"
        :text="balance.open <= 0"
        rounded
        class="col"
        data-test="balance-pay-out"
        @click="emit('pay', 'OUT')"
      />
      <m-btn
        :label="t('finance.action.receive')"
        color="primary"
        :text="balance.open >= 0"
        rounded
        class="col"
        @click="emit('pay', 'IN')"
      />
    </q-card-actions>
  </q-card>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import type {
  FinanceBalance,
  Payout,
  PayoutDirection,
} from '@camp-registration/common/entities';
import { useFinanceFormat } from '@/composables/financeFormat';
import {
  type PayoutStatusKey,
  usePayoutStatus,
} from '@/composables/payoutStatus';
import { usePermissions } from '@/composables/permissions';

const {
  balance,
  payouts,
  linkedPayoutId = null,
} = defineProps<{
  balance: FinanceBalance;
  /** This person's payouts, by number. */
  payouts: readonly Payout[];
  /** Highlighted: the payout a link pointed at. */
  linkedPayoutId?: string | null;
}>();

// Handled by the list, so a card per person needn't set up the dialogs.
const emit = defineEmits<{ open: [payout: Payout]; pay: [PayoutDirection] }>();

const { t } = useI18n();
const { can } = usePermissions();
const { money } = useFinanceFormat();
const { status: payoutStatus } = usePayoutStatus();

const STATUS_STYLE: Record<
  PayoutStatusKey,
  { color: string; textColor: string; icon?: string }
> = {
  outdated: { color: 'error-container', textColor: 'on-error-container' },
  unsigned: { color: 'tertiary-container', textColor: 'on-tertiary-container' },
  toPay: { color: 'warning-container', textColor: 'on-warning-container' },
  toReceive: { color: 'warning-container', textColor: 'on-warning-container' },
  // Done is quiet: open payouts stand out on a card with many.
  done: { color: 'transparent', textColor: 'positive', icon: 'check' },
};

const rows = computed(() =>
  payouts.map((payout) => {
    const status = payoutStatus(payout);
    return { payout, status: { ...status, ...STATUS_STYLE[status.key] } };
  }),
);

const initial = computed(() => balance.name.trim().charAt(0).toUpperCase());

// By what is left to arrange: an agreed payout no longer reads as owed.
const status = computed(() => {
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
});
</script>

<style scoped>
.status-badge {
  padding: 4px 10px;
}

.payout-linked {
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
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
</style>
