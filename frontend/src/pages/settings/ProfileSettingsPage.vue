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
                name="badge"
                color="primary"
                size="20px"
              />
              <div class="text-subtitle2 text-weight-bold">
                {{ t('section.details.title') }}
              </div>
            </div>
            <div class="text-body2 text-on-surface-variant q-mt-xs">
              {{ t('section.details.hint') }}
            </div>
          </q-card-section>

          <profile-settings-card
            :profile="user"
            @save="updateProfile"
          />
        </q-card>

        <q-card
          flat
          bordered
          class="rounded-lg"
        >
          <q-card-section class="q-pb-none">
            <div class="row items-center no-wrap q-gutter-sm">
              <q-icon
                name="email"
                color="primary"
                size="20px"
              />
              <div class="text-subtitle2 text-weight-bold">
                {{ t('section.email.title') }}
              </div>
            </div>
            <div class="text-body2 text-on-surface-variant q-mt-xs">
              {{ t('section.email.hint') }}
            </div>
          </q-card-section>

          <email-settings-card
            :profile="user"
            @save="updateProfile"
          />
        </q-card>
      </template>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import type { ProfileUpdateData } from '@camp-registration/common/entities';
import { useProfileStore } from '@/stores/profile-store';
import { storeToRefs } from 'pinia';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import ProfileSettingsCard from '@/components/settings/ProfileSettingsCard.vue';
import EmailSettingsCard from '@/components/settings/EmailSettingsCard.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const profileStore = useProfileStore();
const { user, loading, error } = storeToRefs(profileStore);

function updateProfile(data: ProfileUpdateData) {
  void profileStore.updateProfile(data);
}
</script>

<style lang="scss" scoped>
.settings-shell {
  max-width: 60rem;
}
</style>

<i18n lang="yaml" locale="en">
title: 'Profile'
subtitle: 'How your account appears and how we reach you.'

section:
  details:
    title: 'Personal details'
    hint: 'Your name is shown to other members of events you manage.'
  email:
    title: 'E-mail address'
    hint: 'Used to sign in and to receive notifications. Changing it requires your password.'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Profil'
subtitle: 'Wie Ihr Konto erscheint und wie wir Sie erreichen.'

section:
  details:
    title: 'Persönliche Angaben'
    hint: 'Ihr Name wird anderen Mitgliedern der von Ihnen verwalteten Events angezeigt.'
  email:
    title: 'E-Mail-Adresse'
    hint: 'Wird zur Anmeldung und für Benachrichtigungen verwendet. Für eine Änderung ist Ihr Passwort erforderlich.'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Profil'
subtitle: 'L’apparence de votre compte et la manière dont nous vous contactons.'

section:
  details:
    title: 'Informations personnelles'
    hint: 'Votre nom est visible par les autres membres des events que vous gérez.'
  email:
    title: 'Adresse e-mail'
    hint: 'Utilisée pour vous connecter et recevoir des notifications. Sa modification nécessite votre mot de passe.'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Profil'
subtitle: 'Jak wygląda Twoje konto i jak możemy się z Tobą skontaktować.'

section:
  details:
    title: 'Dane osobowe'
    hint: 'Twoja nazwa jest widoczna dla innych członków obozów, którymi zarządzasz.'
  email:
    title: 'Adres e-mail'
    hint: 'Służy do logowania i otrzymywania powiadomień. Zmiana wymaga podania hasła.'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Profil'
subtitle: 'Jak vypadá váš účet a jak vás můžeme kontaktovat.'

section:
  details:
    title: 'Osobní údaje'
    hint: 'Vaše jméno se zobrazuje ostatním členům táborů, které spravujete.'
  email:
    title: 'E-mailová adresa'
    hint: 'Slouží k přihlášení a k zasílání oznámení. Změna vyžaduje vaše heslo.'
</i18n>
