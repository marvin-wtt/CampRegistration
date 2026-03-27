<template>
  <div class="row justify-center q-pa-xl">
    <div class="column col-sm-6 col-md-5 col-lg-4 col-12 items-center">
      <template v-if="loading">
        <q-spinner
          color="primary"
          size="3em"
        />
      </template>

      <template v-else-if="success">
        <q-icon
          name="check_circle"
          color="positive"
          size="5rem"
          class="q-mb-md"
        />
        <div class="text-h6 text-center">{{ t('success.title') }}</div>
        <div class="text-body2 text-grey text-center q-mt-sm">
          {{ t('success.message') }}
        </div>
      </template>

      <template v-else-if="error">
        <q-icon
          name="error"
          color="negative"
          size="5rem"
          class="q-mb-md"
        />
        <div class="text-h6 text-center">{{ t('error.title') }}</div>
        <div class="text-body2 text-grey text-center q-mt-sm">
          {{ t('error.message') }}
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useAPIService } from 'src/services/APIService';

const { t } = useI18n();
const route = useRoute();
const api = useAPIService();

const loading = ref(true);
const success = ref(false);
const error = ref(false);

onMounted(async () => {
  const token = route.params.token as string;
  try {
    await api.unsubscribeByToken(token);
    success.value = true;
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
});
</script>

<i18n lang="yaml" locale="en">
success:
  title: 'Successfully Unsubscribed'
  message: 'You have been successfully removed from the newsletter. You will no longer receive emails from this newsletter.'
error:
  title: 'Unsubscribe Failed'
  message: 'The unsubscribe link is invalid or has already been used. You may have already been unsubscribed.'
</i18n>

<i18n lang="yaml" locale="de">
success:
  title: 'Erfolgreich abgemeldet'
  message: 'Sie wurden erfolgreich vom Newsletter abgemeldet. Sie erhalten keine weiteren E-Mails von diesem Newsletter.'
error:
  title: 'Abmeldung fehlgeschlagen'
  message: 'Der Abmelde-Link ist ungültig oder wurde bereits verwendet. Möglicherweise sind Sie bereits abgemeldet.'
</i18n>

<i18n lang="yaml" locale="fr">
success:
  title: 'Désinscription réussie'
  message: 'Vous avez été désinscrit(e) avec succès de la newsletter. Vous ne recevrez plus d''e-mails de cette newsletter.'
error:
  title: 'Échec de la désinscription'
  message: 'Le lien de désinscription est invalide ou a déjà été utilisé. Vous êtes peut-être déjà désinscrit(e).'
</i18n>

<i18n lang="yaml" locale="pl">
success:
  title: 'Pomyślnie wypisano'
  message: 'Zostałeś/-aś pomyślnie wypisany/-a z newslettera. Nie będziesz już otrzymywać wiadomości z tego newslettera.'
error:
  title: 'Wypisanie nie powiodło się'
  message: 'Link do wypisania jest nieprawidłowy lub został już użyty. Możliwe, że jesteś już wypisany/-a.'
</i18n>

<i18n lang="yaml" locale="cs">
success:
  title: 'Odhlášení proběhlo úspěšně'
  message: 'Byli jste úspěšně odhlášeni z odběru newsletteru. Již nebudete dostávat e-maily z tohoto newsletteru.'
error:
  title: 'Odhlášení se nezdařilo'
  message: 'Odkaz pro odhlášení je neplatný nebo již byl použit. Možná jste již odhlášeni.'
</i18n>

<style scoped></style>
