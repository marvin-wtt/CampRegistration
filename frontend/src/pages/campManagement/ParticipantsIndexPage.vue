<template>
  <page-state-handler
    :error
    :loading
  >
    <result-table-interactive
      v-if="camp"
      class="absolute fit"
      :questions="columns"
      :registrations="registrations ?? []"
      :templates="templates ?? []"
      :camp
      @export="onTemplatesPrint"
    />
  </page-state-handler>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { useCampDetailsStore } from 'stores/camp-details-store';
import { useRegistrationsStore } from 'stores/registration-store';
import ResultTableInteractive from 'components/campManagement/table/ResultTableInteractive.vue';
import { useTemplateStore } from 'stores/template-store';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import type { TableColumnTemplate } from '@camp-registration/common/entities';
import PageStateHandler from 'components/common/PageStateHandler.vue';
import { extractFormFields } from 'src/utils/surveyJS';
import type { PrintTablesPayload } from 'components/campManagement/table/PrintTablesPayload';
import { openPrintIframe } from 'src/utils/printIframe';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';

const campDetailStore = useCampDetailsStore();
const { data: camp } = storeToRefs(campDetailStore);
const registrationStore = useRegistrationsStore();
const { data: registrations } = storeToRefs(registrationStore);
const templateStore = useTemplateStore();
const { data: templates } = storeToRefs(templateStore);

const quasar = useQuasar();
const { locale } = useI18n();
const { to } = useObjectTranslation();

onMounted(async () => {
  await Promise.allSettled([
    campDetailStore.fetchData(),
    registrationStore.fetchData(),
    templateStore.fetchData(),
  ]);
});

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
  if (!camp.value?.form) {
    return [];
  }

  return extractFormFields(camp.value.form).map<TableColumnTemplate>(
    ({ label, value }) => ({
      name: value,
      label: to(label),
      field: value,
      align: 'left',
      sortable: true,
    }),
  );
});

function onTemplatesPrint(templateIds: string[]) {
  if (!templateStore.data || !camp.value) {
    return;
  }

  const templates = templateStore.data
    .filter((t) => templateIds.includes(t.id))
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  // Build payload
  const payload: PrintTablesPayload = {
    locale: locale.value,
    questions: columns.value,
    registrations: registrations.value ?? [],
    camp: camp.value,
    templates,
    timestamp: new Date().toISOString(),
  };

  // Store payload for the print route
  const key = `print:tables:${camp.value.id}:${Date.now()}`;
  sessionStorage.setItem(key, JSON.stringify(payload));

  openPrintIframe(`/print/tables?key=${encodeURIComponent(key)}`, {
    messagePrefix: 'PRINT_TABLES',
    onError: (error) => {
      quasar.notify({
        type: 'negative',
        message: 'An error occurred while preparing the printout.',
        caption: error,
      });
    },
    onAfterPrint: () => {
      sessionStorage.removeItem(key);
    },
  });
}
</script>
