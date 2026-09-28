<template>
  <div class="participants-skeleton column no-wrap absolute fit">
    <!-- Header -->
    <div class="row items-center justify-between no-wrap">
      <div class="col header-text">
        <div class="row items-center no-wrap q-gutter-x-sm">
          <q-skeleton
            type="text"
            width="9rem"
            class="skeleton-title"
          />
          <q-skeleton
            type="QChip"
            width="36px"
            height="20px"
          />
        </div>
        <q-skeleton
          type="text"
          width="18rem"
          class="q-mt-xs gt-xs skeleton-subtitle"
        />
      </div>

      <div class="col-auto row items-center no-wrap q-gutter-x-sm">
        <template v-if="quasar.screen.xs">
          <q-skeleton
            type="QBtn"
            size="40px"
          />
          <q-skeleton
            type="QBtn"
            size="40px"
          />
          <q-skeleton
            type="QBtn"
            size="40px"
          />
        </template>
        <template v-else>
          <q-skeleton
            type="QBtn"
            size="40px"
          />
          <q-skeleton
            type="QBtn"
            width="96px"
            height="40px"
            class="rounded-full"
          />
        </template>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="toolbar-row row items-center q-col-gutter-x-sm">
      <div class="col-12 col-sm-auto">
        <q-skeleton
          type="QInput"
          height="30px"
          class="toolbar-field template-select"
        />
      </div>
      <div
        v-if="!quasar.screen.xs"
        class="col-12 col-sm"
      >
        <q-skeleton
          type="QInput"
          height="30px"
          class="toolbar-field search-field"
        />
      </div>

      <!-- Country filter chips -->
      <div
        v-if="!quasar.screen.xs"
        class="col-12 col-sm-auto"
      >
        <div class="row items-center q-gutter-xs">
          <q-skeleton
            v-for="(width, index) in chipWidths"
            :key="`chip-${index}`"
            type="QChip"
            :width="width"
            height="28px"
            class="filter-chip-skeleton"
          />
        </div>
      </div>
    </div>

    <!-- Table -->
    <q-card
      flat
      bordered
      class="table-card col"
    >
      <!-- Desktop: multi-column grid mirroring the real table -->
      <div
        v-if="!quasar.screen.xs"
        class="skeleton-table column no-wrap fit"
      >
        <!-- Header row -->
        <div class="skeleton-row skeleton-row--head row items-center no-wrap">
          <div
            v-for="col in columnWidths"
            :key="`h-${col.key}`"
            class="skeleton-cell"
            :style="{ flex: col.flex }"
          >
            <q-skeleton
              type="text"
              :width="col.headWidth"
            />
          </div>
        </div>

        <!-- Body rows -->
        <div
          v-for="row in rowCount"
          :key="`r-${row}`"
          class="skeleton-row row items-center no-wrap"
        >
          <div
            v-for="col in columnWidths"
            :key="`c-${row}-${col.key}`"
            class="skeleton-cell"
            :style="{ flex: col.flex }"
          >
            <q-skeleton
              type="text"
              :width="cellWidth(row, col.key)"
            />
          </div>
        </div>
      </div>

      <!-- Mobile: list of tappable row cards -->
      <div
        v-else
        class="skeleton-list column no-wrap fit"
      >
        <div
          v-for="row in rowCount"
          :key="`m-${row}`"
          class="skeleton-list-row row items-center no-wrap"
        >
          <q-skeleton
            type="QAvatar"
            size="32px"
            class="skeleton-list-avatar"
          />
          <div class="col column no-wrap q-gutter-y-xs">
            <q-skeleton
              type="text"
              :width="cellWidth(row, 0)"
              class="skeleton-list-primary"
            />
            <q-skeleton
              type="text"
              :width="cellWidth(row, 3)"
              class="skeleton-list-secondary"
            />
          </div>
          <q-skeleton
            type="QChip"
            width="48px"
            height="20px"
          />
        </div>
      </div>
    </q-card>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useQuasar } from 'quasar';

const { columns = 6, rowCount = 12 } = defineProps<{
  columns?: number;
  rowCount?: number;
}>();

const quasar = useQuasar();

// Placeholder country-filter chips; count/widths are static since the real
// countries aren't known until the registrations load.
const chipWidths = ['80px', '92px'];

const columnWidths = computed(() => {
  return Array.from({ length: columns }, (_, index) => ({
    key: index,
    // First column a touch wider (name-like), rest even
    flex: index === 0 ? '1.6 1 0' : '1 1 0',
    headWidth: index === 0 ? '70%' : '55%',
  }));
});

// Deterministic pseudo-random width so rows look varied but never re-shuffle
function cellWidth(row: number, col: number): string {
  const seed = (row * 31 + col * 17) % 40;
  return `${45 + seed}%`;
}
</script>

<style lang="scss" scoped>
.participants-skeleton {
  padding: 16px;
}

@media (min-width: 600px) {
  .participants-skeleton {
    padding: 24px;
  }
}

.header-text {
  min-width: 0;
}

.toolbar-row {
  margin-top: 16px;
  margin-bottom: 16px;
  row-gap: 8px;
}

.toolbar-field {
  border-radius: 12px;
}

.template-select {
  min-width: 220px;
}

.search-field {
  max-width: 360px;
}

.filter-chip-skeleton {
  border-radius: 8px;
}

.table-card {
  position: relative;
  min-height: 0;
  border-radius: 16px;
  background: var(--md3-surface);
  overflow: hidden;
}

.skeleton-table {
  padding: 0 16px;
  overflow: hidden;
}

.skeleton-row {
  gap: 16px;
  height: 36px;
  border-bottom: 1px solid var(--md3-outline-variant);
}

.skeleton-row--head {
  height: 44px;
  border-bottom-color: var(--md3-outline);
}

.skeleton-cell {
  min-width: 0;
}

.skeleton-list {
  padding: 4px 0;
  overflow: hidden;
}

.skeleton-list-row {
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--md3-outline-variant);
}

.skeleton-list-row:last-child {
  border-bottom: none;
}

.skeleton-list-avatar {
  flex: 0 0 auto;
}

.skeleton-list-primary {
  font-size: 15px;
}

.skeleton-list-secondary {
  font-size: 12px;
  opacity: 0.7;
}

@media (max-width: 599px) {
  .participants-skeleton {
    padding: 12px;
  }

  .toolbar-row {
    margin-top: 8px;
    margin-bottom: 12px;
  }

  .search-field {
    max-width: none;
  }

  .template-select {
    min-width: 0;
  }
}
</style>
