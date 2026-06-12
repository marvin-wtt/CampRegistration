<template>
  <page-state-handler
    :error
    :loading
    class="column"
  >
    <contact-form
      class="col"
      :registrations
      standalone
    />
  </page-state-handler>
</template>

<script lang="ts" setup>
import PageStateHandler from 'components/common/PageStateHandler.vue';
import { useRegistrationsStore } from 'stores/registration-store';
import { computed, onMounted } from 'vue';
import type { Registration } from '@camp-registration/common/entities';
import { useCampDetailsStore } from 'stores/camp-details-store';
import ContactForm from 'components/campManagement/contact/ContactForm.vue';

const registrationStore = useRegistrationsStore();
const campDetailsStore = useCampDetailsStore();

onMounted(async () => {
  await Promise.all([
    campDetailsStore.fetchData(),
    registrationStore.fetchData(),
  ]);
});

const error = computed<string | null>(() => {
  return registrationStore.error ?? campDetailsStore.error;
});

const loading = computed<boolean>(() => {
  return registrationStore.isLoading || campDetailsStore.isLoading;
});

const registrations = computed<Registration[]>(() => {
  return registrationStore.data ?? [];
});
</script>
