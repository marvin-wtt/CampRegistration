<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin two-factor-suggestion">
      <q-card-section class="column items-center text-center q-pt-lg">
        <q-avatar
          icon="shield"
          color="primary-container"
          text-color="on-primary-container"
          size="72px"
        />
        <div class="text-h5 text-weight-bold q-mt-md">
          {{ t('title') }}
        </div>
      </q-card-section>

      <q-card-section class="text-body2 text-center q-pt-none">
        {{ t('description') }}
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-checkbox
          v-model="dontRemind"
          :label="t('dontRemind')"
          size="sm"
          dense
        />
      </q-card-section>

      <q-card-actions
        align="right"
        class="q-px-md q-pb-md"
      >
        <q-btn
          :label="t('action.later')"
          color="primary"
          flat
          rounded
          @click="onLater"
        />
        <q-btn
          :label="t('action.enable')"
          color="primary"
          rounded
          @click="onEnable"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDialogPluginComponent } from 'quasar';

const { t } = useI18n();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

const dontRemind = ref<boolean>(false);

function onEnable() {
  onDialogOK({ enable: true, dontRemind: dontRemind.value });
}

function onLater() {
  onDialogOK({ enable: false, dontRemind: dontRemind.value });
}
</script>

<style scoped lang="scss">
.two-factor-suggestion {
  max-width: 420px;
}
</style>

<i18n lang="yaml" locale="en">
title: 'Secure your account'
description: 'Add an extra layer of protection by enabling two-factor
  authentication. It only takes a minute and keeps your account safe even if your
  password is compromised.'
dontRemind: "Don't remind me again"
action:
  enable: 'Enable now'
  later: 'Maybe later'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Schützen Sie Ihr Konto'
description: 'Fügen Sie eine zusätzliche Schutzebene hinzu, indem Sie die
  Zwei-Faktor-Authentifizierung aktivieren. Es dauert nur eine Minute und schützt
  Ihr Konto, selbst wenn Ihr Passwort kompromittiert wird.'
dontRemind: 'Nicht mehr erinnern'
action:
  enable: 'Jetzt aktivieren'
  later: 'Vielleicht später'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Sécurisez votre compte'
description: "Ajoutez une couche de protection supplémentaire en activant
  l'authentification à deux facteurs. Cela ne prend qu'une minute et protège votre
  compte même si votre mot de passe est compromis."
dontRemind: 'Ne plus me rappeler'
action:
  enable: 'Activer maintenant'
  later: 'Plus tard'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Zabezpiecz swoje konto'
description: 'Dodaj dodatkową warstwę ochrony, włączając uwierzytelnianie
  dwuskładnikowe. Zajmuje to tylko chwilę i chroni Twoje konto, nawet jeśli Twoje
  hasło zostanie przejęte.'
dontRemind: 'Nie przypominaj mi ponownie'
action:
  enable: 'Włącz teraz'
  later: 'Może później'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Zabezpečte svůj účet'
description: 'Přidejte další vrstvu ochrany aktivací dvoufázového ověřování.
  Zabere to jen minutu a udrží váš účet v bezpečí, i když bude vaše heslo
  prozrazeno.'
dontRemind: 'Znovu mi nepřipomínat'
action:
  enable: 'Aktivovat nyní'
  later: 'Možná později'
</i18n>
