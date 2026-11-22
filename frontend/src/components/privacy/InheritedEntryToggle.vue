<template>
  <!-- What an event does with one organization entry: keep it, restate it with
       its own values, or drop it from this event's notice. -->
  <q-btn-toggle
    :model-value="modelValue"
    :options
    :disable
    dense
    no-caps
    no-wrap
    rounded
    unelevated
    size="sm"
    color="surface-container-high"
    text-color="on-surface"
    toggle-color="secondary-container"
    toggle-text-color="on-secondary-container"
    class="inherited-entry-toggle"
    @update:model-value="(value) => emit('update:modelValue', value)"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

export type InheritedEntryState = 'inherit' | 'override' | 'exclude';

const props = defineProps<{
  modelValue: InheritedEntryState;
  /** Only where the event has a value of its own to set. */
  canOverride?: boolean;
  /** Mandatory entries, always-recipients, countries still in use. */
  excludeDisabled?: boolean;
  disable?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: InheritedEntryState): void;
}>();

const { t } = useI18n();

const options = computed(() => [
  { label: t('inherit'), value: 'inherit' },
  ...(props.canOverride ? [{ label: t('override'), value: 'override' }] : []),
  {
    label: t('exclude'),
    value: 'exclude',
    disable: props.excludeDisabled,
  },
]);
</script>

<style lang="scss" scoped>
.inherited-entry-toggle {
  flex-shrink: 0;

  // Narrow rows (PrivacyEntryRow is the container): full width, fixed equal
  // segments. The fill marks the selection; the checkmark would not fit.
  @container (max-width: 34rem) {
    flex: 1 1 auto;
    width: 100%;
    grid-auto-columns: minmax(0, 1fr) !important;

    :deep(.q-btn) {
      min-width: 0;
    }

    :deep(.q-btn__content::before),
    :deep(.q-btn__content::after) {
      display: none !important;
    }

    :deep(.q-btn__content > .block) {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
</style>

<i18n lang="yaml" locale="en">
inherit: 'Keep'
override: 'Change'
exclude: 'Exclude'
</i18n>

<i18n lang="yaml" locale="de">
inherit: 'Übernehmen'
override: 'Ändern'
exclude: 'Ausschließen'
</i18n>

<i18n lang="yaml" locale="fr">
inherit: 'Conserver'
override: 'Modifier'
exclude: 'Exclure'
</i18n>

<i18n lang="yaml" locale="cs">
inherit: 'Ponechat'
override: 'Změnit'
exclude: 'Vyloučit'
</i18n>

<i18n lang="yaml" locale="pl">
inherit: 'Zachowaj'
override: 'Zmień'
exclude: 'Wyklucz'
</i18n>
