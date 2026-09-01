<template>
  <page-state-handler
    padding
    :loading
    :error
    class="row justify-center"
  >
    <div class="settings-shell column col-12 col-sm-10 col-md-8 q-gutter-md">
      <div class="page-title">
        <div class="text-h5 text-weight-medium">{{ t('title') }}</div>
        <div class="text-body2 text-on-surface-variant q-mt-xs">
          {{ t('subtitle') }}
        </div>
      </div>

      <template v-if="user">
        <q-card
          flat
          bordered
          class="rounded-lg"
        >
          <q-card-section class="q-pb-none">
            <div class="row items-center no-wrap q-gutter-sm">
              <q-icon
                name="download"
                color="primary"
                size="20px"
              />
              <div class="text-subtitle2 text-weight-bold">
                {{ t('section.export.title') }}
              </div>
            </div>
          </q-card-section>

          <export-data-settings-card @export="exportData" />
        </q-card>

        <delete-account-settings-card @delete="deleteProfile" />
      </template>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { useProfileStore } from '@/stores/profile-store';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import DeleteAccountSettingsCard from '@/components/settings/DeleteAccountlSettingsCard.vue';
import ExportDataSettingsCard from '@/components/settings/ExportDataSettingsCard.vue';
import SafeDeleteDialog from '@/components/common/dialogs/SafeDeleteDialog.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const quasar = useQuasar();
const profileStore = useProfileStore();
const { user, loading, error } = storeToRefs(profileStore);

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
      void profileStore.deleteProfile();
    });
}

function exportData() {
  // TODO
}
</script>

<style lang="scss" scoped>
.settings-shell {
  max-width: 60rem;
}
</style>

<i18n lang="yaml" locale="en">
title: 'Account'
subtitle: 'Your data and what happens to this account.'

section:
  export:
    title: 'Export data'

delete:
  title: 'Permanently delete your account'
  message: 'Are you sure you want to delete your account? This action is irreversible.'
  label: 'E-Mail'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Konto'
subtitle: 'Ihre Daten und was mit diesem Konto geschieht.'

section:
  export:
    title: 'Daten exportieren'

delete:
  title: 'Ihr Konto dauerhaft löschen'
  message: 'Sind Sie sicher, dass Sie Ihr Konto löschen möchten? Diese Aktion ist endgültig.'
  label: 'E-Mail'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Compte'
subtitle: 'Vos données et le devenir de ce compte.'

section:
  export:
    title: 'Exporter les données'

delete:
  title: 'Supprimer définitivement votre compte'
  message: 'Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.'
  label: 'E-mail'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Konto'
subtitle: 'Twoje dane i przyszłość tego konta.'

section:
  export:
    title: 'Eksport danych'

delete:
  title: 'Trwale usuń swoje konto'
  message: 'Czy na pewno chcesz usunąć swoje konto? Ta operacja jest nieodwracalna.'
  label: 'E-mail'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Účet'
subtitle: 'Vaše data a co se stane s tímto účtem.'

section:
  export:
    title: 'Export dat'

delete:
  title: 'Trvale odstranit účet'
  message: 'Opravdu chcete odstranit svůj účet? Tato akce je nevratná.'
  label: 'E-mail'
</i18n>
