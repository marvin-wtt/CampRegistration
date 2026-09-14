<template>
  <div
    class="public-program-item"
    :style="{ borderLeftColor: item.color ?? DEFAULT_PROGRAM_ITEM_COLOR }"
  >
    <div
      v-if="item.time"
      class="public-program-item__time"
    >
      {{ item.time }}
    </div>
    <div class="public-program-item__title row items-center q-gutter-x-xs">
      <plan-letter-icon
        v-if="showPlanIcon"
        :plan="item.plan === 'a' ? 'a' : 'b'"
        size="16px"
      />
      <span>{{ to(item.title) }}</span>
    </div>
    <div
      v-if="item.location"
      class="text-caption text-grey-7"
    >
      {{ to(item.location) }}
    </div>
    <div
      v-if="item.details"
      class="text-caption text-grey-7"
    >
      {{ to(item.details) }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ProgramItem } from '@camp-registration/common/entities';
import { useObjectTranslation } from '@/composables/objectTranslation';
import PlanLetterIcon from '@/components/event/programPlanner/PlanLetterIcon.vue';
import { DEFAULT_PROGRAM_ITEM_COLOR } from '@/utils/programItem';

const { item, showPlanIcon = false } = defineProps<{
  item: ProgramItem;
  /** Only meaningful for an item that isn't already positioned by its plan (see `PublicProgramCalendar.vue`). */
  showPlanIcon?: boolean;
}>();

const { to } = useObjectTranslation();
</script>

<style lang="scss" scoped>
.public-program-item {
  min-width: 0;
  border-left: 4px solid;
  border-radius: 8px;
  padding: 8px 12px;
  background-color: var(--md3-surface-container-low);

  &__time {
    font-variant-numeric: tabular-nums;
    font-weight: 600;
    font-size: 13px;
  }

  &__title {
    font-weight: 500;
  }
}
</style>
