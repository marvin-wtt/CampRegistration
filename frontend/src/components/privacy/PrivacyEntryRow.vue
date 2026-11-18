<template>
  <!-- One catalogue entry. Every row has the same three columns — selection,
       label, controls — so long lists read as a table rather than a ragged
       flow, and the details of a chosen entry sit indented under its label. -->
  <div
    class="privacy-entry"
    :class="{
      'privacy-entry--active': inherited || selected,
      'privacy-entry--excluded': excluded,
    }"
  >
    <div class="privacy-entry__grid">
      <div class="privacy-entry__lead">
        <q-icon
          v-if="inherited"
          name="subdirectory_arrow_right"
          size="xs"
          class="text-on-surface-variant"
        />
        <q-checkbox
          v-else
          :model-value="selected"
          :disable="disable || locked"
          dense
          :aria-label="label"
          @update:model-value="(value) => emit('update:selected', value)"
        />
      </div>

      <div class="privacy-entry__body">
        <div class="privacy-entry__title">
          <span class="privacy-entry__label text-body2">{{ label }}</span>
          <q-chip
            v-if="special"
            dense
            square
            class="privacy-entry__chip privacy-entry__chip--special"
          >
            {{ t('special') }}
          </q-chip>
          <slot name="chips" />
        </div>
        <div
          v-if="caption"
          class="text-caption text-on-surface-variant"
        >
          {{ caption }}
        </div>
      </div>

      <div class="privacy-entry__actions">
        <slot name="actions" />
      </div>

      <div
        v-if="$slots.default"
        class="privacy-entry__details"
      >
        <slot />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';

defineProps<{
  label: string;
  caption?: string | null | undefined;
  selected?: boolean;
  /** Comes from the organization: no checkbox, a control in `actions`. */
  inherited?: boolean;
  /** Chosen and cannot be unticked, e.g. an always-recipient. */
  locked?: boolean;
  disable?: boolean;
  /** An Art. 9 special category. */
  special?: boolean;
  excluded?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:selected', value: boolean): void;
}>();

const { t } = useI18n();
</script>

<style lang="scss" scoped>
.privacy-entry {
  // Narrow by the room the row actually has, not the window: a side
  // navigation can leave a desktop window phone-wide.
  container-type: inline-size;
  border-radius: 0.75rem;
  transition: background-color 150ms ease;

  // Catalogue entries not chosen stay quiet until hovered.
  &:hover {
    background-color: var(--md3-surface-container-high);
  }

  // Chosen and inherited entries are the content; they get a surface and a
  // little more room than the catalogue around them.
  &--active {
    background-color: var(--md3-surface-container);
  }

  &--active &__grid {
    min-height: 3rem;
    padding: 0.5rem 0.75rem;
  }

  &__grid {
    display: grid;
    grid-template-columns: 2rem 1fr auto;
    align-items: center;
    column-gap: 0.75rem;
    min-height: 2.5rem;
    padding: 0.25rem 0.75rem;
  }

  &__lead {
    display: flex;
    justify-content: center;
  }

  &__body {
    min-width: 0;
  }

  &__title {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.25rem 0.5rem;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 0.25rem;

    &:empty {
      display: none;
    }
  }

  &__details {
    grid-column: 2 / 4;
    padding: 0.5rem 0 0.25rem;
    max-width: 32rem;
  }

  // Narrow rows: controls and details get the full width under the label.
  @container (max-width: 34rem) {
    &__grid {
      grid-template-columns: 2rem 1fr;
    }

    &__actions {
      grid-column: 1 / -1;
      padding-top: 0.5rem;
    }

    &__details {
      grid-column: 1 / -1;
      max-width: none;
    }
  }

  &__chip {
    font-size: 0.7rem;
    margin: 0;

    &--special {
      background-color: var(--md3-tertiary-container);
      color: var(--md3-on-tertiary-container);
    }
  }

  &--excluded &__label {
    text-decoration: line-through;
    color: var(--md3-on-surface-variant);
  }
}
</style>

<i18n lang="yaml" locale="en">
special: 'Special category'
</i18n>

<i18n lang="yaml" locale="de">
special: 'Besondere Kategorie'
</i18n>

<i18n lang="yaml" locale="fr">
special: 'Catégorie particulière'
</i18n>

<i18n lang="yaml" locale="pl">
special: 'Szczególna kategoria'
</i18n>

<i18n lang="yaml" locale="cs">
special: 'Zvláštní kategorie'
</i18n>
