<template>
  <responsive-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <dialog-card
      :title="t('finance.settings.title')"
      icon="tag"
      @submit="save"
      @cancel="onDialogCancel"
    >
      <div class="column no-wrap q-gutter-y-md">
        <p class="text-body2 text-on-surface-variant q-mb-none">
          {{ t('finance.settings.prefixHint') }}
        </p>
        <q-input
          v-model="prefix"
          :label="t('finance.settings.prefix')"
          :disable="locked"
          :rules="[
            (val: string) =>
              /^[\p{L}\p{N}-]{0,8}$/u.test(val) ||
              t('finance.validation.prefix'),
          ]"
          maxlength="8"
          outlined
          rounded
          hide-bottom-space
          data-test="finance-prefix"
        >
          <template #append>
            <span class="text-body2 text-on-surface-variant">
              {{ t('finance.settings.example', { label: `${prefix}1` }) }}
            </span>
          </template>
        </q-input>
        <q-banner
          v-if="locked"
          dense
          rounded
          class="bg-surface-container-high"
        >
          <template #avatar>
            <q-icon name="lock" />
          </template>
          {{ t('finance.settings.locked') }}
        </q-banner>
      </div>

      <template #actions>
        <m-btn
          :label="t('finance.action.cancel')"
          text
          @click="onDialogCancel"
        />
        <m-btn
          :label="t('finance.action.save')"
          :disable="locked"
          :loading="saving"
          color="primary"
          type="submit"
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
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import DialogCard from '@/components/common/dialogs/DialogCard.vue';
import { useFinanceStore } from '@/stores/finance-store';

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const { t } = useI18n();
const financeStore = useFinanceStore();
const { settings } = storeToRefs(financeStore);

const prefix = ref(settings.value?.payoutNumberPrefix ?? 'P');
const locked = computed(
  () => settings.value?.payoutNumberPrefixLocked ?? false,
);
const saving = ref(false);

async function save() {
  saving.value = true;
  try {
    onDialogOK(
      await financeStore.updateSettings({ payoutNumberPrefix: prefix.value }),
    );
  } catch {
    // Reported by the store.
  } finally {
    saving.value = false;
  }
}
</script>
