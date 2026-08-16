<template>
  <q-item
    v-for="entry in entries"
    :key="entry.id"
    v-close-popup
    clickable
    :inset-level="inset ? 0.5 : undefined"
    @click="emit('select', entry.id)"
  >
    <q-item-section avatar>
      <q-icon :name="entry.icon" />
    </q-item-section>
    <q-item-section class="workspace-entry__section">
      <q-item-label class="workspace-entry__label">
        {{ entry.label }}
      </q-item-label>
      <q-item-label
        v-if="entry.caption"
        caption
      >
        {{ entry.caption }}
      </q-item-label>
    </q-item-section>
  </q-item>

  <q-expansion-item
    v-if="archived.length"
    icon="inventory_2"
    :label="archivedLabel"
    :caption="String(archived.length)"
    :header-inset-level="inset ? 0.5 : undefined"
  >
    <q-item
      v-for="entry in archived"
      :key="entry.id"
      v-close-popup
      clickable
      :inset-level="inset ? 1 : 0.5"
      @click="emit('select', entry.id)"
    >
      <q-item-section avatar>
        <q-icon :name="entry.icon" />
      </q-item-section>
      <q-item-section class="workspace-entry__section">
        <q-item-label class="workspace-entry__label">
          {{ entry.label }}
        </q-item-label>
      </q-item-section>
    </q-item>
  </q-expansion-item>

  <!-- Only needed when there is no area header to click; a folded area opens
       its index from the header row instead. -->
  <q-item
    v-if="indexTo && allLabel"
    v-close-popup
    clickable
    :to="indexTo"
    :inset-level="inset ? 0.5 : undefined"
    active-class=""
    exact-active-class=""
  >
    <q-item-section avatar>
      <q-icon name="grid_view" />
    </q-item-section>
    <q-item-section>
      {{ allLabel }}
    </q-item-section>
  </q-item>
</template>

<script lang="ts" setup>
import type { RouteLocationRaw } from 'vue-router';
import type { WorkspaceEntry } from '@/components/layout/workspaceArea';

const { archived = [] } = defineProps<{
  entries: WorkspaceEntry[];
  archived?: WorkspaceEntry[];
  archivedLabel?: string | undefined;
  indexTo?: RouteLocationRaw | undefined;
  allLabel?: string | undefined;
  // Indent the rows, for when they sit inside an area expansion item.
  inset?: boolean;
}>();

const emit = defineEmits<{
  select: [id: string];
}>();
</script>

<style scoped>
.workspace-entry__section {
  min-width: 0;
}

.workspace-entry__label {
  line-height: 1.25;
  overflow-wrap: anywhere;
  white-space: normal;
}
</style>
