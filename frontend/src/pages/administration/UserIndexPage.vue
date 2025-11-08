<template>
  <page-state-handler :error>
    <q-table
      v-model:pagination="pagination"
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
        <div class="row no-wrap q-gutter-x-md">
          <!-- Search -->
          <q-input
            v-model="filterQuery"
            :placeholder="t('filter.search')"
            debounce="300"
            outlined
            rounded
            dense
          >
            <template #append>
              <q-icon name="search" />
            </template>
          </q-input>

          <q-btn
            v-if="quasar.screen.gt.xs"
            :label="t('header.create')"
            icon="add"
            color="primary"
            rounded
            @click="onAddUser()"
          />
          <q-btn
            v-else
            icon="add"
            color="primary"
            round
            @click="onAddUser()"
          />
        </div>
      </template>

      <template #body-cell-email="props">
        <q-td :props="props">
          <a
            :href="'mailto:' + props.value"
            style="text-decoration: none; color: inherit"
          >
            {{ props.value }}
          </a>
        </q-td>
      </template>

      <template #body-cell-status="props">
        <q-td :props="props">
          {{ getUserStatus(props.row) }}
        </q-td>
      </template>

      <template #body-cell-lastSeen="props">
        <q-td :props="props">
          {{ props.value ? formatDateTime(props.value) : t('lastSeen.never') }}
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
          <div
            v-if="quasar.screen.gt.md"
            class="q-gt-md row no-wrap q-gutter-x-md justify-center"
          >
            <q-btn
              v-if="!props.row.locked"
              icon="lock"
              round
              flat
              size="sm"
              @click="onLockUser(props.row)"
            >
              <q-tooltip>{{ t('action.lock') }}</q-tooltip>
            </q-btn>
            <q-btn
              v-else
              icon="lock_open"
              round
              flat
              size="sm"
              @click="onUnlockUser(props.row)"
            >
              <q-tooltip>{{ t('action.unlock') }}</q-tooltip>
            </q-btn>
            <q-btn
              icon="edit"
              round
              flat
              size="sm"
              @click="onEditUser(props.row)"
            >
              <q-tooltip>{{ t('action.edit') }}</q-tooltip>
            </q-btn>
            <q-btn
              icon="delete"
              color="negative"
              round
              flat
              size="sm"
              @click="onDeleteUser(props.row)"
            >
              <q-tooltip>{{ t('action.delete') }}</q-tooltip>
            </q-btn>
          </div>

          <q-btn
            v-else
            icon="more_vert"
            size="sm"
            round
            flat
          >
            <q-menu>
              <q-list style="min-width: 100px">
                <q-item
                  v-if="!props.row.locked"
                  v-close-popup
                  clickable
                  @click="onLockUser(props.row)"
                >
                  <q-item-section>
                    {{ t('action.lock') }}
                  </q-item-section>
                </q-item>
                <q-item
                  v-else
                  v-close-popup
                  clickable
                  @click="onUnlockUser(props.row)"
                >
                  <q-item-section>
                    {{ t('action.unlock') }}
                  </q-item-section>
                </q-item>
                <q-separator />
                <q-item
                  v-close-popup
                  clickable
                  @click="onEditUser(props.row)"
                >
                  <q-item-section>
                    {{ t('action.edit') }}
                  </q-item-section>
                </q-item>
                <q-item
                  v-close-popup
                  clickable
                  class="text-negative"
                  @click="onDeleteUser(props.row)"
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
import { type QTableColumn, type QTableProps } from 'quasar';
import type {
  User,
  UserUpdateData,
  UserCreateData,
} from '@camp-registration/common/entities';
import { useI18n } from 'vue-i18n';
import PageStateHandler from 'components/common/PageStateHandler.vue';
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import SafeDeleteDialog from 'components/common/dialogs/SafeDeleteDialog.vue';
import UserCreateDialog from 'components/administration/users/UserCreateDialog.vue';
import UserUpdateDialog from 'components/administration/users/UserUpdateDialog.vue';
import { useAPIService } from 'src/services/APIService';
import { useServiceHandler } from 'src/composables/serviceHandler';

const { t, locale } = useI18n();
const quasar = useQuasar();
const api = useAPIService();
const {
  data: users,
  error,
  isLoading: loading,
  forceFetch,
  withProgressNotification,
} = useServiceHandler<User[]>('user');

const filterQuery = ref<string>('');
const pagination = ref<QTableProps['pagination']>({
  rowsPerPage: 0,
  sortBy: 'lastSeen',
  descending: true,
});

fetchAll();

const rows = computed<User[]>(() => {
  if (!users.value) {
    return [];
  }

  if (!filterQuery.value) {
    return users.value;
  }

  return users.value
    .map((user) => {
      const nameScore = getMatchScore(user.name, filterQuery.value);
      const emailScore = getMatchScore(user.email, filterQuery.value);
      return {
        ...user,
        score: Math.max(nameScore, emailScore),
      };
    })
    .filter((user) => user.score > 0)
    .sort((a, b) => b.score - a.score);
});

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

function getMatchScore(text: string, query: string) {
  text = text.toLowerCase();
  query = query.toLowerCase();
  if (text.includes(query)) {
    return query.length / text.length;
  }

  return 0;
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
      createUser(payload);
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
      updateUser(user.id, payload);
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
      deleteUser(user.id);
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
      updateUser(user.id, {
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
      updateUser(user.id, {
        locked: false,
      });
    });
}

async function fetchAll() {
  return forceFetch(() => api.fetchUsers());
}

async function createUser(data: UserCreateData) {
  const user = await withProgressNotification('update', () =>
    api.createUser(data),
  );

  // Update data
  if (!users.value) {
    return user;
  }

  users.value.push(user);
}

async function updateUser(id: string, data: UserUpdateData) {
  const user = await withProgressNotification('update', () =>
    api.updateUser(id, data),
  );

  // Update data
  if (!users.value) {
    return user;
  }

  const index = users.value.findIndex((c) => c.id === id);
  if (index === -1) {
    return user;
  }

  users.value.splice(index, 1, user);
}

async function deleteUser(id: string) {
  await withProgressNotification('delete', () => api.deleteUser(id));

  // Update data
  if (!users.value) {
    return;
  }

  const index = users.value.findIndex((c) => c.id === id);
  if (index === -1) {
    return;
  }

  users.value.splice(index, 1);
}
</script>

<style scoped></style>

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

filter:
  search: 'Search'

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

filter:
  search: 'Suchen'

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

filter:
  search: 'Chercher'

header:
  create: 'Créer un utilisateur'

lastSeen:
  never: 'Jamais'

status:
  active: 'Actif'
  locked: 'Verrouillé'
  unverified: 'Non vérifié'
</i18n>
