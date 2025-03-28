<template>
  <page-state-handler :error>
    <q-table
      :title="t('title')"
      :columns
      :rows
      :loading
      :pagination
      class="absolute fit"
      flat
    >
      <template #top-right>
        <q-btn
          color="primary"
          icon="add"
          :label="t('action.add')"
          rounded
          @click="showAddDialog"
        />
      </template>

      <template #body="props">
        <q-tr :props>
          <q-td
            key="name"
            :props
          >
            {{ props.row.name }}
          </q-td>
          <q-td
            key="email"
            :props
          >
            {{ props.row.email }}
          </q-td>
          <q-td
            key="role"
            :props
          >
            {{ t('role.' + props.row.role) }}
          </q-td>
          <q-td
            key="status"
            :props
          >
            {{ t('status.' + props.row.status) }}
          </q-td>
          <q-td
            key="expiresAt"
            :props
          >
            <template v-if="props.row.expiresAt == null">
              {{ t('expiresAt.never') }}
            </template>
            <a
              v-else-if="new Date(props.row.expiresAt) < new Date()"
              class="text-warning"
            >
              {{ t('expiresAt.expired') }}
            </a>
            <template v-else>
              {{ d(props.row.expiresAt, 'dateTime') }}
            </template>
          </q-td>
          <q-td
            key="action"
            :props
          >
            <q-btn
              v-if="userEmail !== props.row.email"
              aria-label="actions"
              icon="more_vert"
              color="primary"
              round
              size="xs"
            >
              <q-menu>
                <q-list style="min-width: 150px">
                  <q-item
                    clickable
                    v-close-popup
                    @click="showEditDialog(props.row)"
                  >
                    <q-item-section avatar>
                      <q-icon
                        name="edit"
                        size="sm"
                      />
                    </q-item-section>
                    <q-item-section>
                      {{ t('action.edit') }}
                    </q-item-section>
                  </q-item>
                  <q-item
                    clickable
                    v-close-popup
                    class="text-negative"
                    @click="showDeleteDialog(props.row)"
                  >
                    <q-item-section avatar>
                      <q-icon
                        name="delete"
                        size="sm"
                      />
                    </q-item-section>
                    <q-item-section>
                      {{ t('action.delete') }}
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { useCampManagerStore } from 'stores/camp-manager-store';
import { computed } from 'vue';
import type {
  CampManager,
  CampManagerCreateData,
  CampManagerUpdateData,
} from '@camp-registration/common/entities';
import PageStateHandler from 'components/common/PageStateHandler.vue';
import { useQuasar } from 'quasar';
import SafeDeleteDialog from 'components/common/dialogs/SafeDeleteDialog.vue';
import CampManagerCreateDialog from 'components/campManagement/settings/access/CampManagerCreateDialog.vue';
import { useProfileStore } from 'stores/profile-store';
import { type QTableColumn } from 'quasar';
import { useCampDetailsStore } from 'stores/camp-details-store';
import CampManagerUpdateDialog from 'components/campManagement/settings/access/CampManagerUpdateDialog.vue';

const quasar = useQuasar();
const { t, d } = useI18n();
const campManagerStore = useCampManagerStore();
const profileStore = useProfileStore();
const campDetailsStore = useCampDetailsStore();

campManagerStore.fetchData();
campDetailsStore.fetchData();

const error = computed<string | null>(() => {
  return campManagerStore.error ?? campDetailsStore.error;
});

const loading = computed<boolean>(() => {
  return campManagerStore.isLoading || campDetailsStore.isLoading;
});

const pagination = {
  page: 1,
  rowsPerPage: -1,
};

const columns: QTableColumn[] = [
  {
    name: 'name',
    required: true,
    label: t('column.name'),
    field: 'name',
    align: 'left',
  },
  {
    name: 'email',
    required: true,
    label: t('column.email'),
    field: 'email',
    align: 'left',
  },
  {
    name: 'role',
    required: true,
    label: t('column.role'),
    field: 'role',
    align: 'center',
  },
  {
    name: 'status',
    required: true,
    label: t('column.status'),
    field: 'status',
    align: 'center',
  },
  {
    name: 'expiresAt',
    required: true,
    label: t('column.expiresAt'),
    field: 'expiresAt',
    align: 'center',
  },
  {
    name: 'action',
    required: true,
    label: '',
    field: '',
    align: 'center',
  },
];

const userEmail = computed<string | undefined>(() => {
  return profileStore.user?.email;
});

const rows = computed<CampManager[]>(() => {
  return campManagerStore.data ?? [];
});

function showAddDialog() {
  const date = new Date(campDetailsStore.data?.endAt ?? '');
  date.setHours(23, 59, 59, 999);

  quasar
    .dialog({
      component: CampManagerCreateDialog,
      componentProps: {
        date: date.toISOString(),
      },
    })
    .onOk((data: CampManagerCreateData) => {
      campManagerStore.createData(data);
    });
}

function showEditDialog(manager: CampManager) {
  quasar
    .dialog({
      component: CampManagerUpdateDialog,
      componentProps: {
        expiresAt: manager.expiresAt,
      },
    })
    .onOk((payload: CampManagerUpdateData) => {
      campManagerStore.updateData(manager.id, payload);
    });
}

function showDeleteDialog(manager: CampManager) {
  quasar
    .dialog({
      component: SafeDeleteDialog,
      componentProps: {
        title: t('dialog.delete.title'),
        message: t('dialog.delete.message'),
        label: t('dialog.delete.label'),
        value: manager.email,
      },
    })
    .onOk(() => {
      campManagerStore.deleteData(manager.id);
    });
}
</script>

<i18n lang="yaml" locale="en">
title: 'Access'

action:
  add: 'Add'
  delete: 'Delete'
  edit: 'Edit'

dialog:
  delete:
    title: 'Remove Access'
    message: 'Are you sure you want to remove this person?'
    label: 'Email'

column:
  email: 'Email'
  expiresAt: 'Expires at'
  name: 'Name'
  role: 'Role'
  status: 'Status'

expiresAt:
  never: 'Never'
  expired: 'Expired'

status:
  accepted: 'Accepted'
  pending: 'Pending'

role:
  manager: 'Manager'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Zugriff'

action:
  add: 'Hinzufügen'
  delete: 'Löschen'
  edit: 'Bearbeiten'

dialog:
  delete:
    title: 'Zugriff entfernen'
    message: 'Möchten Sie diese Person wirklich entfernen?'
    label: 'E-Mail'

column:
  email: 'E-Mail'
  name: 'Name'
  role: 'Rolle'
  status: 'Status'

expiresAt:
  never: 'Nie'
  expired: 'Abgelaufen'

status:
  accepted: 'Akzeptiert'
  pending: 'Ausstehend'

role:
  manager: 'Manager'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Accès'

action:
  add: 'Ajouter'
  delete: 'Suprimer'
  edit: 'Modifier'

dialog:
  delete:
    title: "Supprimer l'accès"
    message: 'Êtes-vous sûr de vouloir supprimer cette personne ?'
    label: 'E-mail'

column:
  email: 'E-mail'
  name: 'Nom'
  role: 'Rôle'
  status: 'Statut'

expiresAt:
  never: 'Jamais'
  expired: 'Expiré'

status:
  accepted: 'Accepté'
  pending: 'En attente'

role:
  manager: 'Manager'
</i18n>

<style scoped></style>
