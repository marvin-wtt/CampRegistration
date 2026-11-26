<template>
  <!-- Chips where there is room; on phones the active ones and a sheet. -->
  <div
    v-if="!quasar.screen.xs"
    class="filter-row row items-center"
  >
    <filter-chip
      v-for="choice in choices"
      :key="choice.key"
      :active="choice.value !== null"
      :icon="choice.icon"
      icon-right="arrow_drop_down"
      clickable
      :data-test="`expense-filter-${choice.key}`"
    >
      {{ selected(choice) ?? choice.label }}
      <q-menu auto-close>
        <q-list class="filter-menu">
          <!-- Picking the active option again clears the filter. -->
          <q-item
            v-for="option in choice.options"
            :key="option.value"
            clickable
            :active="choice.value === option.value"
            @click="
              choice.set(choice.value === option.value ? null : option.value)
            "
          >
            <q-item-section>
              <q-item-label>{{ option.label }}</q-item-label>
              <q-item-label
                v-if="option.caption"
                caption
              >
                {{ option.caption }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </filter-chip>
    <filter-chip
      v-for="flag in shownFlags"
      :key="flag.key"
      :active="flag.active"
      :icon="flag.icon"
      clickable
      :data-test="`expense-filter-${flag.key}`"
      @click="flag.set(!flag.active)"
    >
      {{ flag.label }}
    </filter-chip>
    <m-btn
      v-if="active.length > 0"
      :label="t('finance.filter.reset')"
      text
      rounded
      color="primary"
      @click="emit('reset')"
    />
  </div>

  <template v-else>
    <div
      v-if="active.length > 0"
      class="filter-scroll row no-wrap items-center"
    >
      <filter-chip
        v-for="chip in active"
        :key="chip.key"
        :icon="chip.icon"
        removable
        @remove="chip.clear"
      >
        {{ chip.label }}
      </filter-chip>
    </div>

    <bottom-sheet
      v-model="sheetOpen"
      :snap-points="['half', 'full']"
    >
      <div class="row items-center justify-between q-mb-sm">
        <div class="text-subtitle1 text-weight-medium">
          {{ t('finance.filter.title') }}
        </div>
        <m-btn
          v-if="active.length > 0"
          :label="t('finance.filter.reset')"
          text
          rounded
          color="primary"
          @click="emit('reset')"
        />
      </div>
      <q-list>
        <q-item
          v-for="flag in shownFlags"
          :key="flag.key"
          tag="label"
          class="q-px-none"
        >
          <q-item-section avatar>
            <q-icon :name="flag.icon" />
          </q-item-section>
          <q-item-section>{{ flag.label }}</q-item-section>
          <q-item-section side>
            <q-toggle
              :model-value="flag.active"
              @update:model-value="flag.set"
            />
          </q-item-section>
        </q-item>
      </q-list>
      <div class="column q-gutter-y-sm q-mt-sm q-pb-md">
        <q-select
          v-for="choice in choices"
          :key="choice.key"
          :model-value="choice.value"
          :options="choice.options"
          :label="choice.label"
          emit-value
          map-options
          clearable
          outlined
          rounded
          @update:model-value="choice.set"
        >
          <template #option="{ opt, itemProps }">
            <q-item v-bind="itemProps">
              <q-item-section>
                <q-item-label>{{ opt.label }}</q-item-label>
                <q-item-label
                  v-if="opt.caption"
                  caption
                >
                  {{ opt.caption }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>
    </bottom-sheet>
  </template>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import BottomSheet from '@/components/BottomSheet.vue';
import FilterChip from '@/components/common/FilterChip.vue';
import type {
  ActiveFilter,
  ChoiceFilter,
  FlagFilter,
} from '@/composables/expenseFilters';

const { choices, flags, active } = defineProps<{
  choices: ChoiceFilter[];
  flags: FlagFilter[];
  active: ActiveFilter[];
}>();

const emit = defineEmits<{ reset: [] }>();

/** The phone's filter sheet, opened from the totals strip. */
const sheetOpen = defineModel<boolean>('sheetOpen', { default: false });

const quasar = useQuasar();
const { t } = useI18n();

const shownFlags = computed(() => flags.filter((f) => f.shown));

function selected(choice: ChoiceFilter): string | undefined {
  return choice.options.find((o) => o.value === choice.value)?.label;
}
</script>

<style scoped>
.filter-row {
  gap: 8px;
}

.filter-scroll {
  overflow-x: auto;
  gap: 8px;
  scrollbar-width: none;
}

.filter-menu {
  min-width: 200px;
}
</style>
