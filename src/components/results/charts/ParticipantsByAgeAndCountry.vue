<template>
  <apexchart
    :height="props.height"
    :options="options"
    :series="series"
    :width="props.width"
    type="bar"
  />
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface Props {
  width?: string;
  height?: string;
  participants: Participant[];
  ageMin: number;
  ageMax: number;
  countries: string[];
}

interface Participant {
  age?: number;
  country: string;
}

interface SeriesEntry {
  name: string;
  data: number[];
}

const props = defineProps<Props>();

const minAge = computed<number>(() => {
  let minAge = props.ageMin;
  props.participants.forEach((value) => {
    if (value.age && minAge > value.age) {
      minAge = value.age;
    }
  });
  return minAge;
});

const maxAge = computed<number>(() => {
  let maxAge = props.ageMax;
  props.participants.forEach((value) => {
    if (value.age && maxAge < value.age) {
      maxAge = value.age;
    }
  });
  return maxAge;
});

const categories = computed<number[]>(() => {
  return Array.from(
    { length: maxAge.value - minAge.value + 1 },
    (_, index) => index + minAge.value
  );
});

const options = ref({
  title: {
    text: t('title'),
    align: 'left',
  },
  chart: {
    stacked: true,
  },
  xaxis: {
    categories: categories,
  },
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '75%',
      endingShape: 'rounded',
    },
  },
});

const series = computed<SeriesEntry[]>(() => {
  const series: SeriesEntry[] = [];
  props.countries.forEach((country) => {
    const data: number[] = [];
    categories.value.forEach((age) => {
      data.push(
        props.participants.filter(
          (value) => value.age === age && value.country === country
        ).length
      );
    });

    series.push({
      name: country,
      data: data,
    });
  });
  return series;
});
</script>

<i18n>
{
  "en": {
    "title": "Participants by age"
  }
}
</i18n>

<style scoped></style>
