<template>
  <apexchart
    :options="options"
    :series="series"
    :width="props.width"
    height="300px"
    type="radialBar"
  />
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Registration } from 'src/types/Registration';

const { t } = useI18n();

interface Props {
  width?: string;
  height?: string;
  participants: Registration[];
  max: number;
  country: string;
  counselor?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  counselor: false,
});

const series = computed<number[]>(() => {
  // TODO Filter counselors
  // TODO Use accessors
  return [
    // props.participants.filter((value) => {
    //   return (
    //     value['waiting_list'] !== true && value['country'] === props.country
    //   );
    // }).length,
  ];
});

const options = ref({
  chart: {
    type: 'radialBar',
    offsetY: -10,
  },
  plotOptions: {
    radialBar: {
      startAngle: -135,
      endAngle: 135,
      dataLabels: {
        name: {
          fontSize: '16px',
          color: undefined,
          offsetY: 120,
        },
        total: {
          offsetY: 76,
          show: true,
          formatter: function (val) {
            return val.series[0];
          },
        },
        value: {
          offsetY: 76,
          fontSize: '22px',
          color: undefined,
          formatter: function (val) {
            return val + '%';
          },
        },
      },
    },
  },
  fill: {
    type: 'gradient',
    gradient: {
      shade: 'dark',
      shadeIntensity: 0.15,
      inverseColors: false,
      opacityFrom: 1,
      opacityTo: 1,
      stops: [0, 50, 65, 91],
    },
  },
  labels: ['Registrations'],
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
