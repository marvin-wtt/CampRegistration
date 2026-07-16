<template>
  <page-state-handler :error>
    <div class="admin-page column no-wrap fit">
      <admin-list-toolbar
        v-model:search="search"
        :title="t('title')"
        :total="total"
        :loading
        @refresh="reload"
      />

      <q-table
        ref="tableRef"
        v-model:pagination="pagination"
        :loading
        :rows
        :columns
        :sort-method="identitySort"
        :rows-per-page-options="[0]"
        virtual-scroll
        :virtual-scroll-item-size="48"
        :virtual-scroll-sticky-size-start="48"
        hide-bottom
        row-key="id"
        flat
        bordered
        binary-state-sort
        class="admin-table col rounded-borders"
        @virtual-scroll="onVirtualScroll"
      >
        <template #body-cell-action="props">
          <q-td
            :props="props"
            auto-width
          >
            <row-actions :actions="rowActionsFn(props.row)" />
          </q-td>
        </template>
      </q-table>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import type { QTableColumn } from 'quasar';
import type {
  Newsletter,
  NewsletterQuery,
} from '@camp-registration/common/entities';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import AdminListToolbar from '@/components/administration/AdminListToolbar.vue';
import RowActions, {
  type RowAction,
} from '@/components/administration/RowActions.vue';
import SafeDeleteDialog from '@/components/common/dialogs/SafeDeleteDialog.vue';
import { useAPIService } from '@/services/APIService';
import { useServerTable } from '@/composables/serverTable';
import { useRouter } from 'vue-router';

const { t, d } = useI18n();
const quasar = useQuasar();
const router = useRouter();
const api = useAPIService();

const {
  tableRef,
  rows,
  search,
  loading,
  error,
  total,
  pagination,
  onVirtualScroll,
  identitySort,
  reload,
  withProgressNotification,
} = useServerTable<Newsletter, NewsletterQuery>({
  storeName: 'newsletter',
  sortBy: 'createdAt',
  descending: true,
  fetch: (query) => api.fetchNewslettersPaginated(query),
  buildQuery: ({ cursor, limit, sortBy, sortType, search }) =>
    ({
      view: 'all',
      cursor,
      limit,
      sortBy,
      sortType,
      name: search || undefined,
    }) as NewsletterQuery,
});

const columns = computed<QTableColumn<Newsletter>[]>(() => [
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
    field: 'id',
    align: 'center',
    sortable: false,
  },
]);

function rowActionsFn(newsletter: Newsletter): RowAction[] {
  return [
    {
      key: 'manage',
      label: t('action.manage'),
      icon: 'open_in_new',
      handler: () => showNewsletterManagement(newsletter),
    },
    {
      key: 'delete',
      label: t('action.delete'),
      icon: 'delete',
      color: 'negative',
      separatorBefore: true,
      handler: () => showDeleteDialog(newsletter),
    },
  ];
}

function showNewsletterManagement(newsletter: Newsletter) {
  const routeData = router.resolve({
    name: 'management.newsletter',
    params: {
      newsletterId: newsletter.id,
    },
  });

  window.open(routeData.href, '_blank');
}

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
      ).then(() => reload());
    });
}
</script>

<style scoped lang="scss">
.admin-page {
  position: absolute;
  inset: 0;
  padding: 16px;
}

.admin-table {
  // Let the table fill the remaining height and scroll internally instead of
  // growing the page (min-height:0 lets the flex child shrink below content).
  min-height: 0;
  background: var(--md3-surface);

  :deep(thead tr th) {
    position: sticky;
    top: 0;
    z-index: 1;
    background: var(--md3-surface-container-low);
  }
}
</style>

<i18n lang="yaml" locale="en">
title: 'Newsletters'
action:
  manage: 'Manage'
  delete: 'Delete'
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
action:
  manage: 'Verwalten'
  delete: 'Löschen'
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
action:
  manage: 'Gérer'
  delete: 'Supprimer'
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
action:
  manage: 'Zarządzaj'
  delete: 'Usuń'
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
action:
  manage: 'Spravovat'
  delete: 'Smazat'
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
