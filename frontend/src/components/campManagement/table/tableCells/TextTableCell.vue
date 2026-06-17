<template>
  <span
    v-if="gridMode && empty"
    class="cell-placeholder"
  >
    —
  </span>

  <div
    class="text-cell fit"
    :class="{ 'text-cell--expandable': isTruncated }"
  >
    {{ truncatedText }}

    <template v-if="extraCharacters > 0 && showExtra">
      {{ `(+${extraCharacters})` }}
    </template>

    <!-- Opens on click/tap on both desktop and mobile; renders as a centered
         dialog on small screens for easy reading and dismissal. -->
    <q-popup-proxy
      v-if="isTruncated"
      :breakpoint="600"
    >
      <q-banner
        dense
        class="text-cell__banner"
      >
        {{ cellProps.value }}
      </q-banner>
    </q-popup-proxy>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';
import type { TextOptions } from 'components/campManagement/table/tableCells/TextOptions';

const { props: cellProps, options } =
  defineProps<TableCellProps<TextOptions>>();

const DEFAULT_LIMIT = 25;

const config = computed<TextOptions>(() => {
  return options as TextOptions;
});

const showExtra = computed<boolean>(() => config.value.showRemaining ?? true);

const limit = computed<number>(() => {
  if (options && 'limit' in options && typeof options.limit === 'number') {
    return options.limit;
  }

  return config.value.maxLength ?? DEFAULT_LIMIT;
});

const isTruncated = computed<boolean>(() => {
  const value = cellProps.value;

  return typeof value === 'string' && value.trim().length > limit.value;
});

const truncatedText = computed<unknown>(() => {
  const value = cellProps.value;

  if (typeof value !== 'string') {
    return value;
  }

  if (isTruncated.value) {
    const lastSpaceIndex = value.substring(0, limit.value).lastIndexOf(' ');
    if (lastSpaceIndex === -1) {
      return value.substring(0, limit.value);
    }

    return value.substring(0, lastSpaceIndex);
  }

  return value;
});

const extraCharacters = computed<number>(() => {
  const value = cellProps.value;
  const text = truncatedText.value;

  if (typeof value !== 'string' || typeof text !== 'string') {
    return 0;
  }

  return value.trim().length - text.length;
});

const empty = computed<boolean>(() => {
  const value = cellProps.value;

  return (
    value === null ||
    value === undefined ||
    (typeof value === 'string' && value.trim().length === 0)
  );
});
</script>

<style lang="scss" scoped>
.text-cell {
  display: flex;
  align-items: center;
}

.text-cell--expandable {
  cursor: pointer;
}

.text-cell__banner {
  max-width: 500px;
  white-space: pre-wrap;
  word-break: break-word;

  // In dialog mode (small screens) fill the available width for easy reading.
  .q-dialog & {
    max-width: 90vw;
  }
}

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
