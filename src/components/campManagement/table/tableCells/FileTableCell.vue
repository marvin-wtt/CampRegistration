<template>
  <q-btn
    v-if="visible"
    :size="size"
    class="q-mx-sm q-px-sm"
    dense
    icon="attach_file"
    outline
    stretch
    @click="open"
  />

  <template v-else>
    {{ props.props.value }}
  </template>
</template>

<script lang="ts" setup>
import { QTableBodyCellProps } from 'src/types/quasar/QTableBodyCellProps';
import { computed } from 'vue';
import { openURL } from 'quasar';

interface Props {
  props: QTableBodyCellProps;
  options?: object;
  printing: boolean;
}

const props = defineProps<Props>();

function open() {
  if (typeof props.props.value !== 'string') {
    return;
  }

  openURL(props.props.value);
}

const size = computed<string>(() => {
  return props.props.dense ? 'xs' : 'md';
});

const visible = computed<boolean>(() => {
  return (
    props.props.value !== undefined && typeof props.props.value === 'string'
  );
});
</script>

<style lang="scss" scoped>
.body--light {
  a {
    color: #000;
  }
}

.body--dark {
  a {
    color: #fff;
  }
}

a {
  text-decoration: none;
}
</style>
