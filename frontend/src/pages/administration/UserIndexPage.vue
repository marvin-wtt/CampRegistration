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
              v-model="roleFilter"
              :options="roleOptions"
              :label="t('column.role')"
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
          <div class="col-6 col-sm-auto">
            <q-select
              v-model="statusFilter"
              :options="statusOptions"
              :label="t('column.status')"
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
        </template>

        <template #actions>
          <m-btn
            :label="quasar.screen.gt.xs ? t('header.create') : undefined"
            :round="!quasar.screen.gt.xs"
            icon="add"
            color="primary"
            @click="onAddUser()"
          />
        </template>
      </admin-list-toolbar>

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
        <template #body-cell-email="props">
          <q-td :props="props">
            <a
              :href="'mailto:' + props.value"
              class="email-link"
            >
              {{ props.value }}
            </a>
          </q-td>
        </template>

        <template #body-cell-role="props">
          <q-td :props="props">
            <q-chip
              :color="props.value === 'ADMIN' ? 'primary' : 'grey-4'"
              :text-color="props.value === 'ADMIN' ? 'white' : 'grey-9'"
              dense
              square
              class="q-ml-none"
            >
              {{ props.value }}
            </q-chip>
          </q-td>
        </template>

        <template #body-cell-status="props">
          <q-td :props="props">
            <q-chip
              :color="statusColor(props.row)"
              text-color="white"
              dense
              square
              class="q-ml-none"
            >
              {{ getUserStatus(props.row) }}
            </q-chip>
          </q-td>
        </template>

        <template #body-cell-lastSeen="props">
          <q-td :props="props">
            {{
              props.value ? formatDateTime(props.value) : t('lastSeen.never')
            }}
          </q-td>
        </template>

        <template #body-cell-createdAt="props">
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
  User,
  UserUpdateData,
  UserCreateData,
  UserQuery,
  UserStatus,
} from '@camp-registration/common/entities';
import { useI18n } from 'vue-i18n';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import AdminListToolbar from '@/components/administration/AdminListToolbar.vue';
import RowActions, {
  type RowAction,
} from '@/components/administration/RowActions.vue';
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import SafeDeleteDialog from '@/components/common/dialogs/SafeDeleteDialog.vue';
import UserCreateDialog from '@/components/administration/users/UserCreateDialog.vue';
import UserUpdateDialog from '@/components/administration/users/UserUpdateDialog.vue';
import { useAPIService } from '@/services/APIService';
import { useServerTable } from '@/composables/serverTable';

const { t, locale } = useI18n();
const quasar = useQuasar();
const api = useAPIService();

const roleFilter = ref<User['role'] | null>(null);
const statusFilter = ref<UserStatus | null>(null);

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
} = useServerTable<User, UserQuery>({
  storeName: 'user',
  sortBy: 'lastSeen',
  descending: true,
  watchSources: [roleFilter, statusFilter],
  fetch: (query) => api.fetchUsersPaginated(query),
  buildQuery: ({ cursor, limit, sortBy, sortType, search }) =>
    ({
      cursor,
      limit,
      sortBy,
      sortType,
      search: search || undefined,
      role: roleFilter.value ?? undefined,
      status: statusFilter.value ?? undefined,
    }) as UserQuery,
});

const roleOptions = [
  { label: 'ADMIN', value: 'ADMIN' },
  { label: 'USER', value: 'USER' },
];

const statusOptions = computed(() => [
  { label: t('status.active'), value: 'active' },
  { label: t('status.locked'), value: 'locked' },
  { label: t('status.unverified'), value: 'unverified' },
]);

const columns = computed<QTableColumn<User>[]>(() => [
  {
    name: 'name',
    label: t('column.name'),
    field: 'name',
    align: 'left',
    sortable: true,
  },
  {
    name: 'email',
    label: t('column.email'),
    field: 'email',
    align: 'left',
    sortable: true,
  },
  {
    name: 'role',
    label: t('column.role'),
    field: 'role',
    align: 'left',
    sortable: true,
  },
  {
    name: 'status',
    label: t('column.status'),
    field: 'locked',
    align: 'left',
  },
  {
    name: 'lastSeen',
    label: t('column.lastSeen'),
    field: 'lastSeen',
    align: 'left',
    sortable: true,
  },
  {
    name: 'createdAt',
    label: t('column.createdAt'),
    field: 'createdAt',
    align: 'left',
    sortable: true,
  },
  {
    name: 'action',
    label: t('column.action'),
    field: 'id',
    align: 'center',
  },
]);

function rowActionsFn(user: User): RowAction[] {
  return [
    user.locked
      ? {
          key: 'unlock',
          label: t('action.unlock'),
          icon: 'lock_open',
          handler: () => onUnlockUser(user),
        }
      : {
          key: 'lock',
          label: t('action.lock'),
          icon: 'lock',
          handler: () => onLockUser(user),
        },
    {
      key: 'edit',
      label: t('action.edit'),
      icon: 'edit',
      handler: () => onEditUser(user),
    },
    {
      key: 'delete',
      label: t('action.delete'),
      icon: 'delete',
      color: 'negative',
      separatorBefore: true,
      handler: () => onDeleteUser(user),
    },
  ];
}

function getUserStatus(user: User): string {
  if (user.locked) {
    return t('status.locked');
  }

  if (!user.emailVerified) {
    return t('status.unverified');
  }

  return t('status.active');
}

function statusColor(user: User): string {
  if (user.locked) {
    return 'negative';
  }

  if (!user.emailVerified) {
    return 'warning';
  }

  return 'positive';
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

function onAddUser() {
  quasar
    .dialog({
      component: UserCreateDialog,
    })
    .onOk((payload: UserCreateData) => {
      void createUser(payload);
    });
}

function onEditUser(user: User) {
  quasar
    .dialog({
      component: UserUpdateDialog,
      componentProps: {
        user,
      },
    })
    .onOk((payload: UserUpdateData) => {
      void updateUser(user.id, payload);
    });
}

function onDeleteUser(user: User) {
  quasar
    .dialog({
      component: SafeDeleteDialog,
      componentProps: {
        title: t('dialog.delete.title'),
        message: t('dialog.delete.message'),
        value: user.email,
        label: t('dialog.delete.label'),
      },
    })
    .onOk(() => {
      void deleteUser(user.id);
    });
}

function onLockUser(user: User) {
  quasar
    .dialog({
      title: t('dialog.lock.title'),
      message: t('dialog.lock.message', { name: user.name }),
      cancel: {
        label: t('dialog.lock.cancel'),
        color: 'primary',
        rounded: true,
        outline: true,
      },
      ok: {
        label: t('dialog.lock.ok'),
        color: 'warning',
        rounded: true,
      },
    })
    .onOk(() => {
      void updateUser(user.id, {
        locked: true,
      });
    });
}

function onUnlockUser(user: User) {
  quasar
    .dialog({
      title: t('dialog.unlock.title'),
      message: t('dialog.unlock.message', { name: user.name }),
      cancel: {
        label: t('dialog.unlock.cancel'),
        color: 'primary',
        rounded: true,
        outline: true,
      },
      ok: {
        label: t('dialog.unlock.ok'),
        color: 'primary',
        rounded: true,
      },
    })
    .onOk(() => {
      void updateUser(user.id, {
        locked: false,
      });
    });
}

async function createUser(data: UserCreateData) {
  await withProgressNotification('update', () => api.createUser(data));
  reload();
}

async function updateUser(id: string, data: UserUpdateData) {
  await withProgressNotification('update', () => api.updateUser(id, data));
  reload();
}

async function deleteUser(id: string) {
  await withProgressNotification('delete', () => api.deleteUser(id));
  reload();
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

.email-link {
  color: var(--md3-primary);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}
</style>

<i18n lang="yaml" locale="en">
title: 'Users'

action:
  delete: 'Delete'
  edit: 'Edit'
  lock: 'Lock'
  unlock: 'Unlock'

column:
  action: 'Action'
  createdAt: 'Created At'
  email: 'Email'
  lastSeen: 'Last seen'
  name: 'Name'
  role: 'Role'
  status: 'Status'

dialog:
  delete:
    title: 'Delete User'
    message: 'The user will be permanently deleted. All associated data (e.g. camps) will be lost.'
    label: 'Email'
  lock:
    title: 'Lock account'
    message: 'Are you sure you want to lock { name }?'
    ok: 'Lock'
    cancel: 'Cancel'
  unlock:
    title: 'Unlock account'
    message: 'Are you sure you want to unlock { name }?'
    ok: 'Unlock'
    cancel: 'Cancel'

header:
  create: 'Create user'

lastSeen:
  never: 'Never'

status:
  active: 'Active'
  locked: 'Locked'
  unverified: 'Unverified'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Benutzer'

action:
  delete: 'Löschen'
  edit: 'Bearbeiten'
  lock: 'Sperren'
  unlock: 'Entsperren'

column:
  action: 'Aktion'
  createdAt: 'Erstellt am'
  email: 'E-Mail'
  lastSeen: 'Zuletzt gesehen'
  name: 'Name'
  role: 'Rolle'
  status: 'Status'

dialog:
  delete:
    title: 'Benutzer löschen'
    message: 'Der Benutzer wird dauerhaft gelöscht. Alle zugehörigen Daten (z.B. Camps) gehen verloren.'
    label: 'E-Mail'
  lock:
    title: 'Konto sperren'
    message: 'Bist du sicher, dass du { name } sperren möchtest?'
    ok: 'Sperren'
    cancel: 'Abbrechen'
  unlock:
    title: 'Konto entsperren'
    message: 'Bist du sicher, dass du { name } entsperren möchtest?'
    ok: 'Entsperren'
    cancel: 'Abbrechen'

header:
  create: 'Benutzer erstellen'

lastSeen:
  never: 'Niemals'

status:
  active: 'Aktiv'
  locked: 'Gesperrt'
  unverified: 'Unbestätigt'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Utilisateurs'

action:
  delete: 'Supprimer'
  edit: 'Modifier'
  lock: 'Verrouiller'
  unlock: 'Déverrouiller'

column:
  action: 'Action'
  createdAt: 'Créé le'
  email: 'E-mail'
  lastSeen: 'Dernière vue'
  name: 'Nom'
  role: 'Rôle'
  status: 'Statut'

dialog:
  delete:
    title: 'Supprimer l’utilisateur'
    message: 'L’utilisateur sera définitivement supprimé. Toutes les données associées (par ex. camps) seront perdues.'
    label: 'E-mail'
  lock:
    title: 'Verrouiller le compte'
    message: 'Es-tu sûr de vouloir verrouiller { name } ?'
    ok: 'Verrouiller'
    cancel: 'Annuler'
  unlock:
    title: 'Déverrouiller le compte'
    message: 'Es-tu sûr de vouloir déverrouiller { name } ?'
    ok: 'Déverrouiller'
    cancel: 'Annuler'

header:
  create: 'Créer un utilisateur'

lastSeen:
  never: 'Jamais'

status:
  active: 'Actif'
  locked: 'Verrouillé'
  unverified: 'Non vérifié'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Użytkownicy'

action:
  delete: 'Usuń'
  edit: 'Edytuj'
  lock: 'Zablokuj'
  unlock: 'Odblokuj'

column:
  action: 'Akcja'
  createdAt: 'Utworzono'
  email: 'E-mail'
  lastSeen: 'Ostatnio widziany'
  name: 'Nazwa'
  role: 'Rola'
  status: 'Status'

dialog:
  delete:
    title: 'Usuń użytkownika'
    message: 'Użytkownik zostanie trwale usunięty. Wszystkie powiązane dane (np. obozy) zostaną utracone.'
    label: 'E-mail'
  lock:
    title: 'Zablokuj konto'
    message: 'Czy na pewno chcesz zablokować { name }?'
    ok: 'Zablokuj'
    cancel: 'Anuluj'
  unlock:
    title: 'Odblokuj konto'
    message: 'Czy na pewno chcesz odblokować { name }?'
    ok: 'Odblokuj'
    cancel: 'Anuluj'

header:
  create: 'Utwórz użytkownika'

lastSeen:
  never: 'Nigdy'

status:
  active: 'Aktywny'
  locked: 'Zablokowany'
  unverified: 'Niezweryfikowany'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Uživatelé'

action:
  delete: 'Smazat'
  edit: 'Upravit'
  lock: 'Zamknout'
  unlock: 'Odemknout'

column:
  action: 'Akce'
  createdAt: 'Vytvořeno'
  email: 'E-mail'
  lastSeen: 'Naposledy viděn'
  name: 'Jméno'
  role: 'Role'
  status: 'Stav'

dialog:
  delete:
    title: 'Smazat uživatele'
    message: 'Uživatel bude trvale smazán. Všechna související data (např. tábory) budou ztracena.'
    label: 'E-mail'
  lock:
    title: 'Zamknout účet'
    message: 'Opravdu chcete zamknout { name }?'
    ok: 'Zamknout'
    cancel: 'Zrušit'
  unlock:
    title: 'Odemknout účet'
    message: 'Opravdu chcete odemknout { name }?'
    ok: 'Odemknout'
    cancel: 'Zrušit'

header:
  create: 'Vytvořit uživatele'

lastSeen:
  never: 'Nikdy'

status:
  active: 'Aktivní'
  locked: 'Zamčený'
  unverified: 'Neověřený'
</i18n>
