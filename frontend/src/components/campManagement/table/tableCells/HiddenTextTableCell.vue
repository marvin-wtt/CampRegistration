<template>
  <q-btn
    v-if="visible"
    :size
    class="q-mx-sm q-px-sm"
    dense
    flat
    icon="textsms"
  >
    <q-popup-proxy>
      <q-banner
        dense
        style="max-width: 500px"
      >
        {{ props.value }}
      </q-banner>
    </q-popup-proxy>
  </q-btn>

  <template v-if="invalid">
    {{ props.value }}
  </template>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';

const { props: cellProps } = defineProps<TableCellProps>();

const invalid = computed<boolean>(() => {
  return cellProps.value !== undefined && !isString(cellProps.value);
});

const visible = computed<boolean>(() => {
  return (
    cellProps.value !== undefined &&
    isString(cellProps.value) &&
    cellProps.value.length > 0
  );
});

function isString(data: unknown): data is string {
  return typeof cellProps.value === 'string';
}

const size = computed<string>(() => {
  return cellProps.dense ? 'xs' : 'md';
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
