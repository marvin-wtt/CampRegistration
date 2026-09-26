<template>
  <div class="event-grid">
    <q-resize-observer @resize="onResize" />

    <q-virtual-scroll
      ref="scroller"
      :items="rows"
      scroll-target="body"
      :virtual-scroll-item-size="ROW_HEIGHT_ESTIMATE"
      :virtual-scroll-slice-size="6"
      :virtual-scroll-sticky-size-start="0"
      role="list"
      :aria-busy="loading"
      :style="{ '--event-grid-columns': columns }"
      @virtual-scroll="onVirtualScroll"
    >
      <template #default="{ item: row }">
        <div
          :key="rowKey(row)"
          class="event-grid__row"
          role="presentation"
        >
          <div
            v-for="event in row"
            :key="event.id"
            role="listitem"
            class="event-grid__cell"
          >
            <event-card :event />
          </div>
        </div>
      </template>

      <template #after>
        <slot name="after" />
      </template>
    </q-virtual-scroll>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue';
import type { QVirtualScroll } from 'quasar';
import type { Event } from '@camp-registration/common/entities';
import EventCard from '@/components/listedEvents/EventCard.vue';
import {
  chunkIntoRows,
  columnsForWidth,
  ROW_HEIGHT_ESTIMATE,
} from '@/components/listedEvents/eventGrid';

const props = defineProps<{
  events: Event[];
  loading?: boolean;
  hasMore?: boolean;
}>();

const emit = defineEmits<{
  loadMore: [];
}>();

const scroller = useTemplateRef<QVirtualScroll>('scroller');
const width = ref<number>(0);

const columns = computed<number>(() => columnsForWidth(width.value));

/**
 * One virtual item is one grid row. QVirtualScroll renders its padding spacers as
 * siblings of the rendered slice, so the grid cannot live on the scroller itself —
 * the list stays one-dimensional and each item carries its own row of cards.
 */
const rows = computed<Event[][]>(() =>
  chunkIntoRows(props.events, columns.value),
);

function rowKey(row: Event[]): string {
  return row[0]?.id ?? 'empty';
}

function onResize(size: { width: number }): void {
  width.value = size.width;
}

// A different column count changes every row's height, so the cached measurements
// are all stale.
watch(columns, () => void nextTick(() => scroller.value?.refresh()));

function onVirtualScroll(details: { to: number }): void {
  // Prefetch a row early so the next chunk is usually already there on arrival.
  if (props.hasMore && !props.loading && details.to >= rows.value.length - 2) {
    emit('loadMore');
  }
}

defineExpose({
  /** Drop the cached row measurements after the result set was replaced. */
  reset: () => scroller.value?.reset(),
  refresh: () => scroller.value?.refresh(),
});
</script>

<style scoped>
.event-grid {
  position: relative;

  min-width: 0;
}

.event-grid__row {
  display: grid;
  grid-template-columns: repeat(var(--event-grid-columns), minmax(0, 1fr));
  gap: 16px;
  align-items: stretch;

  /* The inter-row gap has to be part of the row's own measured height — Quasar
     sizes each item by its offsetHeight, so a gap on the wrapper would not count. */
  padding-bottom: 16px;
}

.event-grid__cell {
  display: flex;

  min-width: 0;
}

.event-grid__cell > * {
  flex: 1;
}
</style>
