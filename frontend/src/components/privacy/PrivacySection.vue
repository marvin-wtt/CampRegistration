<template>
  <!-- One topic of a privacy notice. What applies is shown; the rest of the
       catalogue waits behind "add more", so a page opens on a handful of
       entries instead of every option there is. -->
  <q-card
    flat
    class="privacy-section rounded-xl"
  >
    <div class="privacy-section__header">
      <div class="privacy-section__icon">
        <q-icon
          :name="icon"
          size="20px"
        />
      </div>
      <div class="privacy-section__title">
        <div class="text-subtitle1 text-weight-medium">{{ title }}</div>
        <div
          v-if="summary"
          class="text-body2 text-on-surface-variant"
        >
          {{ summary }}
        </div>
      </div>
      <div
        v-if="$slots.aside"
        class="privacy-section__aside"
      >
        <slot name="aside" />
      </div>
    </div>

    <div
      v-if="$slots.default"
      class="privacy-section__body"
    >
      <slot />
    </div>

    <template v-if="moreCount">
      <q-slide-transition>
        <div
          v-show="open"
          class="privacy-section__body"
        >
          <slot name="more" />
        </div>
      </q-slide-transition>
      <div class="privacy-section__more">
        <m-btn
          :label="open ? t('less') : t('more', { count: moreCount })"
          :icon="open ? 'expand_less' : 'add'"
          flat
          no-caps
          color="primary"
          @click="open = !open"
        />
      </div>
    </template>

    <div
      v-if="$slots.actions"
      class="privacy-section__actions"
    >
      <slot name="actions" />
    </div>
  </q-card>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';

defineProps<{
  icon: string;
  title: string;
  summary?: string | null;
  /** How many catalogue entries wait in the `more` slot; 0 hides it. */
  moreCount?: number;
}>();

const { t } = useI18n();

const open = ref(false);
</script>

<style lang="scss" scoped>
.privacy-section {
  container-type: inline-size;
  background-color: var(--md3-surface-container-low);
  padding: 1rem 1.25rem;

  &__header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 0.875rem;
  }

  &__title {
    flex: 1 1 0;
    min-width: 0;
  }

  // Narrow cards: the aside drops below the title, aligned with its text.
  @container (max-width: 30rem) {
    &__aside {
      flex-basis: 100%;
      padding-left: 3.375rem;
    }
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    background-color: var(--md3-secondary-container);
    color: var(--md3-on-secondary-container);
  }

  &__body {
    padding-top: 1rem;
  }

  &__more {
    padding-top: 0.5rem;
    margin-left: -0.5rem;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding-top: 0.75rem;
    margin-left: -0.5rem;
  }
}
</style>

<i18n lang="yaml" locale="en">
more: 'Add more ({count})'
less: 'Show less'
</i18n>

<i18n lang="yaml" locale="de">
more: 'Weitere hinzufügen ({count})'
less: 'Weniger anzeigen'
</i18n>

<i18n lang="yaml" locale="fr">
more: 'En ajouter ({count})'
less: 'Afficher moins'
</i18n>

<i18n lang="yaml" locale="pl">
more: 'Dodaj więcej ({count})'
less: 'Pokaż mniej'
</i18n>

<i18n lang="yaml" locale="cs">
more: 'Přidat další ({count})'
less: 'Zobrazit méně'
</i18n>
