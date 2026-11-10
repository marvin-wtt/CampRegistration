<template>
  <button
    type="button"
    role="checkbox"
    class="status-toggle"
    :class="{
      'status-toggle--done': completed,
      'status-toggle--pop': popped,
    }"
    :aria-checked="completed"
    :aria-label="label"
    :disabled="disable"
    @click="emit('toggle')"
  >
    <span class="status-toggle__circle">
      <q-icon
        name="check"
        size="16px"
        class="status-toggle__check"
      />
    </span>
    <q-tooltip
      v-if="!disable"
      :delay="500"
    >
      {{ label }}
    </q-tooltip>
  </button>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

// Round completion toggle for a task: distinct from the square checkboxes of
// checklist items inside the task's details.
const { completed, disable = false } = defineProps<{
  completed: boolean;
  disable?: boolean;
}>();

const emit = defineEmits<{
  toggle: [];
}>();

const { t } = useI18n();

const label = computed<string>(() => (completed ? t('reopen') : t('complete')));

// Pop only when completed here, not when a done task is opened.
const popped = ref<boolean>(false);
watch(
  () => completed,
  (value) => {
    popped.value = value;
  },
);
</script>

<style scoped>
.status-toggle {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--md3-on-surface-variant);
  cursor: pointer;
  transition: background-color 150ms ease;
}

.status-toggle:hover:not(:disabled) {
  background: color-mix(in srgb, var(--md3-on-surface) 8%, transparent);
}

.status-toggle:focus-visible {
  outline: 2px solid var(--md3-primary);
  outline-offset: -2px;
}

.status-toggle:disabled {
  cursor: default;
  opacity: 0.6;
}

.status-toggle__circle {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border: 2px solid currentColor;
  border-radius: 50%;
  transition:
    background-color 150ms ease,
    border-color 150ms ease,
    transform 150ms ease;
}

/* Previews the tick on hover, so the circle reads as "complete this". */
.status-toggle__check {
  opacity: 0;
  transition: opacity 150ms ease;
}

.status-toggle:hover:not(:disabled) .status-toggle__check {
  opacity: 0.7;
}

.status-toggle--done .status-toggle__circle {
  border-color: var(--md3-primary);
  background: var(--md3-primary);
}

.status-toggle--pop .status-toggle__circle {
  animation: status-pop 250ms cubic-bezier(0.2, 0, 0, 1);
}

.status-toggle--done .status-toggle__check,
.status-toggle--done:hover .status-toggle__check {
  opacity: 1;
  color: var(--md3-on-primary);
}

@keyframes status-pop {
  50% {
    transform: scale(1.15);
  }
}

@media (prefers-reduced-motion: reduce) {
  .status-toggle,
  .status-toggle__circle,
  .status-toggle__check {
    transition: none;
    animation: none;
  }
}
</style>

<i18n lang="yaml" locale="en">
complete: 'Mark as done'
reopen: 'Reopen'
</i18n>

<i18n lang="yaml" locale="de">
complete: 'Als erledigt markieren'
reopen: 'Wieder öffnen'
</i18n>

<i18n lang="yaml" locale="fr">
complete: 'Marquer comme terminée'
reopen: 'Rouvrir'
</i18n>

<i18n lang="yaml" locale="pl">
complete: 'Oznacz jako ukończone'
reopen: 'Otwórz ponownie'
</i18n>

<i18n lang="yaml" locale="cs">
complete: 'Označit jako hotové'
reopen: 'Znovu otevřít'
</i18n>
