<template>
  <q-icon
    v-if="icon !== undefined"
    :name="icon"
    :size="size"
  />

  <a v-else>
    {{ props.props.value }}
  </a>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { QTableBodyCellProps } from 'src/types/quasar/QTableBodyCellProps';

interface Props {
  props: QTableBodyCellProps;
  options?: object;
  printing: boolean;
}

const props = defineProps<Props>();

const icon = computed<string | undefined>(() => {
  return props.props.value === 'de'
    ? 'img:flags/de.svg'
    : props.props.value === 'fr'
    ? 'img:flags/fr.svg'
    : undefined;
});

const size = computed<string>(() => {
  return props.props.dense ? 'xs' : 'md';
});
</script>

<style scoped></style>
