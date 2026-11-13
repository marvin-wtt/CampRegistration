<template>
  <q-form
    class="row items-start no-wrap q-gutter-x-sm"
    @submit.prevent="save"
  >
    <translated-input
      v-model="name"
      :label="t('finance.categories.name')"
      :locales
      :rules="[(val: unknown) => !!val || t('finance.validation.name')]"
      class="col"
      autofocus
      dense
      outlined
      rounded
      hide-bottom-space
      @keydown.esc="emit('done')"
    />
    <q-btn
      icon="check"
      type="submit"
      flat
      round
      color="primary"
      :aria-label="t('finance.action.save')"
    />
    <q-btn
      icon="close"
      flat
      round
      :aria-label="t('finance.action.cancel')"
      @click="emit('done')"
    />
  </q-form>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ExpenseCategory } from '@camp-registration/common/entities';
import TranslatedInput from '@/components/common/inputs/TranslatedInput.vue';
import { useFinanceStore } from '@/stores/finance-store';

const { category, locales } = defineProps<{
  category: ExpenseCategory;
  locales: string[];
}>();

const emit = defineEmits<{ done: [] }>();

const { t } = useI18n();
const financeStore = useFinanceStore();

const name = ref<string | Record<string, string> | undefined>(
  typeof category.name === 'string' ? category.name : { ...category.name },
);

async function save() {
  if (!name.value) {
    return;
  }
  try {
    await financeStore.updateCategory(category.id, { name: name.value });
    emit('done');
  } catch {
    // Reported by the store.
  }
}
</script>
