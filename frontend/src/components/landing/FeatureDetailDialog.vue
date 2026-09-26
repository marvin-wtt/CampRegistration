<template>
  <q-dialog
    v-model="open"
    :maximized="$q.screen.lt.sm"
    transition-show="jump-up"
    transition-hide="jump-down"
    @hide="emit('closed')"
  >
    <q-card
      v-if="feature"
      class="detail-card"
      flat
    >
      <!-- Media and text share one scroll region so the illustration can be
           scrolled past on a short screen; only the actions stay pinned. -->
      <div
        ref="scrollEl"
        class="detail-card__scroll"
      >
        <div class="detail-card__media">
          <feature-preview
            :variant="feature.preview"
            :label="feature.title"
          />
        </div>

        <q-card-section class="detail-card__body">
          <div class="detail-card__head">
            <div class="detail-card__icon">
              <q-icon
                :name="feature.icon"
                size="24px"
              />
            </div>
            <div class="detail-card__headings">
              <span class="detail-card__category">{{ feature.category }}</span>
              <h3 class="detail-card__title">{{ feature.title }}</h3>
            </div>
            <m-btn
              v-close-popup
              icon="close"
              round
              text
              :aria-label="t('close')"
              class="detail-card__close"
            />
          </div>

          <p class="detail-card__detail">{{ feature.detail }}</p>

          <p class="detail-card__points-label">{{ t('points_label') }}</p>
          <ul class="detail-card__points">
            <li
              v-for="(point, index) in feature.points"
              :key="index"
            >
              <q-icon
                name="check"
                size="18px"
              />
              <span>{{ point }}</span>
            </li>
          </ul>
        </q-card-section>
      </div>

      <q-separator />

      <q-card-actions class="detail-card__actions">
        <m-btn
          :label="t('previous')"
          icon="chevron_left"
          text
          no-caps
          :disable="!hasPrev"
          data-test="feature-detail-prev"
          @click="emit('prev')"
        />
        <q-space />
        <span
          class="detail-card__count"
          data-test="feature-detail-count"
        >
          <span aria-hidden="true">{{ index + 1 }} / {{ total }}</span>
          <span class="sr-only">
            {{ t('position', { current: index + 1, total }) }}
          </span>
        </span>
        <q-space />
        <m-btn
          :label="t('next')"
          icon-right="chevron_right"
          tonal
          no-caps
          :disable="!hasNext"
          data-test="feature-detail-next"
          @click="emit('next')"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { computed, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import FeaturePreview from './FeaturePreview.vue';
import type { ResolvedFeature } from './landing-features';

const props = defineProps<{
  feature: ResolvedFeature | undefined;
  /** Zero-based position of `feature` within the currently filtered set. */
  index: number;
  total: number;
}>();

const hasPrev = computed(() => props.index > 0);
const hasNext = computed(
  () => props.index > -1 && props.index < props.total - 1,
);

const scrollEl = useTemplateRef<HTMLElement>('scrollEl');

// Prev/next swaps the content inside the same scroll container, so without
// this the reader lands mid-way down the next feature.
watch(
  () => props.feature?.id,
  () => {
    scrollEl.value?.scrollTo({ top: 0 });
  },
);

const emit = defineEmits<{
  prev: [];
  next: [];
  closed: [];
}>();

const open = defineModel<boolean>({ required: true });

const { t } = useI18n();
const $q = useQuasar();
</script>

<style lang="scss" scoped>
.detail-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 620px;
  max-height: 90vh;
  overflow: hidden;
  border-radius: 28px;
  background: var(--md3-surface-container-low);
}

.q-dialog--maximized .detail-card {
  border-radius: 0;
  max-width: 100%;
  max-height: 100%;
}

/* Everything above the actions scrolls together; the prev/next row stays
 * pinned so it is reachable on a short viewport. */
.detail-card__scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.detail-card__media {
  padding: 20px 20px 0;
  background: linear-gradient(
    180deg,
    rgba(var(--md3-primary-rgb), 0.14),
    transparent
  );
}

/* Cap the illustration so it never fills a short viewport on its own. */
.detail-card__media svg.preview {
  width: auto;
  max-width: 100%;
  max-height: 30vh;
  margin: 0 auto;
}

.detail-card__body {
  padding: 20px 24px 24px;
}

.detail-card__actions {
  flex: 0 0 auto;
}

.detail-card__head {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.detail-card__icon {
  display: inline-flex;
  flex: 0 0 auto;
  padding: 10px;
  border-radius: 16px;
  color: var(--md3-on-primary-container);
  background: var(--md3-primary-container);
}

.detail-card__headings {
  flex: 1 1 auto;
  min-width: 0;
}

.detail-card__category {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--md3-primary);
}

.detail-card__title {
  margin: 2px 0 0;
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: -0.015em;
  line-height: 1.2;
  color: var(--md3-on-surface);
}

.detail-card__close {
  flex: 0 0 auto;
  color: var(--md3-on-surface-variant);
}

.detail-card__detail {
  margin: 16px 0 0;
  font-size: 0.98rem;
  line-height: 1.6;
  color: var(--md3-on-surface-variant);
}

.detail-card__points-label {
  margin: 20px 0 8px;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--md3-on-surface-variant);
}

.detail-card__points {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.detail-card__points li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 0.94rem;
  line-height: 1.5;
  color: var(--md3-on-surface);
}

.detail-card__points .q-icon {
  flex: 0 0 auto;
  margin-top: 2px;
  color: var(--md3-tertiary);
}

.detail-card__actions {
  padding: 12px 16px;
  background: var(--md3-surface-container-low);
}

.detail-card__count {
  font-size: 0.82rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  color: var(--md3-on-surface-variant);
}

/* The visible "3 / 15" reads as "three slash fifteen"; the full sentence is
 * carried alongside it for screen readers. */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  border: 0;
  overflow: hidden;
  white-space: nowrap;
  clip-path: inset(50%);
}
</style>

<i18n lang="yaml" locale="en">
close: 'Close'
previous: 'Previous'
next: 'Next'
position: 'Feature {current} of {total}'
points_label: 'What you get'
</i18n>

<i18n lang="yaml" locale="de">
close: 'Schließen'
previous: 'Zurück'
next: 'Weiter'
position: 'Funktion {current} von {total}'
points_label: 'Das steckt drin'
</i18n>

<i18n lang="yaml" locale="fr">
close: 'Fermer'
previous: 'Précédent'
next: 'Suivant'
position: 'Fonctionnalité {current} sur {total}'
points_label: 'Ce que vous obtenez'
</i18n>

<i18n lang="yaml" locale="pl">
close: 'Zamknij'
previous: 'Wstecz'
next: 'Dalej'
position: 'Funkcja {current} z {total}'
points_label: 'Co otrzymujesz'
</i18n>

<i18n lang="yaml" locale="cs">
close: 'Zavřít'
previous: 'Zpět'
next: 'Další'
position: 'Funkce {current} z {total}'
points_label: 'Co získáte'
</i18n>
