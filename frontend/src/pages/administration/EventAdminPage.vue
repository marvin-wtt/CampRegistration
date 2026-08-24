<template>
  <page-state-handler :error>
    <div class="admin-page column no-wrap fit">
      <admin-list-toolbar
        v-model:search="search"
        :title="t('title')"
        :total="total"
        :loading
        @refresh="reload"
      >
        <template #filters>
          <div class="col-6 col-sm-auto">
            <q-select
              v-model="statusFilter"
              :options="statusOptions"
              :label="t('column.registrationStatus')"
              dense
              outlined
              rounded
              clearable
              emit-value
              map-options
              options-dense
              style="min-width: 140px"
            />
          </div>
          <div class="col-6 col-sm-auto">
            <q-select
              v-model="listedFilter"
              :options="listedOptions"
              :label="t('column.listed')"
              dense
              outlined
              rounded
              clearable
              emit-value
              map-options
              options-dense
              style="min-width: 130px"
            />
          </div>
          <div class="col-auto">
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
              outlined
              rounded
              dense
              style="min-width: 130px"
            />
          </div>
        </template>
      </admin-list-toolbar>

      <q-table
        ref="tableRef"
        v-model:pagination="pagination"
        :loading
        :rows
        :columns
        :visible-columns="visibleColumns"
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
        <template #body-cell-name="props">
          <translation-td :props="props" />
        </template>

        <template #body-cell-organizer="props">
          <translation-td :props="props" />
        </template>

        <template #body-cell-countries="props">
          <q-td :props="props">
            <div class="row q-gutter-x-sm justify-center content-center">
              <div
                v-for="country in props.value"
                :key="country"
              >
                <country-icon
                  :locale="country"
                  size="sm"
                />
              </div>
            </div>
          </q-td>
        </template>

        <template #body-cell-maxParticipants="props">
          <translation-td :props="props" />
        </template>

        <template #body-cell-registrationStatus="props">
          <q-td :props="props">
            <q-chip
              :color="statusColor(props.row.registrationStatus)"
              text-color="white"
              dense
              square
              class="q-ml-none"
            >
              {{ t(`value.${props.row.registrationStatus}`) }}
            </q-chip>
          </q-td>
        </template>

        <template #body-cell-listed="props">
          <q-td :props="props">
            <q-chip
              :color="props.value ? 'positive' : 'grey-7'"
              text-color="white"
              dense
              square
              class="q-ml-none"
            >
              {{ props.value ? t('value.listed') : t('value.unlisted') }}
            </q-chip>
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
import { type QTableColumn } from 'quasar';
import type {
  Event,
  EventUpdateData,
  EventQuery,
  EventRegistrationStatus,
} from '@camp-registration/common/entities';
import { useI18n } from 'vue-i18n';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import AdminListToolbar from '@/components/administration/AdminListToolbar.vue';
import RowActions, {
  type RowAction,
} from '@/components/administration/RowActions.vue';
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import SafeDeleteDialog from '@/components/common/dialogs/SafeDeleteDialog.vue';
import MoveOrganizationDialog from '@/components/organization/MoveOrganizationDialog.vue';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { useRouter } from 'vue-router';
import { useAPIService } from '@/services/APIService';
import { useServerTable } from '@/composables/serverTable';
import TranslationTd from '@/components/administration/events/TranslationTd.vue';
import CountryIcon from '@/components/common/localization/CountryIcon.vue';
import { useRouteQueryParams } from '@/composables/useRouteQueryParams';

const { t, locale } = useI18n();
const { to } = useObjectTranslation();
const quasar = useQuasar();
const router = useRouter();
const routeQuery = useRouteQueryParams();
const api = useAPIService();

const statusFilter = ref<EventRegistrationStatus | null>(
  routeQuery.getEnumQueryParam<EventRegistrationStatus>('status', [
    'open',
    'upcoming',
    'closed',
  ]),
);
const listedFilter = ref<boolean | null>(
  routeQuery.getBooleanQueryParam('listed'),
);

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
} = useServerTable<Event, EventQuery>({
  storeName: 'event',
  sortBy: 'startAt',
  descending: true,
  watchSources: [statusFilter, listedFilter],
  fetch: (query) => api.fetchEventsPaginated(query),
  buildQuery: ({ cursor, limit, sortBy, sortType, search }) =>
    ({
      view: 'all',
      cursor,
      limit,
      sortBy,
      sortType,
      name: search || undefined,
      status: statusFilter.value ?? undefined,
      listed: listedFilter.value ?? undefined,
    }) as EventQuery,
});

const statusOptions = computed(() => [
  { label: t('value.open'), value: 'open' },
  { label: t('value.upcoming'), value: 'upcoming' },
  { label: t('value.closed'), value: 'closed' },
]);

const listedOptions = computed(() => [
  { label: t('value.listed'), value: true },
  { label: t('value.unlisted'), value: false },
]);

const columns = computed<QTableColumn<Event>[]>(() => [
  {
    name: 'name',
    label: t('column.name'),
    field: 'name',
    align: 'left',
    required: true,
  },
  {
    name: 'organization',
    label: t('column.organization'),
    field: 'organizationName',
    align: 'left',
  },
  {
    name: 'organizer',
    label: t('column.organizer'),
    field: 'organizer',
    align: 'left',
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
    label: t('column.start'),
    field: 'startAt',
    align: 'center',
    sortable: true,
  },
  {
    name: 'endAt',
    label: t('column.end'),
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
    name: 'registrationStatus',
    label: t('column.registrationStatus'),
    field: 'registrationStatus',
    align: 'left',
  },
  {
    name: 'listed',
    label: t('column.listed'),
    field: 'listed',
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
]);

const columnFilterOptions = computed<QTableColumn<Event>[]>(() => {
  return columns.value.filter((column) => !column.required);
});

const visibleColumns = ref([
  'name',
  'organizer',
  'organization',
  'countries',
  'startAt',
  'registrationStatus',
  'listed',
  'action',
]);

function rowActionsFn(event: Event): RowAction[] {
  const status = event.registrationStatus;

  return [
    {
      key: 'form',
      label: t('action.form'),
      icon: 'app_registration',
      handler: () => showEventForm(event),
    },
    {
      key: 'results',
      label: t('action.results'),
      icon: 'open_in_new',
      handler: () => showEventResults(event),
    },
    event.listed
      ? {
          key: 'unpublish',
          label: t('action.unpublish'),
          icon: 'unpublished',
          color: 'warning',
          separatorBefore: true,
          handler: () => onUnpublishEvent(event),
        }
      : {
          key: 'publish',
          label: t('action.publish'),
          icon: 'publish',
          separatorBefore: true,
          handler: () => onPublishEvent(event),
        },
    status === 'open'
      ? {
          key: 'deactivate',
          label: t('action.deactivate'),
          icon: 'toggle_off',
          color: 'warning',
          handler: () => onDeactivateEvent(event),
        }
      : {
          key: 'activate',
          label: t('action.activate'),
          icon: 'toggle_on',
          handler: () => onActivateEvent(event),
        },
    {
      key: 'move',
      label: t('action.move'),
      icon: 'drive_file_move',
      separatorBefore: true,
      handler: () => onMoveEvent(event),
    },
    {
      key: 'delete',
      label: t('action.delete'),
      icon: 'delete',
      color: 'negative',
      handler: () => onDeleteEvent(event),
    },
  ];
}

/**
 * Reassigning ownership is administrator-only: it hands the target
 * organization's admins event permissions, so it is not self-serve.
 */
function onMoveEvent(event: Event) {
  quasar
    .dialog({
      component: MoveOrganizationDialog,
      componentProps: {
        name: to(event.name),
        organizationId: event.organizationId,
        // Moving does not rewrite `listed`. Visibility is derived from the
        // owner's moderation status on read, so a published event drops out of
        // the directory while the new owner is unverified, and returns once it
        // is verified — only then is there anything to warn about.
        unverifiedWarning: event.listed
          ? t('dialog.move.hiddenWarning')
          : undefined,
      },
    })
    .onOk((organizationId: string) => {
      void withProgressNotification('move', async () => {
        await api.moveEventToOrganization(event.id, organizationId);
        reload();
      });
    });
}

function statusColor(status: EventRegistrationStatus): string {
  switch (status) {
    case 'open':
      return 'positive';
    case 'upcoming':
      return 'info';
    case 'closed':
      return 'grey-7';
  }
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

function showEventForm(event: Event) {
  const routeData = router.resolve({
    name: 'event',
    params: {
      eventId: event.id,
    },
  });

  window.open(routeData.href, '_blank');
}

function showEventResults(event: Event) {
  const routeData = router.resolve({
    name: 'management.event',
    params: {
      eventId: event.id,
    },
  });

  window.open(routeData.href, '_blank');
}

function onDeleteEvent(event: Event) {
  quasar
    .dialog({
      component: SafeDeleteDialog,
      componentProps: {
        title: t('dialog.delete.title'),
        message: t('dialog.delete.message', {
          name: to(event.name),
          organizer: to(event.organizer),
        }),
        value: to(event.name),
        label: t('dialog.delete.label'),
      },
    })
    .onOk(() => {
      void deleteEvent(event.id);
    });
}

function onActivateEvent(event: Event) {
  quasar
    .dialog({
      title: t('dialog.activate.title'),
      message: t('dialog.activate.message', { name: to(event.name) }),
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
      void updateEvent(event.id, {
        registrationOpensAt: new Date().toISOString(),
        registrationClosesAt: null,
      });
    });
}

function onDeactivateEvent(event: Event) {
  quasar
    .dialog({
      title: t('dialog.deactivate.title'),
      message: t('dialog.deactivate.message', { name: to(event.name) }),
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
      void updateEvent(event.id, {
        registrationClosesAt: new Date().toISOString(),
      });
    });
}

function onPublishEvent(event: Event) {
  quasar
    .dialog({
      title: t('dialog.publish.title'),
      message: t('dialog.publish.message', { name: to(event.name) }),
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
      void updateEvent(event.id, {
        listed: true,
      });
    });
}

function onUnpublishEvent(event: Event) {
  quasar
    .dialog({
      title: t('dialog.unpublish.title'),
      message: t('dialog.unpublish.message', { name: to(event.name) }),
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
      void updateEvent(event.id, {
        listed: false,
      });
    });
}

async function updateEvent(id: string, data: EventUpdateData) {
  await withProgressNotification('update', () => api.updateEvent(id, data));
  reload();
}

async function deleteEvent(id: string) {
  await withProgressNotification('delete', () => api.deleteEvent(id));
  reload();
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
title: 'Events'

action:
  activate: 'Activate'
  deactivate: 'Deactivate'
  move: 'Move to organization'
  delete: 'Delete'
  form: 'Form'
  publish: 'Publish'
  results: 'Results'
  unpublish: 'Unpublish'

column:
  action: 'Action'
  registrationStatus: 'Registration'
  countries: 'Countries'
  end: 'End'
  maxAge: 'Max Age'
  maxParticipants: 'Max Participants'
  minAge: 'Min Age'
  name: 'Name'
  organization: 'Organization'
  organizer: 'Organizer'
  price: 'Price'
  listed: 'Listed'
  start: 'Start'

dialog:
  activate:
    title: 'Activate event'
    message: 'Are you sure you want to open the registration for { name }?'
    ok: 'Activate'
    cancel: 'Cancel'
  deactivate:
    title: 'Deactivate event'
    message: 'Are you sure you want to close the registration for { name }?'
    ok: 'Deactivate'
    cancel: 'Cancel'
  delete:
    title: 'Delete Event'
    message: 'You are about to delete "{ name }" organized by "{ organizer }".
      All registrations and associated templates will be lost.
      This action is not reversible.
      Are you sure you want ot delete this event?'
    label: 'Name'
  move:
    hiddenWarning: 'This organization is not verified, so the event will be hidden from the public directory and stop accepting registrations until it is. It stays published and reappears once the organization is verified.'
  publish:
    title: 'Publish event'
    message: 'Are you sure you want to publish { name }?'
    ok: 'Publish'
    cancel: 'Cancel'
  unpublish:
    title: 'Unpublish event'
    message: 'Are you sure you want to unpublish { name }?'
    ok: 'Unpublish'
    cancel: 'Cancel'

header:
  columns: 'Columns'

value:
  open: 'Open'
  upcoming: 'Upcoming'
  closed: 'Closed'
  listed: 'Listed'
  unlisted: 'Unlisted'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Veranstaltungen'

action:
  activate: 'Aktivieren'
  deactivate: 'Deaktivieren'
  move: 'In Organisation verschieben'
  delete: 'Löschen'
  form: 'Formular'
  publish: 'Veröffentlichen'
  results: 'Ergebnisse'
  unpublish: 'Veröffentlichung zurückziehen'

column:
  action: 'Aktion'
  registrationStatus: 'Anmeldung'
  countries: 'Länder'
  end: 'Ende'
  maxAge: 'Max. Alter'
  maxParticipants: 'Max. Teilnehmerzahl'
  minAge: 'Min. Alter'
  name: 'Name'
  organization: 'Organisation'
  organizer: 'Veranstalter'
  price: 'Preis'
  listed: 'Gelistet'
  start: 'Start'

dialog:
  activate:
    title: 'Veranstaltung aktivieren'
    message: 'Bist du sicher, dass du die Anmeldung für { name } öffnen möchtest?'
    ok: 'Aktivieren'
    cancel: 'Abbrechen'
  deactivate:
    title: 'Veranstaltung deaktivieren'
    message: 'Bist du sicher, dass du die Anmeldung für { name } schließen möchtest?'
    ok: 'Deaktivieren'
    cancel: 'Abbrechen'
  delete:
    title: 'Veranstaltung löschen'
    message:
      'Du bist dabei, "{ name }" organisiert von "{ organizer }" zu löschen.
      Alle Anmeldungen und zugehörigen Vorlagen gehen verloren.
      Diese Aktion kann nicht rückgängig gemacht werden.
      Bist du sicher, dass du diese Veranstaltung löschen möchtest?'
    label: 'Name'
  move:
    hiddenWarning: 'Diese Organisation ist nicht verifiziert. Die Veranstaltung wird bis dahin nicht mehr öffentlich angezeigt und nimmt keine Anmeldungen an. Es bleibt veröffentlicht und erscheint nach der Verifizierung wieder.'
  publish:
    title: 'Veranstaltung veröffentlichen'
    message: 'Bist du sicher, dass du { name } veröffentlichen möchtest?'
    ok: 'Veröffentlichen'
    cancel: 'Abbrechen'
  unpublish:
    title: 'Veranstaltung zurückziehen'
    message: 'Bist du sicher, dass du { name } zurückziehen möchtest?'
    ok: 'Zurückziehen'
    cancel: 'Abbrechen'

header:
  columns: 'Spalten'

value:
  open: 'Offen'
  upcoming: 'Bevorstehend'
  closed: 'Geschlossen'
  listed: 'Gelistet'
  unlisted: 'Nicht gelistet'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Événements'

action:
  activate: 'Activer'
  deactivate: 'Désactiver'
  move: 'Déplacer vers une organisation'
  delete: 'Supprimer'
  form: 'Formulaire'
  publish: 'Publier'
  results: 'Résultats'
  unpublish: 'Dépublier'

column:
  action: 'Action'
  registrationStatus: 'Inscription'
  countries: 'Pays'
  end: 'Fin'
  maxAge: 'Âge max'
  maxParticipants: 'Participants max'
  minAge: 'Âge min'
  name: 'Nom'
  organization: 'Organisation'
  organizer: 'Organisateur'
  price: 'Prix'
  listed: 'Répertorié'
  start: 'Début'

dialog:
  activate:
    title: "Activer l'événement"

    message: 'Es-tu sûr de vouloir ouvrir les inscriptions pour { name } ?'
    ok: 'Activer'
    cancel: 'Annuler'
  deactivate:
    title: "Désactiver l'événement"

    message: 'Es-tu sûr de vouloir fermer les inscriptions pour { name } ?'
    ok: 'Désactiver'
    cancel: 'Annuler'
  delete:
    title: "Supprimer l'événement"

    message:
      'Tu es sur le point de supprimer "{ name }" organisé par "{ organizer }".
      Toutes les inscriptions et les modèles associés seront perdus.
      Cette action est irréversible.
      Es-tu sûr de vouloir supprimer cet événement ?'
    label: 'Nom'
  move:
    hiddenWarning: "Cette organisation n'est pas vérifiée : l'événement sera masqué de l'annuaire public et cessera d'accepter les inscriptions. Il reste publié et réapparaîtra après la vérification."
  publish:
    title: "Publier l'événement"

    message: 'Es-tu sûr de vouloir publier { name } ?'
    ok: 'Publier'
    cancel: 'Annuler'
  unpublish:
    title: "Dépublier l'événement"

    message: 'Es-tu sûr de vouloir dépublier { name } ?'
    ok: 'Dépublier'
    cancel: 'Annuler'

header:
  columns: 'Colonnes'

value:
  open: 'Ouvert'
  upcoming: 'À venir'
  closed: 'Fermé'
  listed: 'Répertorié'
  unlisted: 'Non répertorié'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Wydarzenia'

action:
  activate: 'Aktywuj'
  deactivate: 'Dezaktywuj'
  move: 'Przenieś do organizacji'
  delete: 'Usuń'
  form: 'Formularz'
  publish: 'Opublikuj'
  results: 'Wyniki'
  unpublish: 'Cofnij publikację'

column:
  action: 'Akcja'
  registrationStatus: 'Rejestracja'
  countries: 'Kraje'
  end: 'Koniec'
  maxAge: 'Maks. wiek'
  maxParticipants: 'Maks. uczestników'
  minAge: 'Min. wiek'
  name: 'Nazwa'
  organization: 'Organizacja'
  organizer: 'Organizator'
  price: 'Cena'
  listed: 'Widoczny'
  start: 'Start'

dialog:
  activate:
    title: 'Aktywuj wydarzenie'
    message: 'Czy na pewno chcesz otworzyć rejestrację dla { name }?'
    ok: 'Aktywuj'
    cancel: 'Anuluj'
  deactivate:
    title: 'Dezaktywuj wydarzenie'
    message: 'Czy na pewno chcesz zamknąć rejestrację dla { name }?'
    ok: 'Dezaktywuj'
    cancel: 'Anuluj'
  delete:
    title: 'Usuń wydarzenie'
    message: 'Zamierzasz usunąć "{ name }" zorganizowany przez "{ organizer }".
      Wszystkie zgłoszenia i powiązane szablony zostaną utracone.
      Ta akcja jest nieodwracalna.
      Czy na pewno chcesz usunąć to wydarzenie?'
    label: 'Nazwa'
  move:
    hiddenWarning: 'Ta organizacja nie jest zweryfikowana, więc wydarzenie zostanie ukryty w publicznym katalogu i przestanie przyjmować zapisy. Pozostaje opublikowany i wróci po weryfikacji.'
  publish:
    title: 'Opublikuj wydarzenie'
    message: 'Czy na pewno chcesz opublikować { name }?'
    ok: 'Opublikuj'
    cancel: 'Anuluj'
  unpublish:
    title: 'Cofnij publikację wydarzenia'
    message: 'Czy na pewno chcesz cofnąć publikację { name }?'
    ok: 'Cofnij'
    cancel: 'Anuluj'

header:
  columns: 'Kolumny'

value:
  open: 'Otwarta'
  upcoming: 'Nadchodząca'
  closed: 'Zamknięta'
  listed: 'Widoczny'
  unlisted: 'Ukryty'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Akce'

action:
  activate: 'Aktivovat'
  deactivate: 'Deaktivovat'
  move: 'Přesunout do organizace'
  delete: 'Smazat'
  form: 'Formulář'
  publish: 'Zveřejnit'
  results: 'Výsledky'
  unpublish: 'Zrušit zveřejnění'

column:
  action: 'Akce'
  registrationStatus: 'Registrace'
  countries: 'Země'
  end: 'Konec'
  maxAge: 'Max. věk'
  maxParticipants: 'Max. účastníků'
  minAge: 'Min. věk'
  name: 'Název'
  organization: 'Organizace'
  organizer: 'Organizátor'
  price: 'Cena'
  listed: 'Zobrazený'
  start: 'Start'

dialog:
  activate:
    title: 'Aktivovat akci'
    message: 'Opravdu chcete otevřít registraci pro { name }?'
    ok: 'Aktivovat'
    cancel: 'Zrušit'
  deactivate:
    title: 'Deaktivovat akci'
    message: 'Opravdu chcete uzavřít registraci pro { name }?'
    ok: 'Deaktivovat'
    cancel: 'Zrušit'
  delete:
    title: 'Smazat akci'
    message: 'Chystáte se smazat "{ name }" organizovaný "{ organizer }".
      Všechny přihlášky a přidružené šablony budou ztraceny.
      Tato akce je nevratná.
      Opravdu chcete tuto akci smazat?'
    label: 'Název'
  move:
    hiddenWarning: 'Tato organizace není ověřená, takže akce bude skryta z veřejného katalogu a přestane přijímat registrace. Zůstává zveřejněna a vrátí se po ověření.'
  publish:
    title: 'Zveřejnit akci'
    message: 'Opravdu chcete zveřejnit { name }?'
    ok: 'Zveřejnit'
    cancel: 'Zrušit'
  unpublish:
    title: 'Zrušit zveřejnění akce'
    message: 'Opravdu chcete zrušit zveřejnění { name }?'
    ok: 'Zrušit'
    cancel: 'Zrušit'

header:
  columns: 'Sloupce'

value:
  open: 'Otevřená'
  upcoming: 'Nadcházející'
  closed: 'Uzavřená'
  listed: 'Zobrazený'
  unlisted: 'Skrytý'
</i18n>
