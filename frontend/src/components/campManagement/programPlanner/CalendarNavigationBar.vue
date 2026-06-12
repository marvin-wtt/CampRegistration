<template>
  <div class="cal-nav q-pa-xs q-pa-sm-sm">
    <!-- Plan A/B/Both toggle — icon-only on mobile -->
    <q-btn-toggle
      v-model="plan"
      :options="planOptions"
      spread
      dense
      rounded
      toggle-color="primary"
      class="cal-nav__plan-toggle"
    />

    <!-- Center: prev / date label / next -->
    <div class="cal-nav__center">
      <q-btn
        icon="chevron_left"
        :disable="prevDisabled"
        flat
        round
        :dense="quasar.screen.gt.xs"
        @click="previous"
      />
      <q-btn
        flat
        no-caps
        :dense="quasar.screen.gt.xs"
        class="cal-nav__date-btn"
      >
        {{ dateRangeLabel }}
        <q-popup-proxy
          ref="datePickerRef"
          cover
          transition-show="scale"
          transition-hide="scale"
        >
          <q-date
            :model-value="current"
            mask="YYYY-MM-DD"
            minimal
            :options="dateOptions"
            :navigation-min-year-month="navYearMonthMin"
            :navigation-max-year-month="navYearMonthMax"
            @update:model-value="onDatePick"
          />
        </q-popup-proxy>
      </q-btn>
      <q-btn
        icon="chevron_right"
        :disable="nextDisabled"
        flat
        round
        :dense="quasar.screen.gt.xs"
        @click="next"
      />
    </div>

    <!-- Right: range selector (desktop only) + icon actions -->
    <div class="cal-nav__right">
      <!-- Range stepper: supports 1–maxDays without fixed presets -->
      <div class="gt-xs cal-nav__stepper">
        <q-btn
          icon="remove"
          flat
          round
          dense
          :disable="daysRange <= 1"
          @click="daysRange = Math.max(1, daysRange - 1)"
        />
        <span class="cal-nav__stepper-val">{{ daysRange }}d</span>
        <q-btn
          icon="add"
          flat
          round
          dense
          :disable="daysRange >= maxDays"
          @click="daysRange = Math.min(maxDays, daysRange + 1)"
        />
      </div>

      <q-btn
        icon="print"
        flat
        round
        :dense="quasar.screen.gt.xs"
        @click="emit('print')"
      >
        <q-tooltip>{{ t('options.print') }}</q-tooltip>
      </q-btn>

      <q-btn
        icon="settings"
        flat
        round
        :dense="quasar.screen.gt.xs"
        @click="emit('settings')"
      >
        <q-tooltip>{{ t('options.settings') }}</q-tooltip>
      </q-btn>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { useQuasar, type QPopupProxy } from 'quasar';
import { computed, onMounted, ref } from 'vue';
import { daysBetweenDates } from 'src/utils/date';

const { t, locale } = useI18n();
const quasar = useQuasar();

const datePickerRef = ref<InstanceType<typeof QPopupProxy> | null>(null);

const daysRange = defineModel<number>({
  required: true,
});
const plan = defineModel<'a' | 'b' | 'both'>('plan', {
  required: true,
});

const { start, end, current } = defineProps<{
  start: string;
  end: string;
  current: string;
}>();

const emit = defineEmits<{
  (e: 'next'): void;
  (e: 'previous'): void;
  (e: 'jump', date: string): void;
  (e: 'print'): void;
  (e: 'settings'): void;
}>();

onMounted(() => {
  if (daysRange.value > maxDays.value) {
    daysRange.value = maxDays.value;
  }
});

// Icon-only on mobile to save horizontal space; omit label entirely (not undefined)
const planOptions = computed(() => {
  const showLabel = quasar.screen.gt.xs;
  return [
    { ...(showLabel && { label: t('plan.a') }), value: 'a', icon: 'wb_sunny' },
    {
      ...(showLabel && { label: t('plan.both') }),
      value: 'both',
      icon: 'repeat',
    },
    {
      ...(showLabel && { label: t('plan.b') }),
      value: 'b',
      icon: 'water_drop',
    },
  ];
});

const maxDays = computed<number>(() => {
  return daysBetweenDates(new Date(start), new Date(end)) + 1;
});

const prevDisabled = computed<boolean>(() => {
  return current <= start.substring(0, 10);
});

const nextDisabled = computed<boolean>(() => {
  const [y, m, d] = current.split('-').map(Number);
  const lastDay = new Date(
    y ?? 0,
    (m ?? 1) - 1,
    (d ?? 1) + daysRange.value - 1,
  );
  const lastDayStr = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
  return lastDayStr >= end.substring(0, 10);
});

// Shows current visible date range between the navigation arrows
const dateRangeLabel = computed<string>(() => {
  const [y, m, d] = current.split('-').map(Number);
  const start = new Date(y ?? 0, (m ?? 1) - 1, d ?? 1);

  if (daysRange.value === 1) {
    return start.toLocaleDateString(locale.value, {
      ...(quasar.screen.gt.xs && { weekday: 'short' }),
      day: 'numeric',
      month: 'short',
    });
  }

  const end = new Date(start.getTime() + (daysRange.value - 1) * 86400000);
  const startStr = start.toLocaleDateString(locale.value, {
    day: 'numeric',
    month: 'short',
  });
  const endStr = end.toLocaleDateString(locale.value, {
    day: 'numeric',
    month: 'short',
  });
  return `${startStr} – ${endStr}`;
});

const navYearMonthMin = computed<string>(() => {
  const [y, m] = start.split('-');
  return `${y}/${m}`;
});

const navYearMonthMax = computed<string>(() => {
  const [y, m] = end.split('-');
  return `${y}/${m}`;
});

function dateOptions(date: string): boolean {
  const d = date.replace(/\//g, '-');
  return d >= start.substring(0, 10) && d <= end.substring(0, 10);
}

function onDatePick(date: string | null) {
  if (!date) {
    return;
  }
  emit('jump', date);
  datePickerRef.value?.hide();
}

function next() {
  emit('next');
}

function previous() {
  emit('previous');
}
</script>

<style lang="scss" scoped>
.cal-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;

  @media (min-width: 600px) {
    gap: 8px;
  }

  // MD3 segmented buttons reserve space for a selection checkmark on every
  // segment, which makes this compact toggle too wide. Selection is already
  // shown by the secondary-container fill, so drop the checkmark spacers.
  &__plan-toggle {
    :deep(.q-btn__content)::before,
    :deep(.q-btn__content)::after {
      display: none !important;
    }
  }

  &__center {
    display: flex;
    align-items: center;
    gap: 0;
    flex: 1;
    justify-content: center;
    min-width: 0;
  }

  &__date-btn {
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
    color: var(--md3-on-surface);

    @media (min-width: 600px) {
      font-size: 14px;
      min-width: 140px;
    }
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 0;

    @media (min-width: 600px) {
      gap: 4px;
    }
  }

  &__stepper {
    display: flex;
    align-items: center;

    padding: 0 2px;
    border: 1px solid var(--md3-outline-variant);
    border-radius: 999px;

    color: var(--md3-on-surface-variant);

    &-val {
      font-size: 13px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      color: var(--md3-on-surface);
      min-width: 28px;
      text-align: center;
      user-select: none;
    }
  }
}
</style>

<i18n lang="yaml" locale="en">
plan:
  a: 'Plan A'
  b: 'Plan B'
  both: 'Both'
options:
  print: 'Print calendar'
  settings: 'Calendar settings'
</i18n>

<i18n lang="yaml" locale="de">
plan:
  a: 'Plan A'
  b: 'Plan B'
  both: 'Beide'
options:
  print: 'Kalender drucken'
  settings: 'Kalendereinstellungen'
</i18n>

<i18n lang="yaml" locale="fr">
plan:
  a: 'Plan A'
  b: 'Plan B'
  both: 'Les deux'
options:
  print: 'Imprimer le calendrier'
  settings: 'Paramètres du calendrier'
</i18n>

<i18n lang="yaml" locale="pl">
plan:
  a: 'Plan A'
  b: 'Plan B'
  both: 'Oba'
options:
  print: 'Drukuj kalendarz'
  settings: 'Ustawienia kalendarza'
</i18n>

<i18n lang="yaml" locale="cs">
plan:
  a: 'Plán A'
  b: 'Plán B'
  both: 'Oba'
options:
  print: 'Vytisknout kalendář'
  settings: 'Nastavení kalendáře'
</i18n>
