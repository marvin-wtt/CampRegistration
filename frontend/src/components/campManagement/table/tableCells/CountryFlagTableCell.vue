<template>
  <div v-if="country">
    <country-icon :country>
      <q-tooltip>
        {{ cellProps.value }}
      </q-tooltip>
    </country-icon>
  </div>

  <a v-else>
    {{ cellProps.value }}
  </a>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';
import CountryIcon from 'components/common/localization/CountryIcon.vue';

const { props: cellProps } = defineProps<TableCellProps>();

const country = computed<string | undefined>(() => {
  return typeof cellProps.value === 'string' ? cellProps.value : undefined;
});
</script>

<style scoped></style>
