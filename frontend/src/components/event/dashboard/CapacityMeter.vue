<template>
  <div class="capacity-meter-wrapper">
    <div
      class="capacity-meter"
      :class="{ 'capacity-meter--over': overbooked > 0 }"
      role="img"
      :aria-label="label"
    >
      <div
        v-for="segment in segments"
        :key="segment.key"
        class="capacity-meter__segment"
        :class="`capacity-meter__segment--${segment.key}`"
        :style="{ width: `${segment.width}%` }"
      />
      <!-- Where the capacity ends once the bar runs past it. -->
      <div
        v-if="overbooked > 0"
        class="capacity-meter__limit"
        :style="{ left: `${(max / scale) * 100}%` }"
      />
    </div>

    <ul
      v-if="legend"
      class="capacity-legend"
    >
      <li>
        <span class="legend-dot legend-dot--accepted" />
        {{ t('accepted', { n: accepted }) }}
      </li>
      <li v-if="pending > 0">
        <span class="legend-dot legend-dot--pending" />
        {{ t('pending', { n: pending }) }}
      </li>
      <li v-if="reserved > 0">
        <span class="legend-dot legend-dot--reserved" />
        {{ t('reserved', { n: reserved }) }}
      </li>
      <li class="legend-free">
        <span class="legend-dot legend-dot--free" />
        {{ t('free', { n: free }) }}
      </li>
      <li
        v-if="overbooked > 0"
        class="legend-over"
      >
        <q-icon
          name="warning"
          size="16px"
        />
        {{ t('overbooked', { n: overbooked }) }}
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

// Places in the order they fill up: accepted, pending, then those freed while
// people wait, which stay reserved for the waiting list. The rest is free.
const {
  max,
  accepted,
  pending = 0,
  reserved = 0,
  free = 0,
  overbooked = 0,
  legend = false,
} = defineProps<{
  max: number;
  accepted: number;
  pending?: number;
  reserved?: number;
  free?: number;
  overbooked?: number;
  label: string;
  legend?: boolean;
}>();

const { t } = useI18n();

// An overbooked bar runs to the total held, with a tick at the capacity.
const scale = computed(() => Math.max(max, accepted + pending + reserved, 1));

const segments = computed(() =>
  (
    [
      ['accepted', accepted],
      ['pending', pending],
      ['reserved', reserved],
    ] as const
  )
    .filter(([, value]) => value > 0)
    .map(([key, value]) => ({ key, width: (value / scale.value) * 100 })),
);
</script>

<style scoped>
.capacity-meter {
  position: relative;
  display: flex;
  gap: 2px;
  height: 10px;
  overflow: hidden;
  background: var(--md3-surface-container-highest);
  border-radius: 999px;
}

.capacity-meter__segment {
  height: 100%;
  transition: width 0.3s ease;
}

.capacity-meter__segment--accepted,
.legend-dot--accepted {
  background: var(--md3-primary);
}

.capacity-meter__segment--pending,
.legend-dot--pending {
  background: var(--md3-tertiary);
}

.capacity-meter__segment--reserved,
.legend-dot--reserved {
  background: repeating-linear-gradient(
    -45deg,
    var(--md3-secondary) 0 3px,
    color-mix(in srgb, var(--md3-secondary) 35%, transparent) 3px 6px
  );
}

.capacity-meter--over .capacity-meter__segment--accepted {
  background: var(--md3-error);
}

.capacity-meter--over .capacity-meter__segment--pending {
  background: color-mix(in srgb, var(--md3-error) 55%, transparent);
}

.capacity-meter__limit {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--md3-on-surface);
}

.capacity-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  margin: 10px 0 0;
  padding: 0;
  color: var(--md3-on-surface-variant);
  font-size: 0.8125rem;
  list-style: none;
}

.capacity-legend li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.legend-dot--free {
  background: var(--md3-surface-container-highest);
  box-shadow: inset 0 0 0 1px var(--md3-outline);
}

.legend-free {
  color: var(--md3-on-surface);
  font-weight: 600;
}

.legend-over {
  color: var(--md3-error);
  font-weight: 600;
}
</style>

<i18n lang="yaml" locale="en">
accepted: '{n} confirmed'
pending: '{n} pending'
reserved: '{n} reserved for the waitlist'
free: '{n} free'
overbooked: '{n} overbooked'
</i18n>

<i18n lang="yaml" locale="de">
accepted: '{n} bestätigt'
pending: '{n} ausstehend'
reserved: '{n} für die Warteliste reserviert'
free: '{n} frei'
overbooked: '{n} überbucht'
</i18n>

<i18n lang="yaml" locale="fr">
accepted: '{n} confirmés'
pending: '{n} en attente'
reserved: "{n} réservées pour la liste d'attente"
free: '{n} libres'
overbooked: '{n} en surréservation'
</i18n>

<i18n lang="yaml" locale="pl">
accepted: 'Potwierdzeni: {n}'
pending: 'Oczekujący: {n}'
reserved: 'Zarezerwowane dla listy rezerwowej: {n}'
free: 'Wolne: {n}'
overbooked: 'Ponad limit: {n}'
</i18n>

<i18n lang="yaml" locale="cs">
accepted: 'Potvrzení: {n}'
pending: 'Čekající: {n}'
reserved: 'Rezervováno pro čekací listinu: {n}'
free: 'Volná: {n}'
overbooked: 'Nad kapacitu: {n}'
</i18n>
