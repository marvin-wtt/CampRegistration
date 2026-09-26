<template>
  <!-- Only the data region is skeletonized; the page header/actions render for
       real since they don't depend on fetched data. Mirrors the filter chips
       and the separated task list of TasksPage. -->
  <div class="column q-gutter-y-lg">
    <div class="row items-center filter-row">
      <q-skeleton
        v-for="width in chipWidths"
        :key="width"
        type="rect"
        :width="width"
        class="filter-chip-skeleton"
      />
    </div>

    <q-list separator>
      <q-item
        v-for="row in rowCount"
        :key="`task-${row}`"
        class="task-row-skeleton"
      >
        <q-item-section avatar>
          <q-skeleton type="QCheckbox" />
        </q-item-section>

        <q-item-section>
          <q-item-label>
            <q-skeleton
              type="text"
              :width="titleWidth(row)"
              class="skeleton-row-title"
            />
          </q-item-label>
          <q-item-label class="row items-center no-wrap q-gutter-x-md">
            <q-skeleton
              type="text"
              width="5rem"
              class="skeleton-caption"
            />
            <q-skeleton
              type="text"
              width="3.5rem"
              class="skeleton-caption"
            />
          </q-item-label>
        </q-item-section>

        <q-item-section side>
          <q-skeleton
            type="circle"
            size="28px"
          />
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script lang="ts" setup>
const { rowCount = 6 } = defineProps<{
  rowCount?: number;
}>();

// One per filter option (all / mine / unassigned)
const chipWidths = ['56px', '72px', '104px'];

// Deterministic title widths so rows look varied but never re-shuffle
function titleWidth(row: number): string {
  const seed = (row * 23) % 45;
  return `${40 + seed}%`;
}
</script>

<style scoped>
.filter-row {
  gap: 8px;
}

.filter-chip-skeleton {
  height: 32px;
  border-radius: 8px;
}

.skeleton-row-title {
  font-size: 15px;
}

.skeleton-caption {
  font-size: 12px;
  opacity: 0.7;
}
</style>
