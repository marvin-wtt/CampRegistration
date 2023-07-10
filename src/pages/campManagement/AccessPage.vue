<template>
  <page-state-handler
    :error="error"
    :loading="false"
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
              icon="clear"
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

  <q-dialog v-model="addDialog">
    <q-card>
      <q-card-section>
        <div class="text-h6">
          {{ t('dialog.add.title') }}
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        {{ t('dialog.add.text') }}
      </q-card-section>

      <q-card-section class="q-pt-none">
        {{ t('dialog.add.text') }}
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-input type="email" />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          v-close-popup
          color="primary"
          label="OK"
          flat
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { useCampManagerStore } from 'stores/camp-manager-store';
import { computed, ref } from 'vue';
import { CampManager } from 'src/types/CampManager';
import PageStateHandler from 'components/PageStateHandler.vue';

const { t } = useI18n();
const campManagerStore = useCampManagerStore();

campManagerStore.fetchData();

const addDialog = ref<boolean>(false);

const pagination = {
  page: 1,
  rowsPerPage: -1,
};

const columns = [
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
    align: 'center',
  },
];

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
  // TODO
}

function showDeleteDialog(manager: CampManager) {
  // TODO
}
</script>

<i18n lang="yaml" locale="en">
title: 'Access'

action:
  add: 'Add'

dialog:
  add:
    title: 'Grant Access'
    text: 'Enter the email address:'
  remove:
    title: 'Remove Access'
    text: 'Are you sure you want to remove this person?'

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

<style scoped></style>
