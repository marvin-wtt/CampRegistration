<template>
  <page-state-handler
    :error
    :loading
  >
    <result-table
      v-if="camp.data.value"
      ref="table"
      class="absolute fit"
      :questions="columns"
      :results="results"
      :templates="templates.data.value ?? []"
      :camp="camp.data.value"
    />
  </page-state-handler>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useCampDetailsStore } from 'stores/camp-details-store';
import { storeToRefs } from 'pinia';
import { useRegistrationsStore } from 'stores/registration-store';
import ResultTable from 'components/campManagement/table/ResultTable.vue';
import { useTemplateStore } from 'stores/template-store';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import type {
  Registration,
  TableColumnTemplate,
} from '@camp-registration/common/entities';
import PageStateHandler from 'components/common/PageStateHandler.vue';

const campDetailStore = useCampDetailsStore();
const registrationStore = useRegistrationsStore();
const templateStore = useTemplateStore();
const { to } = useObjectTranslation();

campDetailStore.fetchData();
registrationStore.fetchData();
templateStore.fetchData();

const camp = storeToRefs(campDetailStore);
const registrations = storeToRefs(registrationStore);
const templates = storeToRefs(templateStore);

const loading = computed<boolean>(() => {
  return (
    registrations.isLoading.value ||
    camp.isLoading.value ||
    templates.isLoading.value
  );
});

const error = computed<string | null>(() => {
  return camp.error.value ?? registrations.error.value;
});

const columns = computed<TableColumnTemplate[]>(() => {
  const data = camp.data.value;

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

const results = computed<Registration[]>(() => {
  const results = registrations.data.value;

  if (!results) {
    return [];
  }

  return results;
});
</script>
