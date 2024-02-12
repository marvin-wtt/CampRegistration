<template>
  <q-item
    v-ripple
    clickable
    @click="resultsAction"
  >
    <q-item-section>
      <q-item-label>
        {{ to(props.camp.name) }}
      </q-item-label>
    </q-item-section>

    <q-item-section side>
      <div class="q-gutter-xs">
        <q-btn
          v-if="props.active"
          :label="t('action.share')"
          class="gt-xs"
          dense
          flat
          icon="share"
          rounded
          :disable="actionLoading"
          @click="shareAction"
        />

        <q-btn
          v-if="!props.active"
          :label="t('action.enable')"
          class="gt-sm"
          color="warning"
          dense
          flat
          icon="publish"
          rounded
          :loading="enableLoading"
          :disable="actionLoading && !disableLoading"
          @click="enableAction"
        />

        <q-btn
          :label="t('action.results')"
          class="gt-xs"
          dense
          flat
          icon="view_list"
          rounded
          :loading="resultLoading"
          :disable="actionLoading && !resultLoading"
          @click="resultsAction"
        />

        <q-btn
          :label="t('action.edit')"
          class="gt-sm"
          dense
          flat
          icon="edit"
          rounded
          :disable="actionLoading"
          @click="editAction"
        />

        <q-btn
          v-if="props.active"
          :label="t('action.disable')"
          class="gt-sm"
          color="warning"
          dense
          flat
          icon="unpublished"
          rounded
          :loading="disableLoading"
          :disable="actionLoading && !disableLoading"
          @click="disableAction"
        />

        <q-btn
          v-if="!props.active"
          :label="t('action.delete')"
          class="gt-sm"
          color="negative"
          dense
          flat
          icon="delete"
          rounded
          :loading="deleteLoading"
          :disable="actionLoading && !deleteLoading"
          @click="deleteAction"
        />

        <q-btn
          class="lt-md"
          dense
          flat
          icon="more_vert"
          round
          :disable="actionLoading"
        >
          <results-item-menu
            :camp="props.camp"
            :active="props.active"
            @edit="editAction"
            @delete="deleteAction"
            @share="shareAction"
            @results="resultsAction"
            @enable="enableAction"
            @disable="disableAction"
          />
        </q-btn>
      </div>
    </q-item-section>
  </q-item>
</template>

<script lang="ts" setup>
import ResultsItemMenu from 'components/campManagement/index/ResultsItemMenu.vue';
import { useCampsStore } from 'stores/camps-store';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import { copyToClipboard, useQuasar } from 'quasar';
import type { Camp } from '@camp-registration/common/entities';
import { computed, Ref, ref } from 'vue';
import { useAuthStore } from 'stores/auth-store';
import SafeDeleteDialog from 'components/common/dialogs/SafeDeleteDialog.vue';

const capsStore = useCampsStore();
const authStore = useAuthStore();
const router = useRouter();
const quasar = useQuasar();
const { t } = useI18n();
const { to } = useObjectTranslation();

interface Props {
  camp: Camp;
  active?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  active: false,
});

const resultLoading = ref<boolean>(false);
const enableLoading = ref<boolean>(false);
const disableLoading = ref<boolean>(false);
const editLoading = ref<boolean>(false);
const deleteLoading = ref<boolean>(false);

const actionLoading = computed<boolean>(() => {
  return enableLoading.value || disableLoading.value || deleteLoading.value;
});

function resultsAction() {
  withLoading(resultLoading, async () => {
    await router.push({
      name: 'participants',
      params: {
        camp: props.camp.id,
      },
    });
  });
}

function shareAction() {
  const url =
    window.location.origin +
    router.resolve({
      name: 'camp',
      params: {
        camp: props.camp.id,
      },
    }).href;

  copyToClipboard(url)
    .then(() => {
      quasar.notify({
        type: 'positive',
        message: t('notification.share_success'),
        icon: 'assignment_turned_in',
      });
    })
    .catch(() => {
      quasar.notify({
        type: 'negative',
        message: t('notification.share_fail'),
      });
    });
}

function editAction() {
  withLoading(editLoading, async () => {
    await router.push({
      name: 'edit-camp',
      params: {
        camp: props.camp.id,
      },
    });
  });
}

function deleteAction() {
  quasar
    .dialog({
      component: SafeDeleteDialog,
      componentProps: {
        title: t('dialog.delete.title'),
        message: t('dialog.delete.message'),
        label: t('dialog.delete.label'),
        value: to(props.camp.name),
      },
      persistent: true,
    })
    .onOk(() => {
      withLoading(deleteLoading, async () => {
        await capsStore.deleteEntry(props.camp.id);
      });
    });
}

function enableAction() {
  withLoading(enableLoading, async () => {
    await capsStore.updateEntry(props.camp.id, {
      active: true,
    });
    await authStore.fetchUser();
  });
}

function disableAction() {
  withLoading(disableLoading, async () => {
    await capsStore.updateEntry(props.camp.id, {
      active: false,
    });
    await authStore.fetchUser();
  });
}

async function withLoading(flag: Ref<boolean>, fn: () => Promise<void>) {
  flag.value = true;
  await fn();
  flag.value = false;
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
action:
  create: 'Create new'
  delete: 'Delete'
  edit: 'Edit'
  enable: 'Enable'
  results: 'Results'
  share: 'Share'
  disable: 'Disable'

dialog:
  delete:
    title: 'Delete camp'
    message: 'Are you sure you want to delete this camp? All registrations will be lost. This camp cannot be used as a template for future camps.'
    label: 'Camp name'

notification:
  share_success: 'Link copied to clipboard'
  share_fail: 'Failed to copy link to clipboard'
</i18n>

<i18n lang="yaml" locale="de">
action:
  create: 'Neu erstellen'
  delete: 'Löschen'
  edit: 'Bearbeiten'
  enable: 'Aktivieren'
  results: 'Ergebnisse'
  share: 'Teilen'
  disable: 'Deaktivieren'

dialog:
  delete:
    title: 'Lager löschen'
    message: 'Sind Sie sicher, dass Sie dieses Lager löschen möchten? Alle Anmeldungen gehen verloren. Dieses Lager kann nicht als Vorlage für zukünftige Lager verwendet werden.'
    label: 'Lagername'

notification:
  share_success: 'Link in die Zwischenablage kopiert'
  share_fail: 'Fehler beim Kopieren des Links in die Zwischenablage'
</i18n>

<i18n lang="yaml" locale="fr">
action:
  create: 'Créer un nouveau'
  delete: 'Supprimer'
  edit: 'Modifier'
  enable: 'Activer'
  results: 'Résultats'
  share: 'Partager'
  disable: 'Désactiver'

dialog:
  delete:
    title: 'Supprimer le camp'
    message: 'Êtes-vous sûr de vouloir supprimer ce camp ? Toutes les inscriptions seront perdues. Ce camp ne peut pas être utilisé comme modèle pour les camps futurs.'
    label: 'Nom du camp'

notification:
  share_success: 'Lien copié dans le presse-papiers'
  share_fail: 'Échec de la copie du lien dans le presse-papiers'
</i18n>
