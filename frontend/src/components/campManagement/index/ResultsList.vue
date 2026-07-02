<template>
  <section class="results-section">
    <div
      class="results-section__header row items-center no-wrap q-gutter-x-sm"
      :class="{ 'results-section__header--clickable': collapsible }"
      :role="collapsible ? 'button' : undefined"
      :tabindex="collapsible ? 0 : undefined"
      :aria-expanded="collapsible ? open : undefined"
      @click="toggle"
      @keyup.enter="toggle"
    >
      <q-icon
        v-if="icon"
        :name="icon"
        size="20px"
        class="results-section__icon"
      />
      <div class="text-subtitle1 text-weight-medium">
        {{ header }}
      </div>
      <q-badge
        rounded
        class="results-section__count"
        :label="camps.length"
      />
      <q-icon
        v-if="hint"
        name="info"
        size="18px"
        class="results-section__icon"
        @click.stop
      >
        <q-tooltip
          max-width="280px"
          class="text-body2"
        >
          {{ hint }}
        </q-tooltip>
      </q-icon>

      <template v-if="collapsible">
        <q-space />
        <q-icon
          :name="open ? 'expand_less' : 'expand_more'"
          size="22px"
          class="results-section__icon"
        />
      </template>
    </div>

    <q-slide-transition>
      <div
        v-show="open"
        class="results-grid"
      >
        <results-item
          v-for="camp in camps"
          :key="camp.id"
          :camp
        />
      </div>
    </q-slide-transition>
  </section>
</template>

<script lang="ts" setup>
import ResultsItem from '@/components/campManagement/index/ResultsItem.vue';
import type { Camp } from '@camp-registration/common/entities';
import { ref } from 'vue';

const {
  camps,
  header,
  icon = '',
  hint = '',
  collapsible = false,
} = defineProps<{
  camps: Camp[];
  header: string;
  icon?: string;
  hint?: string;
  collapsible?: boolean;
}>();

const open = ref<boolean>(!collapsible);

function toggle() {
  if (collapsible) {
    open.value = !open.value;
  }
}
</script>

<style scoped>
.results-section {
  margin-top: 28px;
}

.results-section__header {
  min-width: 0;
}

.results-section__header--clickable {
  cursor: pointer;
  user-select: none;

  margin: 0 -8px;
  padding: 6px 8px;
  border-radius: 12px;

  transition: background 0.15s ease;
}

.results-section__header--clickable:hover {
  background: var(--md3-surface-container-high);
}

.results-section__header--clickable:focus-visible {
  outline: 2px solid var(--md3-primary);
  outline-offset: 2px;
}

.results-section__icon {
  color: var(--md3-on-surface-variant);
}

.results-section__count {
  min-width: 20px;
  padding: 2px 8px;
  justify-content: center;

  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface-variant);

  font-size: 12px;
  font-weight: 600;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  align-items: stretch;

  margin-top: 16px;
}
</style>
