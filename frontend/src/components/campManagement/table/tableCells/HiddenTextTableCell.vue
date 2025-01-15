<template>
  <q-btn
    v-if="visible"
    :size="size"
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
        {{ props.props.value }}
      </q-banner>
    </q-popup-proxy>
  </q-btn>

  <template v-if="invalid">
    {{ props.props.value }}
  </template>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';

const props = defineProps<TableCellProps>();

const invalid = computed<boolean>(() => {
  return props.props.value !== undefined && !isString(props.props.value);
});

const visible = computed<boolean>(() => {
  return (
    props.props.value !== undefined &&
    isString(props.props.value) &&
    props.props.value.length > 0
  );
});

function isString(data: unknown): data is string {
  return typeof props.props.value === 'string';
}

const size = computed<string>(() => {
  return props.props.dense ? 'xs' : 'md';
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
