<template>
  <div class="row justify-between q-pa-sm">
    <div>Header</div>

    <div>
      <q-btn
        icon="arrow_back"
        rounded
        dense
        @click="previous"
      />
      <q-btn
        icon="arrow_forward"
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
  start: string | Date;
  end: string | Date;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: number);
  (e: 'next'): void;
  (e: 'previous'): void;
}>();

onMounted(() => {
  daysRange.value = maxDays.value;
});

const daysRange = computed({
  get: () => props.modelValue,
  set: (val: number) => emit('update:modelValue', val),
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
