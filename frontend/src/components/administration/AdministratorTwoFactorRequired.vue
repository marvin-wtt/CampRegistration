<template>
  <q-page
    padding
    class="row justify-center items-center"
  >
    <div
      class="column items-center q-gutter-y-md text-center content"
      data-test="admin-2fa-required"
    >
      <q-icon
        name="shield"
        size="64px"
        color="primary"
      />
      <div class="text-h5">
        {{ t('title') }}
      </div>
      <div class="text-body2 text-on-surface-variant">
        {{ t('message') }}
      </div>
      <m-btn
        :label="t('action')"
        :to="{ name: 'settings.security' }"
        icon="lock"
        color="primary"
        rounded
        no-caps
      />
    </div>
  </q-page>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';

const { t } = useI18n();
</script>

<style lang="scss" scoped>
.content {
  max-width: 480px;
}
</style>

<i18n lang="yaml" locale="en">
title: 'Two-factor authentication required'
message: 'Administrator access is only available with two-factor authentication. Set it up in your security settings to continue.'
action: 'Set up two-factor authentication'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Zwei-Faktor-Authentifizierung erforderlich'
message: 'Administratorrechte gibt es nur mit Zwei-Faktor-Authentifizierung. Richte sie in deinen Sicherheitseinstellungen ein, um fortzufahren.'
action: 'Zwei-Faktor-Authentifizierung einrichten'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Authentification à deux facteurs requise'
message: "L'accès administrateur n'est disponible qu'avec l'authentification à deux facteurs. Configurez-la dans vos paramètres de sécurité pour continuer."
action: "Configurer l'authentification à deux facteurs"
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Wymagane uwierzytelnianie dwuskładnikowe'
message: 'Dostęp administratora jest dostępny tylko z uwierzytelnianiem dwuskładnikowym. Skonfiguruj je w ustawieniach bezpieczeństwa, aby kontynuować.'
action: 'Skonfiguruj uwierzytelnianie dwuskładnikowe'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Vyžadováno dvoufázové ověřování'
message: 'Přístup administrátora je k dispozici pouze s dvoufázovým ověřováním. Nastavte si ho v nastavení zabezpečení a pokračujte.'
action: 'Nastavit dvoufázové ověřování'
</i18n>
