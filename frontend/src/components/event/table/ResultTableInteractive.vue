<template>
  <result-table-skeleton
    v-if="loading || !event"
    v-bind="$attrs"
    :columns="skeletonColumns"
  />

  <result-table-interactive-content
    v-else
    v-bind="$attrs"
    :questions
    :registrations
    :templates
    :event
    @export="(templateIds) => emit('export', templateIds)"
  />
</template>

<script lang="ts" setup>
import type {
  EventDetails,
  TableTemplate,
  TableColumnTemplate,
  Registration,
} from '@camp-registration/common/entities';
import ResultTableSkeleton from '@/components/event/table/ResultTableSkeleton.vue';
import ResultTableInteractiveContent from '@/components/event/table/ResultTableInteractiveContent.vue';
import { computed } from 'vue';

// Owns only the loading state. The table itself is stateful — its model
// resolves the selected template and sort once, at setup — so it is mounted
// only once its data is complete, never fed placeholders while loading. Keep
// data-derived state out of this shell.
const { questions, registrations, templates, event, loading } = defineProps<{
  questions: TableColumnTemplate[];
  registrations: Registration[];
  templates: TableTemplate[];
  event?: EventDetails | undefined;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'export', templateIds: string[]): void;
}>();

// The page passes `class="absolute fit"`; bind it explicitly so it lands on
// whichever branch (skeleton or table) is active.
defineOptions({ inheritAttrs: false });

// Question columns aren't known until the event form loads; fall back to a
// sensible column count so the loading grid doesn't look sparse.
const skeletonColumns = computed<number>(() => Math.max(questions.length, 4));
</script>
