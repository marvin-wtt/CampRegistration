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
        <payout-statement-view :payout />

        <q-banner
          v-if="payout.outdated"
          dense
          rounded
          class="bg-error-container text-on-error-container"
        >
          <template #avatar>
            <q-icon name="error_outline" />
          </template>
          {{ t('finance.statement.outdatedNoSign') }}
        </q-banner>

        <signature-pad
          v-else
          v-model="signature"
          :label="
            t('finance.statement.signHere', { name: payout.recipientName })
          "
          :clear-label="t('finance.statement.clear')"
          data-test="payout-signature"
        >
          <!-- Phones: the whole screen, turned sideways where it can be. -->
          <template
            v-if="quasar.screen.lt.md"
            #tools
          >
            <m-btn
              :label="t('finance.statement.signLarge')"
              icon="open_in_full"
              text
              rounded
              color="primary"
              size="sm"
              data-test="payout-sign-large"
              @click="signLarge"
            />
          </template>
        </signature-pad>
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
          :disable="!signature || payout.outdated"
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
import { useDialogPluginComponent, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import type { Payout } from '@camp-registration/common/entities';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import DialogCard from '@/components/common/dialogs/DialogCard.vue';
import SignaturePad from '@/components/common/inputs/SignaturePad.vue';
import SignatureFullscreenDialog from '@/components/common/inputs/SignatureFullscreenDialog.vue';
import PayoutStatementView from '@/components/event/finances/PayoutStatementView.vue';
import { useFinanceStore } from '@/stores/finance-store';

const { payout: opened } = defineProps<{
  /** As opened; the dialog then follows the store's copy. */
  payout: Payout;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const { t } = useI18n();
const financeStore = useFinanceStore();

// Live, so a receipt changing meanwhile shows as outdated before signing.
const payout = computed(
  () => financeStore.payouts?.find((p) => p.id === opened.id) ?? opened,
);

const signature = ref<string | null>(null);
const quasar = useQuasar();

function signLarge() {
  quasar
    .dialog({
      component: SignatureFullscreenDialog,
      componentProps: {
        initial: signature.value,
        label: t('finance.statement.signHere', {
          name: payout.value.recipientName,
        }),
        clearLabel: t('finance.statement.clear'),
      },
    })
    .onOk((drawn: string | null) => {
      signature.value = drawn;
    });
}

const saving = ref(false);

async function sign() {
  if (!signature.value) {
    return;
  }
  saving.value = true;
  try {
    onDialogOK(await financeStore.signPayout(payout.value.id, signature.value));
  } catch {
    // Reported by the store.
  } finally {
    saving.value = false;
  }
}
</script>
