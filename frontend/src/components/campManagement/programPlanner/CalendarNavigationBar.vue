<template>
  <div class="row justify-between q-pa-sm">
    <div>Header</div>

    <div>
      <q-btn
        icon="arrow_back"
        :disable="prevDisabled"
        rounded
        dense
        @click="previous"
      />
      <q-btn
        icon="arrow_forward"
        :disable="nextDisabled"
        rounded
        dense
        @click="next"
      />
    </div>

    <q-select
      v-model="daysRange"
      :label="t('options.range.label')"
      :options="dateRangeOptions"
      rounded
      outlined
      dense
    />
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { computed, onMounted } from 'vue';

const { t } = useI18n();

interface Props {
  modelValue: number;
  start: string;
  end: string;
  current: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: number): void;
  (e: 'next'): void;
  (e: 'previous'): void;
}>();

onMounted(() => {
  if (daysRange.value > maxDays.value) {
    daysRange.value = maxDays.value;
  }
});

const daysRange = computed<number>({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const prevDisabled = computed<boolean>(() => {
  const startDate = new Date(props.start);
  startDate.setHours(0, 0);
  const currentDate = new Date(props.current);

  return startDate.getTime() >= currentDate.getTime();
});

const DAY_IN_MY = 24 * 60 * 60 * 1000;
const nextDisabled = computed<boolean>(() => {
  const endDate = new Date(props.end);
  endDate.setHours(0, 0);
  const currentDate = new Date(props.current);

  return (
    endDate.getTime() <=
    currentDate.getTime() + (daysRange.value - 1) * DAY_IN_MY
  );
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
  return daysBetweenDates(new Date(props.start), new Date(props.end));
});

function daysBetweenDates(startDate: Date, endDate: Date): number {
  // Calculate the time difference in milliseconds
  const timeDifference = endDate.getTime() - startDate.getTime();

  // Calculate the number of days and round up
  return Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
}
</script>

<style scoped></style>
