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
        <div class="column items-center text-center q-py-sm">
          <div class="text-h4 amount">{{ money(payout.amount) }}</div>
          <div class="text-body1 text-on-surface-variant">
            {{
              t(
                payout.direction === 'OUT'
                  ? 'finance.payout.details.outTo'
                  : 'finance.payout.details.inFrom',
                { name: payout.recipientName },
              )
            }}
          </div>
        </div>

        <!-- Each state with the step that changes it. -->
        <q-list>
          <q-item data-test="payout-details-paid">
            <q-item-section avatar>
              <q-icon
                :name="payout.paidOn ? 'task_alt' : 'schedule'"
                :color="payout.paidOn ? 'positive' : 'tertiary'"
              />
            </q-item-section>
            <q-item-section>
              {{
                payout.paidOn
                  ? t('finance.payout.details.paidOn', {
                      date: d(parseLocalDate(payout.paidOn), 'date'),
                    })
                  : t('finance.payout.details.toPay')
              }}
            </q-item-section>
            <q-item-section
              v-if="actions.markPaid && actions.markPaid !== primary"
              side
            >
              <m-btn
                :label="actions.markPaid.label"
                text
                rounded
                color="primary"
                @click="run(actions.markPaid)"
              />
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section avatar>
              <q-icon
                :name="signed ? 'history_edu' : 'draw'"
                :color="signed ? 'primary' : 'on-surface-variant'"
              />
            </q-item-section>
            <q-item-section>{{ signedText }}</q-item-section>
            <q-item-section
              v-if="actions.scans.length > 0"
              side
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
            </q-item-section>
          </q-item>
          <q-item v-if="payout.note">
            <q-item-section avatar>
              <q-icon
                name="notes"
                color="on-surface-variant"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label caption>
                {{ t('finance.payout.details.note') }}
              </q-item-label>
              <q-item-label>{{ payout.note }}</q-item-label>
            </q-item-section>
          </q-item>
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
          {{
            payout.paidOn
              ? t('finance.statement.correctedLaterHint')
              : t('finance.statement.outdatedHint')
          }}
        </q-banner>

        <!-- No declaration: nobody signs here. -->
        <payout-statement-view
          :payout
          :declaration="false"
          :preview="5"
        />
      </div>

      <template #actions>
        <m-btn
          v-if="actions.print !== primary"
          :label="actions.print.label"
          :icon="actions.print.icon"
          tonal
          rounded
          color="primary"
          @click="run(actions.print)"
        />
        <m-btn
          :label="primary.label"
          :icon="primary.icon"
          rounded
          color="primary"
          data-test="payout-details-primary"
          @click="run(primary)"
        />
      </template>
    </dialog-card>
  </responsive-dialog>
</template>

<script lang="ts">
export interface PayoutAction {
  label: string;
  icon: string;
  onClick: () => void;
}

/** What the viewer may do with the payout; absent where not allowed now. */
export interface PayoutActions {
  sign?: PayoutAction | undefined;
  uploadScan?: PayoutAction | undefined;
  scans: PayoutAction[];
  unsign?: PayoutAction | undefined;
  markPaid?: PayoutAction | undefined;
  markUnpaid?: PayoutAction | undefined;
  print: PayoutAction;
  copyLink: PayoutAction;
  edit?: PayoutAction | undefined;
  remove?: PayoutAction | undefined;
}
</script>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import type { Payout } from '@camp-registration/common/entities';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import DialogCard from '@/components/common/dialogs/DialogCard.vue';
import ResponsiveMenu, {
  type ResponsiveMenuItem,
} from '@/components/common/ResponsiveMenu.vue';
import PayoutStatementView from '@/components/event/finances/PayoutStatementView.vue';
import { useFinanceFormat } from '@/composables/financeFormat';
import { parseLocalDate } from '@/utils/date';
import { useFinanceStore } from '@/stores/finance-store';

const { payout: opened, actionsFor } = defineProps<{
  /** As opened; the dialog then follows the store's copy. */
  payout: Payout;
  /** Built from the current payout, so they follow each change. */
  actionsFor: (payout: Payout) => PayoutActions;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent();

const { t, d } = useI18n();
const { money } = useFinanceFormat();
const financeStore = useFinanceStore();

// Stays open through its actions and shows their outcome.
const current = computed(
  () => financeStore.payouts?.find((p) => p.id === opened.id) ?? null,
);
const payout = computed(() => current.value ?? opened);
const actions = computed(() => actionsFor(payout.value));

// Undone, here or by someone else: nothing left to show.
watch(current, (found) => {
  if (found === null) {
    onDialogCancel();
  }
});

const signed = computed(
  () => payout.value.signedAt !== null || payout.value.files.length > 0,
);

const signedText = computed(() => {
  const { signedAt, files } = payout.value;
  if (signedAt) {
    return t('finance.payout.details.signedOn', {
      date: d(new Date(signedAt), 'date'),
    });
  }
  return files.length > 0
    ? t('finance.payout.details.signedScan')
    : t('finance.payout.details.unsigned');
});

// The next step leads: signing, then paying, then the slip.
const primary = computed(
  () => actions.value.sign ?? actions.value.markPaid ?? actions.value.print,
);

const menu = computed<ResponsiveMenuItem[]>(() => {
  const { edit, copyLink, markUnpaid, uploadScan, unsign, remove } =
    actions.value;
  return [edit, copyLink, markUnpaid, uploadScan, unsign, remove]
    .filter((a): a is PayoutAction => a !== undefined)
    .map((a) => ({
      ...a,
      color: a === unsign || a === remove ? 'negative' : undefined,
      onClick: () => run(a),
    }));
});

// Changes apply in place; signing and editing open on top and return here.
function run(action: PayoutAction) {
  action.onClick();
}
</script>

<style scoped>
.amount {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
</style>
