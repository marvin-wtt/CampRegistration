<template>
  <!-- A finance tab's lead: the figure it is about, how far along it is, and
       the few numbers that need attention, each a tap from its list. -->
  <section
    class="finance-headline rounded-xl"
    :class="[
      `accent--${accent}`,
      {
        'finance-headline--xs': quasar.screen.xs,
        'finance-headline--compact': compact,
      },
    ]"
  >
    <div class="headline-top row items-center no-wrap">
      <span
        v-if="icon"
        class="headline-icon rounded-lg row flex-center"
      >
        <q-icon
          :name="icon"
          size="20px"
        />
      </span>
      <div class="headline-figure column col">
        <span class="headline-eyebrow ellipsis">{{ eyebrow }}</span>
        <p class="headline-sentence q-ma-none">
          <span
            class="headline-amount text-amount"
            :class="`text-${amountColor}`"
            data-test="headline-amount"
          >
            {{ amount }}
          </span>
          <span
            v-if="caption"
            class="headline-caption"
          >
            {{ caption }}
          </span>
        </p>
      </div>
      <span
        v-if="badge"
        class="headline-badge rounded-full row items-center no-wrap"
        :class="`tone--${badge.tone ?? 'neutral'}`"
        data-test="headline-badge"
      >
        <q-icon
          v-if="badge.icon"
          :name="badge.icon"
          size="16px"
        />
        {{ badge.label }}
      </span>
    </div>

    <div
      v-if="bar.length > 0"
      class="headline-bar row no-wrap rounded-full"
      role="progressbar"
      :aria-valuenow="Math.round((bar[0]?.share ?? 0) * 100)"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <span
        v-for="segment in bar"
        :key="segment.key"
        class="headline-segment"
        :class="`tone--${segment.tone}`"
        :style="{ flexBasis: `${segment.share * 100}%` }"
      />
    </div>

    <div
      v-if="shownStats.length > 0"
      class="headline-stats row items-center"
    >
      <component
        :is="stat.to ? RouterLink : 'span'"
        v-for="stat in shownStats"
        :key="stat.key"
        :to="stat.to"
        class="headline-stat rounded-full row items-center no-wrap"
        :class="[
          `tone--${stat.tone ?? 'neutral'}`,
          { 'headline-stat--link': stat.to },
        ]"
        :data-test="`headline-stat-${stat.key}`"
      >
        <span class="headline-dot" />
        <span class="headline-stat__label ellipsis">{{ stat.label }}</span>
        <span class="headline-stat__value text-amount">{{ stat.value }}</span>
        <q-icon
          v-if="stat.to"
          name="chevron_right"
          size="16px"
          class="headline-stat__go"
        />
      </component>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import { RouterLink, type RouteLocationRaw } from 'vue-router';

export type HeadlineTone =
  'primary' | 'info' | 'warning' | 'refund' | 'positive' | 'error' | 'neutral';

export interface HeadlineStat {
  key: string;
  label: string;
  /** Already formatted. */
  value: string;
  tone?: HeadlineTone | undefined;
  /** Left out when false, e.g. for a zero amount. */
  shown?: boolean;
  /** The list this number is about, filtered to it. */
  to?: RouteLocationRaw | undefined;
}

/** A share of the bar; the first one is what the progress reads. */
export interface HeadlineSegment {
  key: string;
  value: number;
  tone: HeadlineTone;
}

const {
  icon = undefined,
  compact = false,
  eyebrow,
  amount,
  caption = undefined,
  accent = 'primary',
  amountTone = undefined,
  badge = undefined,
  segments = [],
  stats = [],
} = defineProps<{
  icon?: string | undefined;
  /** Just the figure, for a tab whose list is the point. */
  compact?: boolean;
  /** What the figure is, e.g. "Received". */
  eyebrow: string;
  /** Already formatted. */
  amount: string;
  caption?: string | undefined;
  /** Tints the card and its icon. */
  accent?: 'primary' | 'positive' | 'warning' | 'error';
  amountTone?: 'warning' | 'error' | 'positive' | undefined;
  badge?:
    | {
        label: string;
        tone?: HeadlineTone | undefined;
        icon?: string | undefined;
      }
    | undefined;
  segments?: readonly HeadlineSegment[];
  stats?: readonly HeadlineStat[];
}>();

const quasar = useQuasar();

const amountColor = computed(() => amountTone ?? 'on-surface');
const shownStats = computed(() => stats.filter((s) => s.shown !== false));

const bar = computed(() => {
  const parts = segments.filter((s) => s.value > 0);
  const total = segments.reduce((sum, s) => sum + Math.max(s.value, 0), 0);
  return total > 0 ? parts.map((s) => ({ ...s, share: s.value / total })) : [];
});
</script>

<style scoped>
.finance-headline {
  --accent: var(--md3-primary);
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 20px;
  background:
    radial-gradient(
      100% 180% at 100% 0%,
      color-mix(in srgb, var(--accent) 12%, transparent),
      transparent 55%
    ),
    var(--md3-surface-container-low);
  border: 1px solid color-mix(in srgb, var(--accent) 14%, transparent);
}

.finance-headline.finance-headline--compact {
  padding: 12px 16px 12px 12px;
}

.finance-headline--compact .headline-top {
  gap: 12px;
}

.finance-headline.finance-headline--compact .headline-icon {
  display: flex;
  align-self: center;
  width: 40px;
  height: 40px;
  margin-top: 0;
}

/* A totals line: what it is on the left, the amount on the right. */
.finance-headline--compact .headline-figure {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas:
    'eyebrow amount'
    'caption amount';
  align-items: center;
  column-gap: 12px;
}

.finance-headline--compact .headline-sentence {
  display: contents;
}

.finance-headline--compact .headline-eyebrow {
  grid-area: eyebrow;
  font-size: 0.9375rem;
  font-weight: 600;
  letter-spacing: 0;
  color: var(--md3-on-surface);
}

.finance-headline--compact .headline-caption {
  grid-area: caption;
  font-size: 0.8125rem;
}

.finance-headline.finance-headline--compact .headline-amount {
  grid-area: amount;
  font-size: 1.5rem;
  font-weight: 700;
}

.finance-headline--xs {
  gap: 10px;
  padding: 12px 14px;
}

.accent--positive {
  --accent: var(--md3-positive);
}

.accent--warning {
  --accent: var(--md3-warning);
}

.accent--error {
  --accent: var(--md3-error);
}

.headline-top {
  gap: 14px;
}

.headline-icon {
  flex: none;
  align-self: flex-start;
  width: 40px;
  height: 40px;
  margin-top: 2px;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 16%, transparent);
}

.finance-headline--xs .headline-icon {
  display: none;
}

.headline-figure {
  min-width: 0;
}

.headline-eyebrow {
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--md3-on-surface-variant);
}

.headline-sentence {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 10px;
}

.headline-amount {
  font-size: 1.875rem;
  line-height: 1.15;
  font-weight: 600;
  letter-spacing: -0.025em;
}

.finance-headline--xs .headline-amount {
  font-size: 1.625rem;
}

.headline-caption {
  font-size: 0.875rem;
  color: var(--md3-on-surface-variant);
}

.headline-badge {
  flex: none;
  align-self: flex-start;
  gap: 4px;
  padding: 4px 10px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--tone);
  background: color-mix(in srgb, var(--tone) 14%, transparent);
}

.headline-bar {
  gap: 2px;
  height: 6px;
  overflow: hidden;
  background: var(--md3-surface-container-highest);
}

.headline-segment {
  min-width: 4px;
  border-radius: inherit;
  background: var(--tone);
  transition: flex-basis 0.5s var(--md3-easing-emphasized, ease);
}

.headline-stats {
  gap: 6px;
}

.headline-stat {
  gap: 6px;
  max-width: 100%;
  height: 30px;
  padding: 0 12px 0 10px;
  font-size: 0.8125rem;
  color: var(--md3-on-surface-variant);
  text-decoration: none;
  background: var(--md3-surface-container-high);
  transition: background-color 0.2s ease;
}

.headline-stat--link {
  padding-right: 6px;
}

.headline-stat--link:hover,
.headline-stat--link:focus-visible {
  background: var(--md3-surface-container-highest);
}

.headline-stat__label {
  min-width: 0;
}

.headline-stat__value {
  font-weight: 600;
  color: var(--md3-on-surface);
}

.headline-stat__go {
  opacity: 0.7;
}

.headline-dot {
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--tone);
}

.tone--primary {
  --tone: var(--md3-primary);
}

.tone--info {
  --tone: var(--md3-info);
}

.tone--warning {
  --tone: var(--md3-warning);
}

.tone--refund {
  --tone: var(--md3-tertiary);
}

.tone--positive {
  --tone: var(--md3-positive);
}

.tone--error {
  --tone: var(--md3-error);
}

.tone--neutral {
  --tone: var(--md3-outline);
}
</style>
