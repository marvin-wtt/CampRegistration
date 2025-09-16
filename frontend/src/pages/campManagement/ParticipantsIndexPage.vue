<template>
  <page-state-handler
    :error
    :loading
  >
    <result-table
      v-if="campDetailStore.data"
      ref="table"
      class="absolute fit"
      :questions="columns"
      :results="registrationStore.data ?? []"
      :templates="templateStore.data ?? []"
      :camp="campDetailStore.data"
    />
  </page-state-handler>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useCampDetailsStore } from 'stores/camp-details-store';
import { useRegistrationsStore } from 'stores/registration-store';
import ResultTable from 'components/campManagement/table/ResultTable.vue';
import { useTemplateStore } from 'stores/template-store';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import type { TableColumnTemplate } from '@camp-registration/common/entities';
import PageStateHandler from 'components/common/PageStateHandler.vue';

const campDetailStore = useCampDetailsStore();
const registrationStore = useRegistrationsStore();
const templateStore = useTemplateStore();
const { to } = useObjectTranslation();

campDetailStore.fetchData();
registrationStore.fetchData();
templateStore.fetchData();

const loading = computed<boolean>(() => {
  return (
    registrationStore.isLoading ||
    campDetailStore.isLoading ||
    templateStore.isLoading
  );
});

const error = computed<string | null>(() => {
  return campDetailStore.error ?? registrationStore.error;
});

const columns = computed<TableColumnTemplate[]>(() => {
  const data = campDetailStore.data;

  const columns: TableColumnTemplate[] = [];

  if (data?.form === undefined || !('pages' in data.form)) {
    return [];
  }

  data.form.pages.forEach((data) => {
    if (!('elements' in data)) {
      return;
    }

    data.elements.forEach((data) => {
      // Filter text-only elements
      if (data.type === 'expression') {
        return;
      }

      const label = to(data.title);
      const field = data.name;
      columns.push({
        name: data.name,
        label: label,
        field: field,
        align: 'left',
        sortable: true,
      });
    });
  });

  return columns;
});
</script>
