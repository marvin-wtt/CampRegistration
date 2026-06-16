<template>
  <q-page
    v-if="state !== 'open'"
    class="row items-center justify-center"
    :class="quasar.screen.gt.xs ? 'content-center' : ''"
  >
    <q-spinner
      v-if="state === 'checking'"
      color="primary"
      size="48px"
    />

    <q-card
      v-else
      class="auth-card col-xs-12 col-sm-8 col-md-6 col-lg-4"
      :flat="quasar.screen.lt.sm"
    >
      <div class="auth-card-header">
        <q-avatar
          icon="check_circle"
          color="white"
          text-color="primary"
          size="64px"
          class="auth-card-avatar"
        />
      </div>

      <q-card-section
        class="text-h5 text-weight-bold text-center q-pt-xl q-pb-none"
      >
        {{ t('completed.title') }}
      </q-card-section>

      <q-card-section class="text-center text-body2 text-grey-7">
        {{ t('completed.message') }}
      </q-card-section>

      <q-card-actions class="q-px-md q-pb-lg">
        <q-btn
          :label="t('action.login')"
          color="primary"
          size="lg"
          class="full-width"
          :to="{ name: 'login' }"
          data-test="login"
          rounded
        />
      </q-card-actions>
    </q-card>
  </q-page>

  <registration-form
    v-else
    icon="admin_panel_settings"
    :title="t('title')"
    :subtitle="t('subtitle')"
    :submit-label="t('action.create')"
    :loading="loading"
    :error="error"
    @submit="onSubmit"
  />
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'stores/auth-store';
import { storeToRefs } from 'pinia';
import { isSetupRequired } from 'src/services/SetupService';
import RegistrationForm, {
  type RegistrationCredentials,
} from 'components/auth/RegistrationForm.vue';

const { t } = useI18n();
const quasar = useQuasar();

const authStore = useAuthStore();
const { loading, error } = storeToRefs(authStore);

// 'checking' while we probe status, 'open' to show the form, 'completed' once
// an admin already exists (this page is then a dead end → offer login).
const state = ref<'checking' | 'open' | 'completed'>('checking');

// Suppress any previous errors
authStore.reset();

onMounted(async () => {
  state.value = (await isSetupRequired()) ? 'open' : 'completed';
});

async function onSubmit(credentials: RegistrationCredentials) {
  const outcome = await authStore.setup(
    credentials.name,
    credentials.email,
    credentials.password,
  );

  // An admin was created between page load and submit — switch to the
  // completed state so the user can simply log in.
  if (outcome === 'closed') {
    state.value = 'completed';
  }
}
</script>

<i18n lang="yaml" locale="en">
title: 'Welcome'
subtitle: 'Create the administrator account to finish setting up this instance.'
completed:
  title: 'Setup complete'
  message: 'This instance already has an administrator. Sign in to continue.'
action:
  create: 'Create administrator'
  login: 'Go to login'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Willkommen'
subtitle: 'Erstellen Sie das Administratorkonto, um die Einrichtung abzuschließen.'
completed:
  title: 'Einrichtung abgeschlossen'
  message: 'Diese Instanz hat bereits einen Administrator. Melden Sie sich an, um fortzufahren.'
action:
  create: 'Administrator erstellen'
  login: 'Zur Anmeldung'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Bienvenue'
subtitle: "Créez le compte administrateur pour terminer la configuration de cette instance."
completed:
  title: 'Configuration terminée'
  message: "Cette instance possède déjà un administrateur. Connectez-vous pour continuer."
action:
  create: "Créer l'administrateur"
  login: 'Aller à la connexion'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Witamy'
subtitle: 'Utwórz konto administratora, aby zakończyć konfigurację tej instancji.'
completed:
  title: 'Konfiguracja zakończona'
  message: 'Ta instancja ma już administratora. Zaloguj się, aby kontynuować.'
action:
  create: 'Utwórz administratora'
  login: 'Przejdź do logowania'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Vítejte'
subtitle: 'Vytvořte účet administrátora a dokončete nastavení této instance.'
completed:
  title: 'Nastavení dokončeno'
  message: 'Tato instance již má administrátora. Pro pokračování se přihlaste.'
action:
  create: 'Vytvořit administrátora'
  login: 'Přejít na přihlášení'
</i18n>
