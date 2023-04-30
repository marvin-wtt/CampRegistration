<template>
  <apexchart
    :height="props.height"
    :options="options"
    :series="series"
    :width="props.width"
    type="donut"
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
  countries: string[];
}

interface Participant {
  country?: string;
}

const props = defineProps<Props>();

const series = computed<number[]>(() => {
  return props.countries.map(
    (country) =>
      props.participants.filter((value) => value.country === country).length
  );
});

const labels = computed<string[]>(() => {
  return props.countries.map((value) => t('country.' + value));
});

const options = ref({
  // TODO Use total number instead of percentage
  title: {
    text: t('title'),
    align: 'left',
  },
  labels: labels.value,
  plotOptions: {
    pie: {
      donut: {
        labels: {
          show: true,
          name: {
            show: false,
          },
          total: {
            show: true,
            showAlways: true,
          },
        },
      },
    },
  },
});
</script>

<i18n>
{
  "en": {
    "title": "Participants by country",
    "country": {
      "de": "Germany",
      "fr": "France"
    }
  }
}

</i18n>

<style scoped></style>
