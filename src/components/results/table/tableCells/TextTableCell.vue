<template>
  {{ truncatedText }}

  <q-btn
    v-if="isTruncated"
    :size="size"
    class="q-mx-sm q-px-sm"
    dense
    label="..."
    outline
    stretch
  >
    <q-popup-proxy>
      <q-banner
        dense
        style="max-width: 500px"
      >
        {{ props.props.value }}
      </q-banner>
    </q-popup-proxy>
  </q-btn>
</template>

<script lang="ts" setup>
import { QTableBodyCellProps } from 'src/types/quasar/QTableBodyCellProps';
import { computed } from 'vue';

interface Props {
  props: QTableBodyCellProps;
  options?: object;
  printing: boolean;
}

const props = defineProps<Props>();

const limit = 25;

const size = computed<string>(() => {
  return props.props.dense ? 'xs' : 'md';
});

const isTruncated = computed<boolean>(() => {
  const value = props.props.value;

  return typeof value === 'string' && value.trim().length > limit;
});

const truncatedText = computed<string | unknown>(() => {
  const value = props.props.value;

  if (typeof value !== 'string') {
    return value;
  }

  if (isTruncated.value) {
    const lastSpaceIndex = value.substring(0, limit).lastIndexOf(' ');
    if (lastSpaceIndex === -1) {
      return value.substring(0, limit);
    }

    return value.substring(0, lastSpaceIndex);
  }

  return value;
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
