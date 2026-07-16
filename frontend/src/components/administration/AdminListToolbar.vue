<template>
  <div class="admin-toolbar q-mb-md">
    <div class="row items-center no-wrap q-mb-sm">
      <div class="column">
        <div class="text-h6 text-weight-medium">{{ title }}</div>
        <div
          v-if="total != null"
          class="text-caption text-on-surface-variant"
        >
          {{ t('count', { count: total }) }}
        </div>
      </div>

      <q-space />

      <slot name="actions" />
    </div>

    <div class="row items-center q-col-gutter-sm">
      <div class="col">
        <q-input
          v-model="search"
          :placeholder="searchPlaceholder ?? t('search')"
          debounce="300"
          dense
          outlined
          rounded
          clearable
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>

      <template v-if="hasFilters && !quasar.screen.lt.sm">
        <slot name="filters" />
      </template>

      <div
        v-if="hasFilters"
        class="col-auto lt-sm"
      >
        <q-btn
          icon="filter_list"
          round
          flat
          :color="filtersOpen ? 'primary' : undefined"
          @click="filtersOpen = !filtersOpen"
        >
          <q-tooltip>{{ t('filters') }}</q-tooltip>
        </q-btn>
      </div>

      <div class="col-auto">
        <q-btn
          icon="refresh"
          round
          flat
          :loading="loading"
          @click="emit('refresh')"
        >
          <q-tooltip>{{ t('refresh') }}</q-tooltip>
        </q-btn>
      </div>
    </div>

    <q-slide-transition v-if="hasFilters && quasar.screen.lt.sm">
      <div
        v-show="filtersOpen"
        class="row q-col-gutter-sm q-mt-sm"
      >
        <slot name="filters" />
      </div>
    </q-slide-transition>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, useSlots } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';

defineProps<{
  title: string;
  total?: number | null;
  searchPlaceholder?: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  refresh: [];
}>();

const search = defineModel<string>('search', { default: '' });

const { t } = useI18n();
const quasar = useQuasar();
const slots = useSlots();

const hasFilters = computed(() => !!slots.filters);
const filtersOpen = ref(false);
</script>

<style scoped lang="scss">
.admin-toolbar {
  padding: 4px 0 12px;
}
</style>

<i18n lang="yaml" locale="en">
search: 'Search'
refresh: 'Refresh'
filters: 'Filters'
count: '{count} entries'
</i18n>

<i18n lang="yaml" locale="de">
search: 'Suchen'
refresh: 'Aktualisieren'
filters: 'Filter'
count: '{count} Einträge'
</i18n>

<i18n lang="yaml" locale="fr">
search: 'Rechercher'
refresh: 'Actualiser'
filters: 'Filtres'
count: '{count} entrées'
</i18n>

<i18n lang="yaml" locale="pl">
search: 'Szukaj'
refresh: 'Odśwież'
filters: 'Filtry'
count: '{count} wpisów'
</i18n>

<i18n lang="yaml" locale="cs">
search: 'Hledat'
refresh: 'Obnovit'
filters: 'Filtry'
count: '{count} záznamů'
</i18n>
