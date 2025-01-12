<template>
  <page-state-handler :error>
    <q-table
      v-model:pagination="pagination"
      :title="t('title')"
      :loading
      :rows
      :columns
      :expanded
      :visible-columns="visibleColumns"
      :rows-per-page-options="[0]"
      virtual-scroll
      row-key="id"
      class="absolute fit"
    >
      <template #top-right>
        <div class="row no-wrap q-gutter-x-md">
          <!-- Search -->
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

          <q-select
            v-model="visibleColumns"
            :options="columnFilterOptions"
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

          <q-btn
            :icon="expanded.length > 0 ? 'unfold_less' : 'expand'"
            outline
            rounded
            @click="toggleExpandAll()"
          />
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

      <template #body-cell-expand="props">
        <q-td
          :props="props"
          auto-width
        >
          <q-btn
            v-if="props.row.countries.length > 1"
            :icon="props.expand ? 'expand_less' : 'expand_more'"
            color="primary"
            size="sm"
            round
            dense
            outline
            @click="toggleExpand(props.key)"
          />
        </q-td>
      </template>

      <template #body-cell-name="props">
        <translation-td :props="props" />
      </template>

      <template #body-cell-organizer="props">
        <translation-td :props="props" />
      </template>

      <template #body-cell-countries="props">
        <q-td :props="props">
          <div class="row q-gutter-x-sm justify-center content-center">
            <country-icon
              v-for="country in props.value"
              :key="country"
              :locale="country"
            />
          </div>
        </q-td>
      </template>

      <template #body-cell-maxParticipants="props">
        <translation-td :props="props" />
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
                  v-if="!props.row.public"
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
import { type QTableColumn } from 'quasar';
import type { Camp, CampUpdateData } from '@camp-registration/common/entities';
import { useI18n } from 'vue-i18n';
import PageStateHandler from 'components/common/PageStateHandler.vue';
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import SafeDeleteDialog from 'components/common/dialogs/SafeDeleteDialog.vue';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import { useRouter } from 'vue-router';
import { useAPIService } from 'src/services/APIService';
import { useServiceHandler } from 'src/composables/serviceHandler';
import TranslationTd from 'components/administration/camps/TranslationTd.vue';
import CountryIcon from 'components/common/localization/CountryIcon.vue';

const { t, locale } = useI18n();
const { to } = useObjectTranslation();
const quasar = useQuasar();
const router = useRouter();
const api = useAPIService();
const {
  data: camps,
  error,
  isLoading: loading,
  forceFetch,
  withProgressNotification,
} = useServiceHandler<Camp[]>('camp');

const filterQuery = ref<string>('');
const pagination = ref({
  rowsPerPage: 0,
});

fetchAll();

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
    name: 'expand',
    label: '',
    field: 'id',
    align: 'center',
    required: true,
  },
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
    name: 'countries',
    label: t('column.countries'),
    field: 'countries',
    align: 'center',
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

const columnFilterOptions = computed<QTableColumn<Camp>[]>(() => {
  return columns.filter((column) => !column.required);
});

const visibleColumns = ref([
  'name',
  'organizer',
  'countries',
  'active',
  'public',
  'action',
]);

const expanded = ref<string[]>([]);

function toggleExpandAll() {
  expanded.value =
    expanded.value.length === 0 ? rows.value.map((camp) => camp.id) : [];
}

function toggleExpand(id: string) {
  expanded.value = expanded.value.includes(id)
    ? expanded.value.filter((i) => i !== id)
    : [...expanded.value, id];
}

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
        message: t('dialog.delete.message', {
          name: to(camp.name),
          organizer: to(camp.organizer),
        }),
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

async function fetchAll() {
  return forceFetch(() =>
    api.fetchCamps({
      showAll: true,
    }),
  );
}

async function updateCamp(id: string, data: CampUpdateData) {
  const camp = await withProgressNotification('update', () =>
    api.updateCamp(id, data),
  );

  // Update data
  if (!camps.value) {
    return camp;
  }

  const index = camps.value.findIndex((c) => c.id === id);
  if (index === -1) {
    return camp;
  }

  camps.value.splice(index, 1, camp);
}

async function deleteCamp(id: string) {
  await withProgressNotification('delete', () => api.deleteCamp(id));

  // Update data
  if (!camps.value) {
    return;
  }

  const index = camps.value.findIndex((c) => c.id === id);
  if (index === -1) {
    return;
  }

  camps.value.splice(index, 1);
}
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
  countries: 'Countries'
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
    message: 'You are about to delete "{ name }" organized by "{ organizer }".
      All registrations and associated templates will be lost.
      This action is not reversible.
      Are you sure you want ot delete this camp?'
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

filter:
  search: 'Search'

header:
  columns: 'Columns'

value:
  active: 'Active'
  inactive: 'Inactive'
  public: 'Public'
  private: 'Private'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Camps'

action:
  activate: 'Aktivieren'
  deactivate: 'Deaktivieren'
  delete: 'Löschen'
  edit: 'Bearbeiten'
  form: 'Formular'
  publish: 'Veröffentlichen'
  results: 'Ergebnisse'
  unpublish: 'Veröffentlichung zurückziehen'

column:
  action: 'Aktion'
  active: 'Aktiv'
  countries: 'Länder'
  end: 'Ende'
  maxAge: 'Max. Alter'
  maxParticipants: 'Max. Teilnehmerzahl'
  minAge: 'Min. Alter'
  name: 'Name'
  organizer: 'Veranstalter'
  price: 'Preis'
  public: 'Öffentlich'
  start: 'Start'

dialog:
  activate:
    title: 'Camp aktivieren'
    message: 'Bist du sicher, dass du die Anmeldung für { name } öffnen möchtest?'
    ok: 'Aktivieren'
    cancel: 'Abbrechen'
  deactivate:
    title: 'Camp deaktivieren'
    message: 'Bist du sicher, dass du die Anmeldung für { name } schließen möchtest?'
    ok: 'Deaktivieren'
    cancel: 'Abbrechen'
  delete:
    title: 'Camp löschen'
    message:
      'Du bist dabei, "{ name }" organisiert von "{ organizer }" zu löschen.
      Alle Anmeldungen und zugehörigen Vorlagen gehen verloren.
      Diese Aktion kann nicht rückgängig gemacht werden.
      Bist du sicher, dass du dieses Camp löschen möchtest?'
    label: 'Name'
  publish:
    title: 'Camp veröffentlichen'
    message: 'Bist du sicher, dass du { name } veröffentlichen möchtest?'
    ok: 'Veröffentlichen'
    cancel: 'Abbrechen'
  unpublish:
    title: 'Camp zurückziehen'
    message: 'Bist du sicher, dass du { name } zurückziehen möchtest?'
    ok: 'Zurückziehen'
    cancel: 'Abbrechen'

filter:
  search: 'Suchen'

header:
  columns: 'Spalten'

value:
  active: 'Aktiv'
  inactive: 'Inaktiv'
  public: 'Öffentlich'
  private: 'Privat'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Camps'

action:
  activate: 'Activer'
  deactivate: 'Désactiver'
  delete: 'Supprimer'
  edit: 'Modifier'
  form: 'Formulaire'
  publish: 'Publier'
  results: 'Résultats'
  unpublish: 'Dépublier'

column:
  action: 'Action'
  active: 'Actif'
  countries: 'Pays'
  end: 'Fin'
  maxAge: 'Âge max'
  maxParticipants: 'Participants max'
  minAge: 'Âge min'
  name: 'Nom'
  organizer: 'Organisateur'
  price: 'Prix'
  public: 'Public'
  start: 'Début'

dialog:
  activate:
    title: 'Activer le camp'
    message: 'Es-tu sûr de vouloir ouvrir les inscriptions pour { name } ?'
    ok: 'Activer'
    cancel: 'Annuler'
  deactivate:
    title: 'Désactiver le camp'
    message: 'Es-tu sûr de vouloir fermer les inscriptions pour { name } ?'
    ok: 'Désactiver'
    cancel: 'Annuler'
  delete:
    title: 'Supprimer le camp'
    message:
      'Tu es sur le point de supprimer "{ name }" organisé par "{ organizer }".
      Toutes les inscriptions et les modèles associés seront perdus.
      Cette action est irréversible.
      Es-tu sûr de vouloir supprimer ce camp ?'
    label: 'Nom'
  publish:
    title: 'Publier le camp'
    message: 'Es-tu sûr de vouloir publier { name } ?'
    ok: 'Publier'
    cancel: 'Annuler'
  unpublish:
    title: 'Dépublier le camp'
    message: 'Es-tu sûr de vouloir dépublier { name } ?'
    ok: 'Dépublier'
    cancel: 'Annuler'

filter:
  search: 'Chercher'

header:
  columns: 'Colonnes'

value:
  active: 'Actif'
  inactive: 'Inactif'
  public: 'Public'
  private: 'Privé'
</i18n>
