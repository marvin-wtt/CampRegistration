<template>
  <!-- Handed to the recipient: they read what they confirm, then sign. -->
  <responsive-dialog
    ref="dialogRef"
    :snap-points="['full']"
    @hide="onDialogHide"
  >
    <dialog-card
      :title="t('finance.statement.title', { label: payout.label })"
      :subtitle="payout.recipientName"
      icon="draw"
      :width="640"
      no-form
      @cancel="onDialogCancel"
    >
      <div class="column no-wrap q-gutter-y-md">
        <payout-statement-view
          :payout
          :statement
        />

        <signature-pad
          v-model="signature"
          :label="
            t('finance.statement.signHere', { name: payout.recipientName })
          "
          :clear-label="t('finance.statement.clear')"
          data-test="payout-signature"
        />

        <q-banner
          v-if="payout.signedAt"
          dense
          rounded
          class="bg-surface-container-high"
        >
          <template #avatar>
            <q-icon name="history_edu" />
          </template>
          {{
            t('finance.statement.signedBefore', {
              date: d(new Date(payout.signedAt), 'dateTime'),
            })
          }}
        </q-banner>
      </div>

      <template #actions>
        <m-btn
          :label="t('finance.action.cancel')"
          text
          @click="onDialogCancel"
        />
        <m-btn
          :label="t('finance.statement.sign')"
          icon="draw"
          color="primary"
          :disable="!signature"
          :loading="saving"
          data-test="payout-sign"
          @click="sign"
        />
      </template>
    </dialog-card>
  </responsive-dialog>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import type { Payout } from '@camp-registration/common/entities';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import DialogCard from '@/components/common/dialogs/DialogCard.vue';
import SignaturePad from '@/components/common/inputs/SignaturePad.vue';
import PayoutStatementView from '@/components/event/finances/PayoutStatementView.vue';
import { useFinanceStore } from '@/stores/finance-store';
import { buildPayoutStatement } from '@/utils/payoutStatement';

const { payout } = defineProps<{ payout: Payout }>();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const { t, d } = useI18n();
const financeStore = useFinanceStore();
const { expenses, payouts } = storeToRefs(financeStore);

const statement = computed(() =>
  buildPayoutStatement(payout, expenses.value ?? [], payouts.value ?? []),
);

// Always a fresh signature: signing again replaces the old one.
const signature = ref<string | null>(null);
const saving = ref(false);

async function sign() {
  if (!signature.value) {
    return;
  }
  saving.value = true;
  try {
    onDialogOK(await financeStore.signPayout(payout.id, signature.value));
  } catch {
    // Reported by the store.
  } finally {
    saving.value = false;
  }
}
</script>
