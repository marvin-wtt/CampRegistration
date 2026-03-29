<template>
  <!-- Loading is handled with skeleton loading -->
  <page-state-handler
    padding
    :error
    class="row justify-center"
  >
    <!-- content -->
    <div class="column col-sm-10 col-md-9 col-lg-7 col-xl-6 col-12">
      <results-list
        :header="t('header.open')"
        :camps="activeCamps"
        :loading
        active
      />

      <results-list
        :header="t('header.closed')"
        :camps="inactiveCamps"
        :loading
      />
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { computed, onMounted } from 'vue';
import type { Camp } from '@camp-registration/common/entities';
import { useAssignedCampsStore } from 'stores/assigned-camps-store';
import { storeToRefs } from 'pinia';
import ResultsList from 'components/campManagement/index/ResultsList.vue';
import PageStateHandler from 'components/common/PageStateHandler.vue';

const { t } = useI18n();
const assignedCampsStore = useAssignedCampsStore();

const { data: camps, isLoading: loading, error } = storeToRefs(assignedCampsStore);

onMounted(() => void assignedCampsStore.fetchData());

const activeCamps = computed<Camp[]>(() => {
  return (camps.value ?? []).filter((value) => value.active).toSorted(sortCamps);
});

const inactiveCamps = computed<Camp[]>(() => {
  return (camps.value ?? []).filter((value) => !value.active).toSorted(sortCamps);
});

function sortCamps(a: Camp, b: Camp) {
  return new Date(b.startAt).getTime() - new Date(a.startAt).getTime();
}
</script>

<i18n lang="yaml" locale="en">
header:
  open: 'Registration Open'
  closed: 'Registration Closed'
</i18n>

<i18n lang="yaml" locale="de">
header:
  open: 'Anmeldung offen'
  closed: 'Anmeldung geschlossen'
</i18n>

<i18n lang="yaml" locale="fr">
header:
  open: 'Inscription ouverte'
  closed: 'Inscription fermée'
</i18n>

<i18n lang="yaml" locale="pl">
header:
  open: 'Rejestracja otwarta'
  closed: 'Rejestracja zamknięta'
</i18n>

<i18n lang="yaml" locale="cs">
header:
  open: 'Registrace otevřena'
  closed: 'Registrace uzavřena'
</i18n>

<style scoped></style>
