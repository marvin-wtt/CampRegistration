<template>
  <div class="q-gutter-md q-pa-md">
    <template v-if="user">
      <export-data-settings-card @export="exportData" />

      <q-separator inset />

      <delete-account-settings-card @delete="deleteProfile" />
    </template>

    <q-inner-loading
      v-else
      color="primary"
      size="xl"
      showing
    />
  </div>
</template>

<script lang="ts" setup>
import { useProfileStore } from 'stores/profile-store';
import { useQuasar } from 'quasar';
import DeleteAccountSettingsCard from 'components/settings/DeleteAccountlSettingsCard.vue';
import { storeToRefs } from 'pinia';
import ExportDataSettingsCard from 'components/settings/ExportDataSettingsCard.vue';
import SafeDeleteDialog from 'components/common/dialogs/SafeDeleteDialog.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const quasar = useQuasar();
const profileStore = useProfileStore();
const { user } = storeToRefs(profileStore);

function deleteProfile() {
  quasar
    .dialog({
      component: SafeDeleteDialog,
      componentProps: {
        title: t('delete.title'),
        message: t('delete.message'),
        value: user.value?.email,
        label: t('delete.label'),
      },
    })
    .onOk(() => {
      profileStore.deleteProfile();
    });
}

function exportData() {
  // TODO
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
delete:
  title: 'Permanently delete your account'
  message: 'Are you sure you want to delete your account? This action is irreversible.'
  label: 'E-Mail'
</i18n>

<i18n lang="yaml" locale="de">
delete:
  title: 'Ihr Konto dauerhaft löschen'
  message: 'Sind Sie sicher, dass Sie Ihr Konto löschen möchten? Diese Aktion ist endgültig.'
  label: 'E-Mail'
</i18n>

<i18n lang="yaml" locale="fr">
delete:
  title: 'Supprimer définitivement votre compte'
  message: 'Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.'
  label: 'E-mail'
</i18n>
