<template>
  <!-- Only the data region is skeletonized; the page header/actions render for
       real since they don't depend on fetched data. -->
  <q-card
    flat
    bordered
    class="section-card"
  >
    <div class="filter-bar">
      <q-skeleton
        type="QBtn"
        height="32px"
        class="filter-skeleton"
      />
    </div>
    <q-separator />

    <div class="q-py-xs">
      <div
        v-for="row in rowCount"
        :key="`task-${row}`"
        class="task-row-skeleton row items-center no-wrap"
      >
        <q-skeleton
          type="QCheckbox"
          class="skeleton-checkbox"
        />

        <div class="col column no-wrap q-gutter-y-xs">
          <q-skeleton
            type="text"
            :width="titleWidth(row)"
            class="skeleton-row-title"
          />
          <div class="row items-center no-wrap q-gutter-x-md">
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
          </div>
        </div>

        <q-skeleton
          type="circle"
          size="28px"
          class="skeleton-action"
        />
      </div>
    </div>
  </q-card>
</template>

<script lang="ts" setup>
const { rowCount = 6 } = defineProps<{
  rowCount?: number;
}>();

// Deterministic title widths so rows look varied but never re-shuffle
function titleWidth(row: number): string {
  const seed = (row * 23) % 45;
  return `${40 + seed}%`;
}
</script>

<style scoped>
.section-card {
  border-radius: 16px;
}

.filter-bar {
  display: flex;
  padding: 12px 16px;
}

.filter-skeleton {
  width: 260px;
  max-width: 100%;
  border-radius: 999px;
}

@media (max-width: 599px) {
  .filter-skeleton {
    width: 150px;
  }
}

.task-row-skeleton {
  gap: 12px;
  padding: 12px 16px;
}

.skeleton-checkbox {
  flex: 0 0 auto;
}

.skeleton-row-title {
  font-size: 15px;
}

.skeleton-caption {
  font-size: 12px;
  opacity: 0.7;
}

.skeleton-action {
  flex: 0 0 auto;
}
</style>
