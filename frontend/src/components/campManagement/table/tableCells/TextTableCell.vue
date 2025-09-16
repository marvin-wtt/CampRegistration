<template>
  <div
    class="fit"
    @mouseenter="containerHover = true"
    @mouseleave="containerHover = false"
  >
    {{ truncatedText }}

    <template v-if="extraWords > 0">
      {{ `(+${extraWords})` }}
    </template>

    <q-popup-proxy v-model="bannerVisible">
      <q-banner
        dense
        style="max-width: 500px"
        @mouseenter="bannerHover = true"
        @mouseleave="bannerHover = false"
      >
        {{ cellProps.value }}
      </q-banner>
    </q-popup-proxy>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import type { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';

const { props: cellProps, options } = defineProps<TableCellProps>();
const containerHover = ref<boolean>(false);
const bannerHover = ref<boolean>(false);

const defaultLimit = 25;

const limit = computed<number>(() => {
  if (options && 'limit' in options && typeof options.limit === 'number') {
    return options.limit;
  }

  return defaultLimit;
});

const bannerVisible = computed<boolean>(() => {
  // Banner hover might behave weird when trying to hover the element below
  // return extraWords.value > 0 && (containerHover.value || bannerHover.value);
  return extraWords.value > 0 && containerHover.value;
});

const isTruncated = computed<boolean>(() => {
  const value = cellProps.value;

  return typeof value === 'string' && value.trim().length > limit.value;
});

const truncatedText = computed<string | unknown>(() => {
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

const extraWords = computed<number>(() => {
  const value = cellProps.value;
  const text = truncatedText.value;

  if (typeof value !== 'string' || typeof text !== 'string') {
    return 0;
  }

  return value.trim().length - text.length;
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
