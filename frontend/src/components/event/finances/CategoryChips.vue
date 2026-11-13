<template>
  <div
    class="column q-gutter-y-sm"
    role="radiogroup"
    :aria-label="t('finance.field.category')"
  >
    <div
      v-for="group in groups"
      :key="group.group?.id ?? 'top'"
      class="column"
    >
      <div
        v-if="group.group"
        class="text-overline text-on-surface-variant"
      >
        {{ to(group.group.name) }}
      </div>
      <div class="row q-gutter-xs">
        <q-chip
          v-for="category in group.categories"
          :key="category.id"
          :selected="model === category.id"
          :color="model === category.id ? 'secondary-container' : undefined"
          :text-color="
            model === category.id ? 'on-secondary-container' : undefined
          "
          :outline="model !== category.id"
          role="radio"
          :aria-checked="model === category.id"
          clickable
          class="category-chip"
          @click="toggle(category.id)"
        >
          {{ to(category.name) }}
        </q-chip>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ExpenseCategory } from '@camp-registration/common/entities';
import { groupCategories } from '@/composables/financeFormat';
import { useObjectTranslation } from '@/composables/objectTranslation';

const { categories, keep = null } = defineProps<{
  categories: readonly ExpenseCategory[];
  /** An archived category the expense already has: still shown, still picked. */
  keep?: string | null;
}>();

const model = defineModel<string | null>({ required: true });

const { t } = useI18n();
const { to } = useObjectTranslation();

const groups = computed(() =>
  groupCategories(
    categories.filter((c) => c.archivedAt === null || c.id === keep),
  )
    .map((group) => ({
      ...group,
      // Groups themselves never hold expenses.
      categories: group.categories.filter(
        (c) => !categories.some((child) => child.parentId === c.id),
      ),
    }))
    .filter((group) => group.categories.length > 0),
);

function toggle(id: string) {
  model.value = model.value === id ? null : id;
}
</script>

<style scoped>
.category-chip {
  min-height: 40px;
}
</style>
