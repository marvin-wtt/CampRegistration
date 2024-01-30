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
        {{ props.props.value }}
      </q-banner>
    </q-popup-proxy>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';

const props = defineProps<TableCellProps>();
const limit = 25;
const containerHover = ref<boolean>(false);
const bannerHover = ref<boolean>(false);

const bannerVisible = computed<boolean>(() => {
  // Banner hover might behave weird when trying to hover the element below
  // return extraWords.value > 0 && (containerHover.value || bannerHover.value);
  return extraWords.value > 0 && containerHover.value;
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

const extraWords = computed<number>(() => {
  const value = props.props.value;

  if (typeof value !== 'string') {
    return 0;
  }

  const str = value.trim();
  const total = str.length;
  const lastSpaceIndex = str.substring(0, limit).lastIndexOf(' ');
  if (lastSpaceIndex < 0) {
    return 0;
  }

  return total - lastSpaceIndex;
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
