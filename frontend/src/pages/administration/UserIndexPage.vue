<template>
  <page-state-handler :error>
    <q-table
      :title="t('title')"
      :loading
      :rows
      :columns
      class="absolute fit"
    >
      <template #top-right>
        <div class="row no-wrap q-gutter-x-lg">
          <!-- Search -->
          <q-input
            v-model="query"
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

          <q-btn
            v-if="quasar.screen.gt.xs"
            :label="t('header.create')"
            icon="add"
            color="primary"
            rounded
            @click="addUser()"
          />
          <q-btn
            v-else
            icon="add"
            color="primary"
            round
            @click="addUser()"
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

      <template #body-cell-createdAt="props">
        <q-td :props="props">
          {{ formatDateTime(props.value) }}
        </q-td>
      </template>

      <template #body-cell-action="props">
        <q-td :props="props">
          <div
            v-if="quasar.screen.gt.md"
            class="q-gt-md row q-gutter-x-md justify-center"
          >
            <q-btn
              icon="edit"
              round
              flat
              size="sm"
              @click="editUser(props.row)"
            />
            <q-btn
              icon="delete"
              round
              flat
              size="sm"
              @click="deleteUser(props.row)"
            />
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
                <!-- TODO lock / unlock -->
                <q-item
                  v-close-popup
                  clickable
                  @click="editUser(props.row)"
                >
                  <q-item-section>
                    {{ t('action.edit') }}
                  </q-item-section>
                </q-item>
                <q-item
                  v-close-popup
                  color="negative"
                  clickable
                  @click="deleteUser(props.row)"
                >
                  <q-item-section>
                    {{ t('action.delete') }}
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
            <!-- TODO add menu -->
          </q-btn>
        </q-td>
      </template>
    </q-table>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { useUsersStore } from 'stores/users-store';
import { QTableColumn } from 'quasar';
import type {
  User,
  UserUpdateData,
  UserCreateData,
} from '@camp-registration/common/entities';
import { useI18n } from 'vue-i18n';
import PageStateHandler from 'components/common/PageStateHandler.vue';
import { computed, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import SafeDeleteDialog from 'components/common/dialogs/SafeDeleteDialog.vue';
import UserCreateDialog from 'components/administration/users/UserCreateDialog.vue';
import UserUpdateDialog from 'components/administration/users/UserUpdateDialog.vue';

const usersStore = useUsersStore();
const { t, locale } = useI18n();
const quasar = useQuasar();

const query = ref<string>('');

onMounted(async () => {
  await usersStore.fetchData();
});

const error = computed(() => {
  return usersStore.error;
});

const loading = computed<boolean>(() => {
  return usersStore.isLoading;
});

const users = computed<User[]>(() => {
  return usersStore.data ?? [];
});

const rows = computed<User[]>(() => {
  if (!query.value) {
    return users.value;
  }

  return users.value
    .map((user) => {
      const nameScore = getMatchScore(user.name, query.value);
      const emailScore = getMatchScore(user.email, query.value);
      return {
        ...user,
        score: Math.max(nameScore, emailScore),
      };
    })
    .filter((user) => user.score > 0)
    .sort((a, b) => b.score - a.score);
});

const columns: QTableColumn<User>[] = [
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
];

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

function addUser() {
  quasar
    .dialog({
      component: UserCreateDialog,
    })
    .onOk((payload: UserCreateData) => {
      usersStore.createEntry(payload);
    });
}

function editUser(user: User) {
  quasar
    .dialog({
      component: UserUpdateDialog,
      componentProps: {
        user,
      },
    })
    .onOk((payload: UserUpdateData) => {
      usersStore.updateEntry(user.id, payload);
    });
}

function deleteUser(user: User) {
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
      usersStore.deleteEntry(user.id);
    });
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
title: 'Users'

column:
  action: 'Action'
  createdAt: 'Created At'
  email: 'Email'
  name: 'Name'
  role: 'Role'
  status: 'Status'

header:
  create: 'Create user'

dialog:
  delete:
    title: 'Delete User'
    message: 'The user will be permanently deleted. All associated data (e.g. camps) will be lost.'
    label: 'Email'

status:
  active: 'Active'
  locked: 'Locked'
  unverified: 'Unverified'
</i18n>
