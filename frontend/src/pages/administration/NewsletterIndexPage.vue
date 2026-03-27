<template>
  <page-state-handler :error>
    <q-table
      :title="t('title')"
      :loading
      :rows
      :columns
      :rows-per-page-options="[0]"
      virtual-scroll
      row-key="id"
      class="absolute fit"
    >
      <template #top-right>
        <q-input
          v-model="filterQuery"
          :placeholder="t('filter.search')"
          debounce="300"
          rounded
          dense
          outlined
        >
          <template #append>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>

      <template #body-cell-action="props">
        <q-td :props="props">
          <q-btn
            flat
            round
            icon="delete"
            color="negative"
            size="sm"
            @click="showDeleteDialog(props.row)"
          />
        </q-td>
      </template>
    </q-table>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import type { QTableColumn } from 'quasar';
import type { Newsletter } from '@camp-registration/common/entities';
import PageStateHandler from 'components/common/PageStateHandler.vue';
import SafeDeleteDialog from 'components/common/dialogs/SafeDeleteDialog.vue';
import { useAPIService } from 'src/services/APIService';
import { useServiceHandler } from 'src/composables/serviceHandler';

const { t, d } = useI18n();
const quasar = useQuasar();
const api = useAPIService();

const {
  data: newsletters,
  error,
  isLoading: loading,
  forceFetch,
  withProgressNotification,
} = useServiceHandler<Newsletter[]>('newsletter');

onMounted(async () => {
  await forceFetch(() => api.fetchNewsletters({ showAll: true }));
});

const filterQuery = ref<string>('');

const rows = computed<Newsletter[]>(() => {
  if (!newsletters.value) {
    return [];
  }
  if (!filterQuery.value) {
    return newsletters.value;
  }
  const query = filterQuery.value.toLowerCase();
  return newsletters.value.filter(
    (n) =>
      n.name.toLowerCase().includes(query) ||
      (n.description ?? '').toLowerCase().includes(query),
  );
});

const columns = computed<QTableColumn[]>(() => [
  {
    name: 'name',
    label: t('column.name'),
    field: 'name',
    align: 'left',
    sortable: true,
  },
  {
    name: 'description',
    label: t('column.description'),
    field: 'description',
    align: 'left',
    sortable: false,
    format: (val: string | null) => val ?? '-',
  },
  {
    name: 'createdAt',
    label: t('column.createdAt'),
    field: 'createdAt',
    align: 'left',
    sortable: true,
    format: (val: string) => d(new Date(val), 'short'),
  },
  {
    name: 'action',
    label: t('column.action'),
    field: 'action',
    align: 'center',
    sortable: false,
  },
]);

function showDeleteDialog(newsletter: Newsletter) {
  quasar
    .dialog({
      component: SafeDeleteDialog,
      componentProps: {
        title: t('dialog.delete.title'),
        message: t('dialog.delete.message'),
        label: t('dialog.delete.label'),
        value: newsletter.name,
      },
    })
    .onOk(() => {
      void withProgressNotification('delete', () =>
        api.deleteNewsletter(newsletter.id),
      ).then(() => forceFetch(() => api.fetchNewsletters({ showAll: true })));
    });
}
</script>

<i18n lang="yaml" locale="en">
title: 'Newsletters'
filter:
  search: 'Search'
column:
  name: 'Name'
  description: 'Description'
  createdAt: 'Created'
  action: 'Actions'
dialog:
  delete:
    title: 'Delete Newsletter'
    message: 'Are you sure you want to delete this newsletter? All subscribers will be removed.'
    label: 'Newsletter Name'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Newsletter'
filter:
  search: 'Suchen'
column:
  name: 'Name'
  description: 'Beschreibung'
  createdAt: 'Erstellt'
  action: 'Aktionen'
dialog:
  delete:
    title: 'Newsletter löschen'
    message: 'Möchten Sie diesen Newsletter wirklich löschen? Alle Abonnenten werden entfernt.'
    label: 'Newsletter-Name'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Newsletters'
filter:
  search: 'Rechercher'
column:
  name: 'Nom'
  description: 'Description'
  createdAt: 'Créé le'
  action: 'Actions'
dialog:
  delete:
    title: 'Supprimer la newsletter'
    message: 'Voulez-vous vraiment supprimer cette newsletter ? Tous les abonnés seront supprimés.'
    label: 'Nom de la newsletter'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Newslettery'
filter:
  search: 'Szukaj'
column:
  name: 'Nazwa'
  description: 'Opis'
  createdAt: 'Utworzono'
  action: 'Akcje'
dialog:
  delete:
    title: 'Usuń newsletter'
    message: 'Czy na pewno chcesz usunąć ten newsletter? Wszyscy subskrybenci zostaną usunięci.'
    label: 'Nazwa newslettera'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Newslettery'
filter:
  search: 'Hledat'
column:
  name: 'Název'
  description: 'Popis'
  createdAt: 'Vytvořeno'
  action: 'Akce'
dialog:
  delete:
    title: 'Smazat newsletter'
    message: 'Opravdu chcete smazat tento newsletter? Všichni odběratelé budou odstraněni.'
    label: 'Název newsletteru'
</i18n>
