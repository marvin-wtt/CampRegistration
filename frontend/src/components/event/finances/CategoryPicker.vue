<template>
  <!-- One compact field, however many categories: grouped like the editor,
       searchable, and long names wrap in the list. -->
  <q-select
    v-model="model"
    :options="filtered"
    :label="t('finance.field.category')"
    option-value="value"
    option-label="label"
    emit-value
    map-options
    use-input
    fill-input
    hide-selected
    input-debounce="0"
    clearable
    outlined
    rounded
    hide-bottom-space
    data-test="finance-category"
    @filter="onFilter"
  >
    <template #option="{ opt, itemProps }">
      <q-item-label
        v-if="opt.header"
        header
        class="text-overline q-pb-xs"
      >
        {{ opt.label }}
      </q-item-label>
      <q-item
        v-else
        v-bind="itemProps"
      >
        <q-item-section>
          <q-item-label>{{ opt.label }}</q-item-label>
        </q-item-section>
      </q-item>
    </template>
    <template #no-option>
      <q-item>
        <q-item-section class="text-on-surface-variant">
          {{ t('finance.field.noCategoryMatch') }}
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { FinanceCategory } from '@camp-registration/common/entities';
import { groupCategories } from '@/composables/financeFormat';
import { useObjectTranslation } from '@/composables/objectTranslation';

const { categories, keep = null } = defineProps<{
  categories: readonly FinanceCategory[];
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

interface Option {
  value: string;
  label: string;
  /** A group's heading in the list; never picked. */
  header?: boolean;
  disable?: boolean;
}

/** Options per group, its heading first; matched by name or group name. */
function optionsMatching(needle: string): Option[] {
  return groups.value.flatMap((group) => {
    const groupLabel = group.group ? to(group.group.name) : null;
    const groupMatches =
      groupLabel !== null && groupLabel.toLocaleLowerCase().includes(needle);
    const items = group.categories
      .map((c) => ({ value: c.id, label: to(c.name) }))
      .filter(
        (o) => groupMatches || o.label.toLocaleLowerCase().includes(needle),
      );
    if (items.length === 0) {
      return [];
    }
    return groupLabel
      ? [
          {
            value: `group:${group.group?.id ?? ''}`,
            label: groupLabel,
            header: true,
            disable: true,
          },
          ...items,
        ]
      : items;
  });
}

// Derived, so categories loaded or changed while open are listed too.
const needle = ref('');
const filtered = computed(() => optionsMatching(needle.value));

function onFilter(value: string, update: (fn: () => void) => void) {
  update(() => {
    needle.value = value.trim().toLocaleLowerCase();
  });
}
</script>
