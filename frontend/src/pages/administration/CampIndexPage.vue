<template>
  <page-state-handler :error>
    <q-table
      :title="t('title')"
      :loading
      :rows
      :columns
      :visible-columns="visibleColumns"
      row-key="name"
      class="absolute fit"
    >
      <template #top-right>
        <div class="row no-wrap q-gutter-x-lg">
          <!-- Search -->
          <q-input
            v-model="filterQuery"
            borderless
            rounded
            dense
            debounce="300"
            placeholder="Search"
          >
            <template #append>
              <q-icon name="search" />
            </template>
          </q-input>

          <q-select
            v-model="visibleColumns"
            :options="columns"
            :display-value="t('header.columns')"
            multiple
            emit-value
            map-options
            option-value="name"
            options-cover
            options-dense
            style="min-width: 150px"
            outlined
            rounded
            dense
          />

          <!-- TODO Add language filter -->
        </div>
      </template>

      <template #header-cell-action="columnProps">
        <q-th
          :auto-width="true"
          :props="columnProps"
        >
          {{ columnProps.col.label }}
        </q-th>
      </template>

      <template #body-cell-name="props">
        <q-td :props="props">
          {{ to(props.value) }}

          <!-- TODO show all names -->
        </q-td>
      </template>

      <template #body-cell-organizer="props">
        <q-td :props="props">
          {{ to(props.value) }}

          <!-- TODO show all organizers -->
        </q-td>
      </template>

      <template #body-cell-maxParticipants="props">
        <q-td :props="props">
          {{ to(props.value) }}

          <!-- TODO show all organizers -->
        </q-td>
      </template>

      <template #body-cell-active="props">
        <q-td :props="props">
          {{ props.value ? t('value.active') : t('value.inactive') }}
        </q-td>
      </template>

      <template #body-cell-public="props">
        <q-td :props="props">
          {{ props.value ? t('value.public') : t('value.private') }}
        </q-td>
      </template>

      <template #body-cell-startAt="props">
        <q-td :props="props">
          {{ formatDateTime(props.value) }}
        </q-td>
      </template>

      <template #body-cell-endAt="props">
        <q-td :props="props">
          {{ formatDateTime(props.value) }}
        </q-td>
      </template>

      <template #body-cell-action="props">
        <q-td :props="props">
          <div
            v-if="quasar.screen.gt.md"
            class="q-gt-md row no-wrap q-gutter-x-md justify-center"
          >
            <q-btn
              icon="app_registration"
              round
              flat
              size="sm"
              @click="showCampForm(props.row)"
            >
              <q-tooltip>{{ t('action.form') }}</q-tooltip>
            </q-btn>
            <q-btn
              icon="dashboard"
              round
              flat
              size="sm"
              @click="showCampResults(props.row)"
            >
              <q-tooltip>{{ t('action.results') }}</q-tooltip>
            </q-btn>
            <q-separator vertical />
            <q-btn
              v-if="!props.row.public"
              icon="publish"
              round
              flat
              size="sm"
              @click="onPublishCamp(props.row)"
            >
              <q-tooltip>{{ t('action.publish') }}</q-tooltip>
            </q-btn>
            <q-btn
              v-else
              icon="unpublished"
              color="warning"
              round
              flat
              size="sm"
              @click="onUnpublishCamp(props.row)"
            >
              <q-tooltip>{{ t('action.unpublish') }}</q-tooltip>
            </q-btn>
            <q-btn
              v-if="!props.row.active"
              icon="toggle_on"
              round
              flat
              size="sm"
              @click="onActivateCamp(props.row)"
            >
              <q-tooltip>{{ t('action.activate') }}</q-tooltip>
            </q-btn>
            <q-btn
              v-else
              icon="toggle_off"
              color="warning"
              round
              flat
              size="sm"
              @click="onDeactivateCamp(props.row)"
            >
              <q-tooltip>{{ t('action.deactivate') }}</q-tooltip>
            </q-btn>
            <q-separator vertical />
            <q-btn
              icon="edit"
              color="warning"
              round
              flat
              size="sm"
              @click="editCamp(props.row)"
            >
              <q-tooltip>{{ t('action.edit') }}</q-tooltip>
            </q-btn>
            <q-btn
              icon="delete"
              color="negative"
              round
              flat
              size="sm"
              @click="onDeleteCamp(props.row)"
            >
              <q-tooltip>{{ t('action.delete') }}</q-tooltip>
            </q-btn>
          </div>

          <!-- Small screen devices -->
          <q-btn
            v-else
            icon="more_vert"
            size="sm"
            round
            flat
          >
            <q-menu>
              <q-list style="min-width: 150px">
                <q-item
                  v-close-popup
                  clickable
                  @click="showCampForm(props.row)"
                >
                  <q-item-section>
                    {{ t('action.form') }}
                  </q-item-section>
                </q-item>
                <q-item
                  v-close-popup
                  clickable
                  @click="showCampResults(props.row)"
                >
                  <q-item-section>
                    {{ t('action.results') }}
                  </q-item-section>
                </q-item>
                <q-separator />
                <q-item
                  v-if="!props.row.publish"
                  v-close-popup
                  clickable
                  @click="onPublishCamp(props.row)"
                >
                  <q-item-section>
                    {{ t('action.publish') }}
                  </q-item-section>
                </q-item>
                <q-item
                  v-else
                  v-close-popup
                  clickable
                  @click="onUnpublishCamp(props.row)"
                >
                  <q-item-section>
                    {{ t('action.unpublish') }}
                  </q-item-section>
                </q-item>
                <q-item
                  v-if="!props.row.active"
                  v-close-popup
                  clickable
                  @click="onActivateCamp(props.row)"
                >
                  <q-item-section>
                    {{ t('action.activate') }}
                  </q-item-section>
                </q-item>
                <q-item
                  v-else
                  v-close-popup
                  clickable
                  @click="onDeactivateCamp(props.row)"
                >
                  <q-item-section>
                    {{ t('action.deactivate') }}
                  </q-item-section>
                </q-item>
                <q-separator />
                <q-item
                  v-close-popup
                  clickable
                  @click="editCamp(props.row)"
                >
                  <q-item-section>
                    {{ t('action.edit') }}
                  </q-item-section>
                </q-item>
                <q-item
                  v-close-popup
                  clickable
                  class="text-negative"
                  @click="onDeleteCamp(props.row)"
                >
                  <q-item-section>
                    {{ t('action.delete') }}
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </q-td>
      </template>
    </q-table>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { QTableColumn } from 'quasar';
import type { Camp, CampUpdateData } from '@camp-registration/common/entities';
import { useI18n } from 'vue-i18n';
import PageStateHandler from 'components/common/PageStateHandler.vue';
import { computed, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import SafeDeleteDialog from 'components/common/dialogs/SafeDeleteDialog.vue';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import { useRouter } from 'vue-router';
import { useAPIService } from 'src/services/APIService';
import { useServiceHandler } from 'src/composables/serviceHandler';

const { t, locale } = useI18n();
const { to } = useObjectTranslation();
const quasar = useQuasar();
const router = useRouter();

const filterQuery = ref<string>('');

onMounted(async () => {
  await fetchAll();
});

const rows = computed<Camp[]>(() => {
  if (!camps.value) {
    return [];
  }

  if (!filterQuery.value) {
    return camps.value;
  }

  return camps.value
    .map((camp) => {
      const names =
        typeof camp.name === 'string' ? [camp.name] : Object.values(camp.name);

      const namesScore = names.map((name) =>
        getMatchScore(name, filterQuery.value),
      );

      return {
        ...camp,
        score: Math.max(...namesScore),
      };
    })
    .filter((user) => user.score > 0)
    .sort((a, b) => b.score - a.score);
});

const columns: QTableColumn<Camp>[] = [
  {
    name: 'name',
    label: t('column.name'),
    field: 'name',
    align: 'left',
    sortable: true,
    required: true,
  },
  {
    name: 'organizer',
    label: t('column.organizer'),
    field: 'organizer',
    align: 'left',
    sortable: true,
  },
  {
    name: 'minAge',
    label: t('column.minAge'),
    field: 'minAge',
    align: 'center',
    sortable: true,
  },
  {
    name: 'maxAge',
    label: t('column.maxAge'),
    field: 'maxAge',
    align: 'center',
    sortable: true,
  },
  {
    name: 'maxParticipants',
    label: t('column.maxParticipants'),
    field: 'maxParticipants',
    align: 'center',
  },
  {
    name: 'startAt',
    label: t('column.end'),
    field: 'startAt',
    align: 'center',
    sortable: true,
  },
  {
    name: 'endAt',
    label: t('column.start'),
    field: 'endAt',
    align: 'center',
    sortable: true,
  },
  {
    name: 'price',
    label: t('column.price'),
    field: 'price',
    align: 'right',
    sortable: true,
  },
  {
    name: 'active',
    label: t('column.active'),
    field: 'active',
    align: 'left',
    sortable: true,
  },
  {
    name: 'public',
    label: t('column.public'),
    field: 'public',
    align: 'left',
    sortable: true,
  },
  {
    name: 'action',
    label: t('column.action'),
    field: 'id',
    align: 'center',
    required: true,
  },
];

const visibleColumns = ref(['name', 'organizer', 'active', 'public', 'action']);

function getMatchScore(text: string, query: string) {
  text = text.toLowerCase();
  query = query.toLowerCase();
  if (text.includes(query)) {
    return query.length / text.length;
  }

  return 0;
}

function formatDateTime(dateTime: string): string {
  // This could be done by the d function of i18m, but it does not seem to work
  return new Intl.DateTimeFormat(locale.value, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateTime));
}

function editCamp(camp: Camp) {
  const routeData = router.resolve({
    name: 'settings',
    params: {
      camp: camp.id,
    },
  });

  window.open(routeData.href, '_blank');
}

function showCampForm(camp: Camp) {
  const routeData = router.resolve({
    name: 'camp',
    params: {
      camp: camp.id,
    },
  });

  window.open(routeData.href, '_blank');
}

function showCampResults(camp: Camp) {
  const routeData = router.resolve({
    name: 'dashboard',
    params: {
      camp: camp.id,
    },
  });

  window.open(routeData.href, '_blank');
}

function onDeleteCamp(camp: Camp) {
  quasar
    .dialog({
      component: SafeDeleteDialog,
      componentProps: {
        title: t('dialog.delete.title'),
        message: t('dialog.delete.message'),
        value: to(camp.name),
        label: t('dialog.delete.label'),
      },
    })
    .onOk(() => {
      deleteCamp(camp.id);
    });
}

function onActivateCamp(camp: Camp) {
  quasar
    .dialog({
      title: t('dialog.activate.title'),
      message: t('dialog.activate.message', { name: to(camp.name) }),
      cancel: {
        label: t('dialog.activate.cancel'),
        color: 'primary',
        rounded: true,
        outline: true,
      },
      ok: {
        label: t('dialog.activate.ok'),
        color: 'primary',
        rounded: true,
      },
    })
    .onOk(() => {
      updateCamp(camp.id, {
        active: true,
      });
    });
}

function onDeactivateCamp(camp: Camp) {
  quasar
    .dialog({
      title: t('dialog.deactivate.title'),
      message: t('dialog.deactivate.message', { name: to(camp.name) }),
      cancel: {
        label: t('dialog.deactivate.cancel'),
        color: 'primary',
        rounded: true,
        outline: true,
      },
      ok: {
        label: t('dialog.deactivate.ok'),
        color: 'warning',
        rounded: true,
      },
    })
    .onOk(() => {
      updateCamp(camp.id, {
        active: false,
      });
    });
}

function onPublishCamp(camp: Camp) {
  quasar
    .dialog({
      title: t('dialog.publish.title'),
      message: t('dialog.publish.message', { name: to(camp.name) }),
      cancel: {
        label: t('dialog.publish.cancel'),
        color: 'primary',
        rounded: true,
        outline: true,
      },
      ok: {
        label: t('dialog.publish.ok'),
        color: 'warning',
        rounded: true,
      },
    })
    .onOk(() => {
      updateCamp(camp.id, {
        public: true,
      });
    });
}

function onUnpublishCamp(camp: Camp) {
  quasar
    .dialog({
      title: t('dialog.unpublish.title'),
      message: t('dialog.unpublish.message', { name: to(camp.name) }),
      cancel: {
        label: t('dialog.unpublish.cancel'),
        color: 'primary',
        rounded: true,
        outline: true,
      },
      ok: {
        label: t('dialog.unpublish.ok'),
        color: 'primary',
        rounded: true,
      },
    })
    .onOk(() => {
      updateCamp(camp.id, {
        public: false,
      });
    });
}

const api = useAPIService();

const {
  data: camps,
  error,
  isLoading: loading,
  forceFetch,
  withProgressNotification,
} = useServiceHandler<Camp[]>('camps');

async function fetchAll() {
  return forceFetch(() =>
    api.fetchCamps({
      showAll: true,
    }),
  );
}

async function updateCamp(id: string, data: CampUpdateData) {
  return withProgressNotification('update', () => api.updateCamp(id, data));
}

async function deleteCamp(id: string) {
  return withProgressNotification('delete', () => api.deleteCamp(id));
}
// TODO add translations
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
title: 'Camps'

action:
  activate: 'Activate'
  deactivate: 'Deactivate'
  delete: 'Delete'
  edit: 'Edit'
  form: 'Form'
  publish: 'Publish'
  results: 'Results'
  unpublish: 'Unpublish'

column:
  action: 'Action'
  active: 'Active'
  end: 'End'
  maxAge: 'Max Age'
  maxParticipants: 'Max Participants'
  minAge: 'Min Age'
  name: 'Name'
  organizer: 'Organizer'
  price: 'Price'
  public: 'Public'
  start: 'Start'

dialog:
  activate:
    title: 'Activate camp'
    message: 'Are you sure you want to open the registration for { name }?'
    ok: 'Activate'
    cancel: 'Cancel'
  deactivate:
    title: 'Deactivate camp'
    message: 'Are you sure you want to close the registration for { name }?'
    ok: 'Deactivate'
    cancel: 'Cancel'
  delete:
    title: 'Delete Camp'
    message: 'The camp will be permanently deleted.'
    label: 'Name'
  publish:
    title: 'Publish camp'
    message: 'Are you sure you want to publish { name }?'
    ok: 'Publish'
    cancel: 'Cancel'
  unpublish:
    title: 'Unpublish camp'
    message: 'Are you sure you want to unpublish { name }?'
    ok: 'Unpublish'
    cancel: 'Cancel'

header:
  columns: 'Columns'

value:
  active: 'Active'
  inactive: 'Inactive'
  public: 'Public'
  private: 'Private'
</i18n>
