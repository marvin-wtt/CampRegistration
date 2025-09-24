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
import { extractFormFields } from 'src/utils/surveyJS';

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
  if (!data?.form) {
    return [];
  }

  return extractFormFields(data.form).map<TableColumnTemplate>(
    ({ label, value }) => ({
      name: value,
      label: to(label),
      field: value,
      align: 'left',
      sortable: true,
    }),
  );
});
</script>
