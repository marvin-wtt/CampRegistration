<template>
  <div class="row items-center justify-between q-pa-sm q-gutter-sm">
    <!-- Plan A/B toggle -->
    <q-btn-toggle
      :model-value="plan"
      :options="planOptions"
      rounded
      dense
      outline
      toggle-color="primary"
      @update:model-value="$emit('update:plan', $event)"
    />

    <!-- Navigation buttons -->
    <div class="row items-center q-gutter-xs">
      <q-btn
        icon="arrow_back"
        :disable="prevDisabled"
        rounded
        dense
        flat
        @click="previous"
      />
      <q-btn
        icon="arrow_forward"
        :disable="nextDisabled"
        rounded
        dense
        flat
        @click="next"
      />
    </div>

    <!-- Right controls -->
    <div class="row items-center q-gutter-xs">
      <q-select
        v-model="daysRange"
        :label="t('options.range.label')"
        :options="dateRangeOptions"
        class="gt-xs"
        rounded
        outlined
        dense
        style="min-width: 80px"
      />

      <q-btn
        icon="print"
        rounded
        dense
        flat
        @click="$emit('print')"
      >
        <q-tooltip>{{ t('options.print') }}</q-tooltip>
      </q-btn>

      <q-btn
        icon="settings"
        rounded
        dense
        flat
        @click="$emit('settings')"
      >
        <q-tooltip>{{ t('options.settings') }}</q-tooltip>
      </q-btn>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { computed, onMounted } from 'vue';
import { daysBetweenDates } from 'src/utils/date';

const { t } = useI18n();

interface Props {
  modelValue: number;
  plan: 'a' | 'b' | 'both';
  start: string;
  end: string;
  current: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: number): void;
  (e: 'update:plan', val: 'a' | 'b' | 'both'): void;
  (e: 'next'): void;
  (e: 'previous'): void;
  (e: 'print'): void;
  (e: 'settings'): void;
}>();

onMounted(() => {
  if (daysRange.value > maxDays.value) {
    daysRange.value = maxDays.value;
  }
});

const planOptions = computed(() => [
  { label: t('plan.a'), value: 'a', icon: 'wb_sunny' },
  { label: t('plan.both'), value: 'both', icon: 'repeat' },
  { label: t('plan.b'), value: 'b', icon: 'water_drop' },
]);

const daysRange = computed<number>({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const prevDisabled = computed<boolean>(() => {
  return props.current <= props.start.substring(0, 10);
});

const nextDisabled = computed<boolean>(() => {
  const [y, m, d] = props.current.split('-').map(Number);
  const lastDay = new Date(y!, m! - 1, d! + daysRange.value - 1);
  const lastDayStr = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
  return lastDayStr >= props.end.substring(0, 10);
});

function next() {
  emit('next');
}

function previous() {
  emit('previous');
}

const dateRangeOptions = computed(() =>
  Array.from({ length: maxDays.value }, (_, index) => index + 1),
);

const maxDays = computed<number>(() => {
  return daysBetweenDates(new Date(props.start), new Date(props.end)) + 1;
});
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
plan:
  a: 'Plan A'
  b: 'Plan B'
  both: 'Both'
options:
  range:
    label: 'Days'
  print: 'Print calendar'
  settings: 'Calendar settings'
</i18n>

<i18n lang="yaml" locale="de">
plan:
  a: 'Plan A'
  b: 'Plan B'
  both: 'Beide'
options:
  range:
    label: 'Tage'
  print: 'Kalender drucken'
  settings: 'Kalendereinstellungen'
</i18n>

<i18n lang="yaml" locale="fr">
plan:
  a: 'Plan A'
  b: 'Plan B'
  both: 'Les deux'
options:
  range:
    label: 'Jours'
  print: 'Imprimer le calendrier'
  settings: 'Paramètres du calendrier'
</i18n>
