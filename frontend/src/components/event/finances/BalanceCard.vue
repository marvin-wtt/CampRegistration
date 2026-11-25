<template>
  <!-- One person's balance, how it came about, and their payouts. -->
  <q-card
    flat
    bordered
    class="rounded-xl column no-wrap"
    data-test="balance-card"
  >
    <q-card-section class="row items-center no-wrap q-gutter-x-md">
      <!-- A name typed in, with no account, gets the secondary tone. -->
      <q-avatar
        :color="balance.userId ? 'primary-container' : 'secondary-container'"
        :text-color="
          balance.userId ? 'on-primary-container' : 'on-secondary-container'
        "
        :icon="initial ? undefined : 'badge'"
      >
        <template v-if="initial">{{ initial }}</template>
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
      <m-btn
        v-if="linkable"
        icon="link"
        color="on-surface-variant"
        flat
        round
        :aria-label="t('link')"
        data-test="balance-link"
        @click="emit('link', match?.userId ?? null)"
      >
        <q-tooltip>{{ t('link') }}</q-tooltip>
      </m-btn>
    </q-card-section>

    <!-- The same name joined as a manager: likely one person, split in two. -->
    <q-card-section
      v-if="linkable && match"
      class="q-pt-none"
    >
      <q-banner
        dense
        rounded
        class="bg-secondary-container text-on-secondary-container"
        data-test="balance-link-hint"
      >
        {{ t('matchHint', { name: match.name }) }}
        <template #action>
          <m-btn
            :label="t('linkShort')"
            color="on-secondary-container"
            flat
            rounded
            @click="emit('link', match.userId)"
          />
        </template>
      </q-banner>
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
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import type {
  FinanceBalance,
  Payout,
  PayoutDirection,
} from '@camp-registration/common/entities';
import { initials } from '@/utils/initials';
import { useFinanceFormat } from '@/composables/financeFormat';
import {
  type PayoutStatusKey,
  usePayoutStatus,
} from '@/composables/payoutStatus';
import { usePermissions } from '@/composables/permissions';
import { useFinanceStore } from '@/stores/finance-store';
import { partyNameKey } from '@camp-registration/common/utils';

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
const emit = defineEmits<{
  open: [payout: Payout];
  pay: [PayoutDirection];
  /** File a typed name under an account; the manager it likely is. */
  link: [suggested: string | null];
}>();

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

const initial = computed(() => initials(balance.name));

const financeStore = useFinanceStore();
const { parties } = storeToRefs(financeStore);

// A typed name only, and the rights to rewrite all of its records.
const linkable = computed(
  () =>
    !balance.userId &&
    (parties.value?.managers.length ?? 0) > 0 &&
    can('event.expenses.edit', 'event.payouts.edit'),
);

// The one manager of the same name; two of one name are left to pick.
const match = computed(() => {
  const key = partyNameKey(balance.name);
  const same = (parties.value?.managers ?? []).filter(
    (m) => partyNameKey(m.name) === key,
  );
  return same.length === 1 ? same[0] : undefined;
});

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

<i18n lang="yaml" locale="en">
link: 'Link to an account'
linkShort: 'Link'
matchHint: '{name} is a manager now. Link these records to their account?'
</i18n>

<i18n lang="yaml" locale="de">
link: 'Mit einem Konto verknüpfen'
linkShort: 'Verknüpfen'
matchHint: '{name} ist jetzt Leitungsperson. Diese Einträge mit dem Konto verknüpfen?'
</i18n>

<i18n lang="yaml" locale="fr">
link: 'Rattacher à un compte'
linkShort: 'Rattacher'
matchHint: '{name} est maintenant responsable. Rattacher ces écritures à son compte ?'
</i18n>

<i18n lang="yaml" locale="pl">
link: 'Połącz z kontem'
linkShort: 'Połącz'
matchHint: '{name} jest teraz osobą zarządzającą. Połączyć te wpisy z jej kontem?'
</i18n>

<i18n lang="yaml" locale="cs">
link: 'Propojit s účtem'
linkShort: 'Propojit'
matchHint: '{name} je teď vedoucí. Propojit tyto záznamy s jeho účtem?'
</i18n>
