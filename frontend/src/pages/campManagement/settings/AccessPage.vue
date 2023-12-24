<template>
  <page-state-handler
    :error="error"
    padding
  >
    <q-table
      :title="t('title')"
      :columns="columns"
      :rows="rows"
      :loading="loading"
      :pagination="pagination"
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
        <q-tr :props="props">
          <q-td
            key="name"
            :props="props"
          >
            {{ props.row.name }}
          </q-td>
          <q-td
            key="email"
            :props="props"
          >
            {{ props.row.email }}
          </q-td>
          <q-td
            key="role"
            :props="props"
          >
            {{ t('role.' + props.row.role) }}
          </q-td>
          <q-td
            key="status"
            :props="props"
          >
            {{ t('status.' + props.row.status) }}
          </q-td>
          <q-td
            key="action"
            :props="props"
          >
            <q-btn
              v-if="userEmail !== props.row.email"
              icon="delete"
              round
              outline
              size="xs"
              @click="showDeleteDialog(props.row)"
            />
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
import type { CampManager } from '@camp-registration/common/entities';
import PageStateHandler from 'components/common/PageStateHandler.vue';
import { useQuasar } from 'quasar';
import SafeDeleteDialog from 'components/common/dialogs/SafeDeleteDialog.vue';
import AddCampManagerDialog from 'components/campManagement/access/AddCampManagerDialog.vue';
import { useAuthStore } from 'stores/auth-store';
import { QTableColumn } from 'src/types/quasar/QTableColum';

const quasar = useQuasar();
const { t } = useI18n();
const campManagerStore = useCampManagerStore();
const authStore = useAuthStore();

campManagerStore.fetchData();

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
    name: 'action',
    required: true,
    label: '',
    field: '',
    align: 'center',
  },
];

const userEmail = computed<string | undefined>(() => {
  return authStore.user?.email;
});

const rows = computed<CampManager[]>(() => {
  return campManagerStore.data ?? [];
});

const error = computed(() => {
  return campManagerStore.error;
});

const loading = computed<boolean>(() => {
  return campManagerStore.isLoading;
});

function showAddDialog() {
  quasar
    .dialog({
      component: AddCampManagerDialog,
      componentProps: {
        title: t('dialog.add.title'),
        message: t('dialog.add.message'),
      },
    })
    .onOk((email) => {
      campManagerStore.createData(email);
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

dialog:
  add:
    title: 'Grant Access'
    message: 'Enter the email addressQuestion:'
  delete:
    title: 'Remove Access'
    message: 'Are you sure you want to remove this person?'
    label: 'Email'

column:
  email: 'Email'
  name: 'Name'
  role: 'Role'
  status: 'Status'

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

dialog:
  add:
    title: 'Zugriff gewähren'
    message: 'Geben Sie die E-Mail-Adresse ein:'
  delete:
    title: 'Zugriff entfernen'
    message: 'Möchten Sie diese Person wirklich entfernen?'
    label: 'E-Mail'

column:
  email: 'E-Mail'
  name: 'Name'
  role: 'Rolle'
  status: 'Status'

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

dialog:
  add:
    title: "Accorder l'accès"
    message: "Entrez l'adresse e-mail :"
  delete:
    title: "Supprimer l'accès"
    message: 'Êtes-vous sûr de vouloir supprimer cette personne ?'
    label: 'E-mail'

column:
  email: 'E-mail'
  name: 'Nom'
  role: 'Rôle'
  status: 'Statut'

status:
  accepted: 'Accepté'
  pending: 'En attente'

role:
  manager: 'Manager'
</i18n>

<style scoped></style>
