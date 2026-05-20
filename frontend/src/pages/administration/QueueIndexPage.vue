<template>
  <page-state-handler :error>
    <q-table
      :title="t('title')"
      :loading
      :rows="queues ?? []"
      :columns
      row-key="name"
      :rows-per-page-options="[0]"
      hide-bottom
      class="absolute fit"
    >
      <template #top-right>
        <q-btn
          icon="refresh"
          round
          flat
          :loading
          @click="refresh"
        />
      </template>

      <template #body-cell-active="props">
        <q-td :props="props">
          <q-chip
            v-if="props.value > 0"
            color="primary"
            text-color="white"
            dense
            size="sm"
          >
            {{ props.value }}
          </q-chip>
          <span
            v-else
            class="text-grey-5"
            >{{ props.value }}</span
          >
        </q-td>
      </template>

      <template #body-cell-pending="props">
        <q-td :props="props">
          <q-chip
            v-if="props.value > 0"
            color="info"
            text-color="white"
            dense
            size="sm"
          >
            {{ props.value }}
          </q-chip>
          <span
            v-else
            class="text-grey-5"
            >{{ props.value }}</span
          >
        </q-td>
      </template>

      <template #body-cell-delayed="props">
        <q-td :props="props">
          <q-chip
            v-if="props.value > 0"
            color="warning"
            text-color="white"
            dense
            size="sm"
          >
            {{ props.value }}
          </q-chip>
          <span
            v-else
            class="text-grey-5"
            >{{ props.value }}</span
          >
        </q-td>
      </template>

      <template #body-cell-failed="props">
        <q-td :props="props">
          <q-chip
            v-if="props.value > 0"
            color="negative"
            text-color="white"
            dense
            size="sm"
          >
            {{ props.value }}
          </q-chip>
          <span
            v-else
            class="text-grey-5"
            >{{ props.value }}</span
          >
        </q-td>
      </template>

      <template #body-cell-action="props">
        <q-td
          :props
          auto-width
        >
          <div class="row no-wrap q-gutter-x-sm justify-center">
            <q-btn
              icon="replay"
              color="warning"
              round
              flat
              size="sm"
              :disable="props.row.counts.failed === 0"
              @click="onRetryFailed(props.row)"
            >
              <q-tooltip>{{ t('action.retry') }}</q-tooltip>
            </q-btn>
            <q-btn
              icon="delete_sweep"
              color="negative"
              round
              flat
              size="sm"
              :disable="props.row.counts.failed === 0"
              @click="onDeleteFailed(props.row)"
            >
              <q-tooltip>{{ t('action.delete') }}</q-tooltip>
            </q-btn>
          </div>
        </q-td>
      </template>
    </q-table>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar, type QTableColumn } from 'quasar';
import PageStateHandler from 'components/common/PageStateHandler.vue';
import { useAPIService } from 'src/services/APIService';
import { useServiceHandler } from 'src/composables/serviceHandler';
import type { QueueInfo } from 'src/services/QueueService';

const { t } = useI18n();
const quasar = useQuasar();
const api = useAPIService();

const {
  data: queues,
  error,
  isLoading: loading,
  forceFetch,
  withProgressNotification,
} = useServiceHandler<QueueInfo[]>('queue');

const columns = computed<QTableColumn<QueueInfo>[]>(() => [
  {
    name: 'name',
    label: t('column.name'),
    field: 'name',
    align: 'left',
    sortable: true,
  },
  {
    name: 'active',
    label: t('column.active'),
    field: (row) => row.counts.active,
    align: 'center',
    sortable: true,
  },
  {
    name: 'pending',
    label: t('column.pending'),
    field: (row) => row.counts.pending,
    align: 'center',
    sortable: true,
  },
  {
    name: 'delayed',
    label: t('column.delayed'),
    field: (row) => row.counts.delayed,
    align: 'center',
    sortable: true,
  },
  {
    name: 'failed',
    label: t('column.failed'),
    field: (row) => row.counts.failed,
    align: 'center',
    sortable: true,
  },
  {
    name: 'action',
    label: t('column.action'),
    field: 'name',
    align: 'center',
  },
]);

let refreshInterval: ReturnType<typeof setInterval> | null = null;

onMounted(async () => {
  await refresh();
  refreshInterval = setInterval(() => void refresh(), 15_000);
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});

async function refresh() {
  await forceFetch(() => api.fetchQueues());
}

function onRetryFailed(queue: QueueInfo) {
  quasar
    .dialog({
      title: t('dialog.retry.title'),
      message: t('dialog.retry.message', { name: queue.name }),
      cancel: {
        label: t('dialog.cancel'),
        color: 'primary',
        rounded: true,
        outline: true,
      },
      ok: { label: t('dialog.retry.ok'), color: 'warning', rounded: true },
    })
    .onOk(() => {
      void retryFailed(queue.name);
    });
}

function onDeleteFailed(queue: QueueInfo) {
  quasar
    .dialog({
      title: t('dialog.delete.title'),
      message: t('dialog.delete.message', { name: queue.name }),
      cancel: {
        label: t('dialog.cancel'),
        color: 'primary',
        rounded: true,
        outline: true,
      },
      ok: { label: t('dialog.delete.ok'), color: 'negative', rounded: true },
    })
    .onOk(() => {
      void deleteFailed(queue.name);
    });
}

async function retryFailed(name: string) {
  await withProgressNotification('retry', () => api.retryFailedJobs(name));
  await refresh();
}

async function deleteFailed(name: string) {
  await withProgressNotification('delete', () => api.deleteFailedJobs(name));
  await refresh();
}
</script>

<i18n lang="yaml" locale="en">
title: 'Queues'

action:
  retry: 'Retry failed jobs'
  delete: 'Delete failed jobs'

column:
  action: 'Actions'
  active: 'Active'
  delayed: 'Delayed'
  failed: 'Failed'
  name: 'Queue'
  pending: 'Pending'

dialog:
  cancel: 'Cancel'
  retry:
    title: 'Retry failed jobs'
    message: 'All failed jobs in "{name}" will be reset and retried.'
    ok: 'Retry'
  delete:
    title: 'Delete failed jobs'
    message: 'All failed jobs in "{name}" will be permanently deleted.'
    ok: 'Delete'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Warteschlangen'

action:
  retry: 'Fehlgeschlagene Jobs wiederholen'
  delete: 'Fehlgeschlagene Jobs löschen'

column:
  action: 'Aktionen'
  active: 'Aktiv'
  delayed: 'Verzögert'
  failed: 'Fehlgeschlagen'
  name: 'Warteschlange'
  pending: 'Ausstehend'

dialog:
  cancel: 'Abbrechen'
  retry:
    title: 'Fehlgeschlagene Jobs wiederholen'
    message: 'Alle fehlgeschlagenen Jobs in "{name}" werden zurückgesetzt und erneut ausgeführt.'
    ok: 'Wiederholen'
  delete:
    title: 'Fehlgeschlagene Jobs löschen'
    message: 'Alle fehlgeschlagenen Jobs in "{name}" werden dauerhaft gelöscht.'
    ok: 'Löschen'
</i18n>

<i18n lang="yaml" locale="fr">
title: "Files d'attente"

action:
  retry: 'Relancer les tâches échouées'
  delete: 'Supprimer les tâches échouées'

column:
  action: 'Actions'
  active: 'Actives'
  delayed: 'Différées'
  failed: 'Échouées'
  name: "File d'attente"
  pending: 'En attente'

dialog:
  cancel: 'Annuler'
  retry:
    title: 'Relancer les tâches échouées'
    message: 'Toutes les tâches échouées dans "{name}" seront réinitialisées et relancées.'
    ok: 'Relancer'
  delete:
    title: 'Supprimer les tâches échouées'
    message: 'Toutes les tâches échouées dans "{name}" seront définitivement supprimées.'
    ok: 'Supprimer'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Kolejki'

action:
  retry: 'Ponów nieudane zadania'
  delete: 'Usuń nieudane zadania'

column:
  action: 'Akcje'
  active: 'Aktywne'
  delayed: 'Opóźnione'
  failed: 'Nieudane'
  name: 'Kolejka'
  pending: 'Oczekujące'

dialog:
  cancel: 'Anuluj'
  retry:
    title: 'Ponów nieudane zadania'
    message: 'Wszystkie nieudane zadania w "{name}" zostaną zresetowane i ponowione.'
    ok: 'Ponów'
  delete:
    title: 'Usuń nieudane zadania'
    message: 'Wszystkie nieudane zadania w "{name}" zostaną trwale usunięte.'
    ok: 'Usuń'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Fronty'

action:
  retry: 'Zopakovat neúspěšné úlohy'
  delete: 'Smazat neúspěšné úlohy'

column:
  action: 'Akce'
  active: 'Aktivní'
  delayed: 'Odložené'
  failed: 'Neúspěšné'
  name: 'Fronta'
  pending: 'Čekající'

dialog:
  cancel: 'Zrušit'
  retry:
    title: 'Zopakovat neúspěšné úlohy'
    message: 'Všechny neúspěšné úlohy ve frontě "{name}" budou resetovány a zopakovány.'
    ok: 'Zopakovat'
  delete:
    title: 'Smazat neúspěšné úlohy'
    message: 'Všechny neúspěšné úlohy ve frontě "{name}" budou trvale odstraněny.'
    ok: 'Smazat'
</i18n>
