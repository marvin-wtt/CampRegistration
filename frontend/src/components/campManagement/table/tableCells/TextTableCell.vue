<template>
  <default-table-cell
    v-if="gridMode"
    :props="props"
    :camp="camp"
    :printing="printing"
  />

  <div
    v-else
    class="text-cell fit"
    :class="{ 'text-cell--expandable': isTruncated }"
  >
    {{ cell.text }}

    <template v-if="cell.remaining > 0 && showExtra">
      {{ `(+${cell.remaining})` }}
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
        {{ fullText }}
      </q-banner>
    </q-popup-proxy>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';
import type { TextOptions } from 'components/campManagement/table/tableCells/TextOptions';
import DefaultTableCell from 'components/campManagement/table/tableCells/DefaultTableCell.vue';

const { props: cellProps, options } =
  defineProps<TableCellProps<TextOptions>>();

const DEFAULT_LIMIT = 25;

const showExtra = computed<boolean>(() => options?.showRemaining ?? true);

const limit = computed<number>(() => options?.maxLength ?? DEFAULT_LIMIT);

const cell = computed<{ text: unknown; remaining: number }>(() => {
  const value = cellProps.value;

  if (typeof value !== 'string') {
    return { text: value, remaining: 0 };
  }

  const trimmed = value.trim();

  if (trimmed.length <= limit.value) {
    return { text: trimmed, remaining: 0 };
  }

  const slice = trimmed.slice(0, limit.value);
  const lastSpace = slice.lastIndexOf(' ');
  const text = lastSpace === -1 ? slice : slice.slice(0, lastSpace);

  return { text, remaining: trimmed.length - text.length };
});

const isTruncated = computed<boolean>(() => cell.value.remaining > 0);

// Full (untruncated) value shown in the expand popup, trimmed to match the cell.
const fullText = computed<unknown>(() => {
  const value = cellProps.value;

  return typeof value === 'string' ? value.trim() : value;
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
