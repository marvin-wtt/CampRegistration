<template>
  <q-btn
    v-if="visible"
    :size
    class="q-mx-sm q-px-sm"
    dense
    icon="attach_file"
    outline
    stretch
    @click="open"
  />

  <template v-else>
    {{ cellProps.value }}
  </template>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { openURL } from 'quasar';
import type { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';

const { props: cellProps } = defineProps<TableCellProps>();

const url = computed<string | undefined>(() => {
  if (typeof cellProps.value !== 'string') {
    return undefined;
  }

  if (cellProps.value.match(/^https?:\/\//)) {
    return cellProps.value;
  }

  return `${window.origin}/api/v1/files/${cellProps.value}`;
});

const size = computed<string>(() => {
  return cellProps.dense ? 'xs' : 'md';
});

const visible = computed<boolean>(() => {
  return cellProps.value !== undefined && typeof cellProps.value === 'string';
});

function open() {
  if (!url.value) {
    return;
  }

  openURL(url.value);
}
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
