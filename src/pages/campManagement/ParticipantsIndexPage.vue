<template>
  <page-state-handler
    :error="error"
    :loading="loading"
  >
    <ResultTable
      ref="table"
      class="absolute fit"
      :questions="columns"
      :results="results"
      :templates="templates.data.value ?? []"
      :camp="camp.data.value as Camp"
    />
  </page-state-handler>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useCampDetailsStore } from 'stores/camp-details-store';
import { storeToRefs } from 'pinia';
import { useRegistrationsStore } from 'stores/registration-store';
import { DataProviderRegistry } from 'src/lib/registration/DataProviderRegistry';
import { QTableColumn } from 'src/types/quasar/QTableColum';
import ResultTable from 'components/campManagement/table/ResultTable.vue';
import { useTemplateStore } from 'stores/template-store';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import { Registration } from 'src/types/Registration';
import PageStateHandler from 'components/PageStateHandler.vue';
import { Camp } from 'src/types/Camp';

const campDetailStore = useCampDetailsStore();
const registrationStore = useRegistrationsStore();
const templateStore = useTemplateStore();
const { to } = useObjectTranslation();

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

const columns = computed<QTableColumn[]>(() => {
  const data = camp.data.value;

  const columns: QTableColumn[] = [];

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

  DataProviderRegistry.INSTANCE.providers.forEach((provider) => {
    results.forEach((registration) => {
      if (provider.isFit(registration)) {
        registration[provider.name] = provider.generate(registration);
      }
    });
  });

  return results;
});

// Data Providers
DataProviderRegistry.INSTANCE.register({
  title: 'Full Name',
  name: 'full_name',
  isFit(data: unknown): boolean {
    return hasFullName(data);
  },
  generate(data: unknown): string {
    if (!hasFullName(data)) return '';

    return `${data.first_name} ${data.last_name}`;
  },
});

function hasFullName(
  data: unknown
): data is { first_name?: string; last_name?: string } {
  if (data === null || typeof data !== 'object') return false;
  return (
    'first_name' in data &&
    typeof data.first_name === 'string' &&
    'last_name' in data &&
    typeof data.last_name === 'string'
  );
}

DataProviderRegistry.INSTANCE.register({
  title: 'Address',
  name: 'full_address',
  isFit(data: unknown): boolean {
    return hasAddressRows(data);
  },
  generate(data: unknown): string | number {
    if (!hasAddressRows(data)) return '';

    return data.address + ', ' + data.zip_code + ' ' + data.city;
  },
});

function hasAddressRows(
  data: unknown
): data is { address: string; zip_code: string; city: string } {
  if (data === null) return false;
  if (typeof data !== 'object') return false;

  return (
    'address' in data &&
    typeof data.address === 'string' &&
    'zip_code' in data &&
    typeof data.zip_code === 'number' &&
    'city' in data &&
    typeof data.city === 'string'
  );
}

DataProviderRegistry.INSTANCE.register({
  title: 'Age',
  name: 'age',
  isFit(data: unknown): boolean {
    if (!hasAgeRows(data)) return false;

    const date = data.date_of_birth;

    return new Date(date).toString() !== 'Invalid Date';
  },
  generate(data: unknown): string | number {
    if (!hasAgeRows(data)) return '';
    return calculateAge(data.date_of_birth);
  },
});

function hasAgeRows(data: unknown): data is { date_of_birth: string } {
  if (data === null) return false;
  if (typeof data !== 'object') return false;

  return 'date_of_birth' in data && typeof data.date_of_birth === 'string';
}

function calculateAge(date: string): number {
  const months = Date.now() - new Date(date).getTime();
  const years = new Date(months);

  return Math.abs(years.getUTCFullYear() - 1970);
}
</script>
