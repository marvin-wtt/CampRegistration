<template>
  <div class="dashboard-card-header">
    <div
      class="header-icon"
      :class="`header-icon--${tone}`"
    >
      <q-icon
        :name="icon"
        size="22px"
      />
    </div>
    <div class="header-text">
      <h2 class="header-title">{{ title }}</h2>
      <div
        v-if="$slots.caption || caption"
        class="header-caption"
      >
        <slot name="caption">{{ caption }}</slot>
      </div>
    </div>
    <div
      v-if="$slots.action"
      class="header-action"
    >
      <slot name="action" />
    </div>
  </div>
</template>

<script lang="ts" setup>
// Shared heading row of the dashboard cards: tonal icon, title, caption and an
// optional action on the right.
const { tone = 'primary' } = defineProps<{
  icon: string;
  title: string;
  caption?: string | undefined;
  tone?: 'primary' | 'secondary' | 'tertiary' | 'warning' | 'positive';
}>();
</script>

<style scoped>
.dashboard-card-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  min-width: 0;
  container-type: inline-size;
}

.header-icon {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
}

.header-icon--primary {
  color: var(--md3-on-primary-container);
  background: var(--md3-primary-container);
}

.header-icon--secondary {
  color: var(--md3-on-secondary-container);
  background: var(--md3-secondary-container);
}

.header-icon--tertiary {
  color: var(--md3-on-tertiary-container);
  background: var(--md3-tertiary-container);
}

.header-icon--warning {
  color: var(--md3-on-warning-container);
  background: var(--md3-warning-container);
}

.header-icon--positive {
  color: var(--md3-on-positive-container);
  background: var(--md3-positive-container);
}

/* The action wraps below once the title would get too narrow. */
.header-text {
  flex: 1 1 160px;
  min-width: 0;
}

.header-title {
  margin: 0;
  color: var(--md3-on-surface);
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.35;
  letter-spacing: 0;
}

.header-caption {
  color: var(--md3-on-surface-variant);
  font-size: 0.8125rem;
  line-height: 1.35;
}

.header-action {
  flex: 0 0 auto;
  margin-left: auto;
}

/* On phones the action always sits under the title, aligned with it. */
@container (max-width: 400px) {
  .header-text {
    flex-basis: calc(100% - 52px);
  }

  .header-action {
    margin-left: 40px;
  }
}
</style>
