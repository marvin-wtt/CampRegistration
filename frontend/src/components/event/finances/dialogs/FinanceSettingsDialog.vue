<template>
  <responsive-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <dialog-card
      :title="t('finance.settings.title')"
      icon="settings"
      @submit="save"
      @cancel="onDialogCancel"
    >
      <div class="column no-wrap q-gutter-y-md">
        <q-item
          tag="label"
          class="q-px-none"
        >
          <q-item-section>
            <q-item-label>
              {{ t('finance.settings.flagMissingCategories') }}
            </q-item-label>
            <q-item-label caption>
              {{ t('finance.settings.flagMissingCategoriesHint') }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-toggle
              v-model="flagMissingCategories"
              data-test="finance-flag-categories"
            />
          </q-item-section>
        </q-item>

        <q-separator />

        <div class="text-subtitle2">
          {{ t('finance.settings.payoutNumbers') }}
        </div>
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

        <q-separator />

        <div class="text-subtitle2">
          {{ t('finance.settings.incomeNumbers') }}
        </div>
        <p class="text-body2 text-on-surface-variant q-mb-none">
          {{ t('finance.settings.incomePrefixHint') }}
        </p>
        <q-input
          v-model="incomePrefix"
          :label="t('finance.settings.prefix')"
          :disable="incomeLocked"
          :rules="[
            (val: string) =>
              /^[\p{L}\p{N}-]{0,8}$/u.test(val) ||
              t('finance.validation.prefix'),
          ]"
          maxlength="8"
          outlined
          rounded
          hide-bottom-space
          data-test="finance-income-prefix"
        >
          <template #append>
            <span class="text-body2 text-on-surface-variant">
              {{ t('finance.settings.example', { label: `${incomePrefix}1` }) }}
            </span>
          </template>
        </q-input>
        <q-banner
          v-if="incomeLocked"
          dense
          rounded
          class="bg-surface-container-high"
        >
          <template #avatar>
            <q-icon name="lock" />
          </template>
          {{ t('finance.settings.incomeLocked') }}
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
const { settings, display } = storeToRefs(financeStore);

const prefix = ref(settings.value?.payoutNumberPrefix ?? 'P');
const locked = computed(
  () => settings.value?.payoutNumberPrefixLocked ?? false,
);
const incomePrefix = ref(settings.value?.incomeNumberPrefix ?? 'I');
const incomeLocked = computed(
  () => settings.value?.incomeNumberPrefixLocked ?? false,
);
const flagMissingCategories = ref(display.value.flagMissingCategories);
const saving = ref(false);

async function save() {
  saving.value = true;
  try {
    // Saved by the shared event setting as soon as it changes.
    display.value.flagMissingCategories = flagMissingCategories.value;
    const changes = {
      ...(!locked.value && prefix.value !== settings.value?.payoutNumberPrefix
        ? { payoutNumberPrefix: prefix.value }
        : {}),
      ...(!incomeLocked.value &&
      incomePrefix.value !== settings.value?.incomeNumberPrefix
        ? { incomeNumberPrefix: incomePrefix.value }
        : {}),
    };
    if (Object.keys(changes).length > 0) {
      await financeStore.updateSettings(changes);
    }
    onDialogOK();
  } catch {
    // Reported by the store.
  } finally {
    saving.value = false;
  }
}
</script>
