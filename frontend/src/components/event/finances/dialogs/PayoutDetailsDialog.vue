<template>
  <!-- What a payout is: amount, state, and the statement as printed. -->
  <responsive-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <dialog-card
      :title="t('finance.statement.title', { label: payout.label })"
      :subtitle="
        t('finance.payout.details.created', {
          date: d(new Date(payout.createdAt), 'date'),
        })
      "
      :icon="payout.direction === 'OUT' ? 'payments' : 'savings'"
      :width="560"
      no-form
      closable
      @cancel="onDialogCancel"
    >
      <template #header-actions>
        <responsive-menu
          v-if="menu.length > 0"
          :items="menu"
          :label="t('finance.balance.payoutActions')"
          :title="`${payout.label} · ${payout.recipientName}`"
        />
      </template>

      <div class="column no-wrap q-gutter-y-md">
        <finance-hero
          :amount="money(payout.amount)"
          :caption="
            t(
              payout.direction === 'OUT'
                ? 'finance.payout.details.outTo'
                : 'finance.payout.details.inFrom',
              { name: payout.recipientName },
            )
          "
        />

        <!-- Each state with the step that changes it. -->
        <q-list>
          <detail-row
            :icon="payout.paidOn ? 'task_alt' : 'schedule'"
            :tone="payout.paidOn ? 'positive' : 'tertiary'"
            :value="paidText(payout)"
            data-test="payout-details-paid"
          >
            <template
              v-if="actions.markPaid && actions.markPaid !== primary"
              #side
            >
              <m-btn
                :label="actions.markPaid.label"
                text
                rounded
                color="primary"
                @click="actions.markPaid.onClick()"
              />
            </template>
          </detail-row>
          <detail-row
            :icon="signed ? 'history_edu' : 'draw'"
            :tone="signed ? 'primary' : undefined"
            :value="signedText(payout)"
          >
            <template
              v-if="actions.scans.length > 0"
              #side
            >
              <div class="row no-wrap">
                <m-btn
                  v-for="scan in actions.scans"
                  :key="scan.label"
                  :icon="scan.icon"
                  :aria-label="scan.label"
                  flat
                  round
                  color="primary"
                  @click="scan.onClick()"
                >
                  <q-tooltip>{{ scan.label }}</q-tooltip>
                </m-btn>
              </div>
            </template>
          </detail-row>
          <detail-row
            v-if="payout.note"
            icon="notes"
            :label="t('finance.payout.details.note')"
            :value="payout.note"
          />
          <detail-row
            v-if="payout.bankAccount"
            icon="account_balance"
            :label="t('finance.payout.details.bankAccount')"
            wrap
            data-test="payout-details-bank"
          >
            {{ payout.bankAccount.holder }}
            <div class="text-mono">
              {{ formatIban(payout.bankAccount.iban) }}
              <template v-if="payout.bankAccount.bic">
                · {{ payout.bankAccount.bic }}
              </template>
            </div>
            <template #side>
              <m-btn
                icon="content_copy"
                :aria-label="t('finance.payout.details.copyIban')"
                flat
                round
                color="primary"
                @click="copyIban(payout.bankAccount.iban)"
              >
                <q-tooltip>{{
                  t('finance.payout.details.copyIban')
                }}</q-tooltip>
              </m-btn>
            </template>
          </detail-row>
        </q-list>

        <q-banner
          v-if="payout.outdated"
          dense
          rounded
          class="bg-error-container text-on-error-container"
        >
          <template #avatar>
            <q-icon name="error_outline" />
          </template>
          {{ outdatedHint(payout) }}
        </q-banner>

        <!-- No declaration: nobody signs here. -->
        <payout-statement-view
          :payout
          :declaration="false"
          :preview="5"
        />
      </div>

      <template #actions>
        <!-- Beside the next step on a phone, the slip is an icon only, so
             the two never stack. -->
        <m-btn
          v-if="actions.print !== primary"
          :label="quasar.screen.lt.sm ? undefined : actions.print.label"
          :aria-label="actions.print.label"
          :icon="actions.print.icon"
          :round="quasar.screen.lt.sm"
          :rounded="!quasar.screen.lt.sm"
          tonal
          color="primary"
          @click="actions.print.onClick()"
        >
          <q-tooltip v-if="quasar.screen.lt.sm">
            {{ actions.print.label }}
          </q-tooltip>
        </m-btn>
        <m-btn
          :label="primary.label"
          :icon="primary.icon"
          rounded
          color="primary"
          data-test="payout-details-primary"
          @click="primary.onClick()"
        />
      </template>
    </dialog-card>
  </responsive-dialog>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import { copyToClipboard, useDialogPluginComponent, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import type { Payout } from '@camp-registration/common/entities';
import { formatIban } from '@camp-registration/common/utils';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import DialogCard from '@/components/common/dialogs/DialogCard.vue';
import ResponsiveMenu, {
  type ResponsiveMenuItem,
} from '@/components/common/ResponsiveMenu.vue';
import DetailRow from '@/components/event/finances/DetailRow.vue';
import FinanceHero from '@/components/event/finances/FinanceHero.vue';
import PayoutStatementView from '@/components/event/finances/PayoutStatementView.vue';
import { useFinanceFormat } from '@/composables/financeFormat';
import { usePayoutActions } from '@/composables/payoutActions';
import { isSigned, usePayoutStatus } from '@/composables/payoutStatus';
import { useFinanceStore } from '@/stores/finance-store';

const { payout: opened } = defineProps<{
  /** As opened; the dialog then follows the store's copy. */
  payout: Payout;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent();

const { t, d } = useI18n();
const { money } = useFinanceFormat();
const { paidText, signedText, outdatedHint } = usePayoutStatus();
const { actionsFor } = usePayoutActions();
const financeStore = useFinanceStore();
const quasar = useQuasar();

// Without spaces: banking apps take it as one value.
function copyIban(iban: string) {
  copyToClipboard(iban)
    .then(() =>
      quasar.notify({
        type: 'positive',
        message: t('finance.payout.details.ibanCopied'),
      }),
    )
    .catch(() =>
      quasar.notify({
        type: 'negative',
        message: t('finance.payout.details.copyFailed'),
      }),
    );
}

// Stays open through its actions and shows their outcome; signing and
// editing open on top and return here.
const current = computed(
  () => financeStore.payouts?.find((p) => p.id === opened.id) ?? null,
);
const payout = computed(() => current.value ?? opened);
const actions = computed(() => actionsFor(payout.value));
const signed = computed(() => isSigned(payout.value));

// Undone, here or by someone else: nothing left to show.
watch(current, (found) => {
  if (found === null) {
    onDialogCancel();
  }
});

// The next step leads: signing, then paying, then the slip.
const primary = computed(
  () => actions.value.sign ?? actions.value.markPaid ?? actions.value.print,
);

const menu = computed<ResponsiveMenuItem[]>(() => {
  const { edit, copyLink, markUnpaid, uploadScan, unsign, remove } =
    actions.value;
  return [edit, copyLink, markUnpaid, uploadScan, unsign, remove]
    .filter((a) => a !== undefined)
    .map((a) => ({
      ...a,
      color: a === unsign || a === remove ? 'negative' : undefined,
    }));
});
</script>
