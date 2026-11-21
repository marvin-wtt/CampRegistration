<template>
  <q-page class="row justify-center items-center q-pa-md">
    <q-card
      flat
      bordered
      class="col-12 confirm-card"
    >
      <q-card-section class="text-center q-pa-xl">
        <template v-if="state === 'loading'">
          <q-spinner
            color="primary"
            size="3em"
          />
        </template>

        <!-- Confirming takes a click: mail scanners open links, and some run
             scripts, so loading the page alone must never subscribe anyone. -->
        <template v-else-if="state === 'ready' && confirmation">
          <q-icon
            name="mark_email_unread"
            color="primary"
            size="4rem"
            class="q-mb-md"
          />
          <div class="text-h6 text-weight-medium q-mb-sm">
            {{ t('ready.title') }}
          </div>
          <div class="text-body2 text-on-surface-variant q-mb-lg">
            {{
              t('ready.message', {
                organization: confirmation.organizationName,
                newsletter: confirmation.newsletterName,
              })
            }}
          </div>
          <m-btn
            :label="t('ready.action')"
            :loading="submitting"
            icon="check"
            primary
            no-caps
            data-test="newsletter-confirm"
            @click="confirm"
          />
        </template>

        <template v-else-if="state === 'confirmed'">
          <q-icon
            name="check_circle_outline"
            color="positive"
            size="4rem"
            class="q-mb-md"
          />
          <div class="text-h6 text-weight-medium q-mb-sm">
            {{ t('confirmed.title') }}
          </div>
          <div class="text-body2 text-on-surface-variant">
            {{ t('confirmed.message') }}
          </div>
        </template>

        <template v-else-if="state === 'invalid'">
          <q-icon
            name="error_outline"
            color="negative"
            size="4rem"
            class="q-mb-md"
          />
          <div class="text-h6 text-weight-medium q-mb-sm">
            {{ t('invalid.title') }}
          </div>
          <div class="text-body2 text-on-surface-variant">
            {{ t('invalid.message') }}
          </div>
        </template>

        <!-- The link may still be fine: offer a retry, not a dead end. -->
        <template v-else>
          <q-icon
            name="cloud_off"
            color="negative"
            size="4rem"
            class="q-mb-md"
          />
          <div class="text-h6 text-weight-medium q-mb-sm">
            {{ t('error.title') }}
          </div>
          <div class="text-body2 text-on-surface-variant q-mb-lg">
            {{ t('error.message') }}
          </div>
          <m-btn
            :label="t('error.retry')"
            :loading="submitting"
            icon="refresh"
            primary
            no-caps
            @click="retry"
          />
        </template>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import { isAPIServiceError, useAPIService } from '@/services/APIService';
import type { NewsletterConfirmation } from '@camp-registration/common/entities';

const { t } = useI18n();
const route = useRoute();
const api = useAPIService();

const token = route.params.token as string;
const state = ref<'loading' | 'ready' | 'confirmed' | 'invalid' | 'error'>(
  'loading',
);
const confirmation = ref<NewsletterConfirmation>();
const submitting = ref(false);

async function load() {
  try {
    confirmation.value = await api.fetchNewsletterConfirmation(token);
    state.value = confirmation.value.confirmed ? 'confirmed' : 'ready';
  } catch (error) {
    state.value = failureState(error);
  }
}

async function confirm() {
  submitting.value = true;
  try {
    await api.requestCsrfToken();
    await api.confirmNewsletterSubscription(token);
    state.value = 'confirmed';
  } catch (error) {
    state.value = failureState(error);
  } finally {
    submitting.value = false;
  }
}

function failureState(error: unknown): 'invalid' | 'error' {
  return isAPIServiceError(error) && error.response?.status === 404
    ? 'invalid'
    : 'error';
}

// Retries what failed: loading the details, or the confirmation itself.
function retry() {
  if (confirmation.value) {
    void confirm();
    return;
  }
  state.value = 'loading';
  void load();
}

void load();
</script>

<i18n lang="yaml" locale="en">
ready:
  title: 'Confirm your subscription'
  message: 'You would like to subscribe to the newsletter "{newsletter}" from {organization}. Confirm your subscription to receive news by email from now on.'
  action: 'Confirm subscription'
confirmed:
  title: 'Subscription confirmed'
  message: 'Thank you! You will now receive this newsletter. Every email contains a link to unsubscribe.'
invalid:
  title: 'Confirmation failed'
  message: 'The confirmation link is invalid or has expired. Ask the sender to add you again.'
error:
  title: 'Something went wrong'
  message: 'We could not reach the server. Your link is still valid, please try again.'
  retry: 'Try again'
</i18n>

<i18n lang="yaml" locale="de">
ready:
  title: 'Bestätige dein Abonnement'
  message: 'Du möchtest den Newsletter „{newsletter}“ von {organization} abonnieren. Bestätige deine Anmeldung, um künftig Neuigkeiten per E-Mail zu erhalten.'
  action: 'Abonnement bestätigen'
confirmed:
  title: 'Abonnement bestätigt'
  message: 'Danke! Du erhältst ab jetzt diesen Newsletter. Jede E-Mail enthält einen Link zum Abmelden.'
invalid:
  title: 'Bestätigung fehlgeschlagen'
  message: 'Der Bestätigungslink ist ungültig oder abgelaufen. Bitte den Absender, dich erneut hinzuzufügen.'
error:
  title: 'Etwas ist schiefgelaufen'
  message: 'Der Server war nicht erreichbar. Dein Link ist weiterhin gültig, bitte versuche es erneut.'
  retry: 'Erneut versuchen'
</i18n>

<i18n lang="yaml" locale="fr">
ready:
  title: 'Confirme ton abonnement'
  message: 'Tu souhaites t’abonner à la newsletter « {newsletter} » de {organization}. Confirme ton inscription pour recevoir désormais les nouvelles par e-mail.'
  action: 'Confirmer l’abonnement'
confirmed:
  title: 'Abonnement confirmé'
  message: 'Merci ! Tu recevras désormais cette newsletter. Chaque e-mail contient un lien de désinscription.'
invalid:
  title: 'Échec de la confirmation'
  message: 'Le lien de confirmation est invalide ou a expiré. Demande à l’expéditeur de t’ajouter à nouveau.'
error:
  title: 'Une erreur est survenue'
  message: 'Impossible de joindre le serveur. Ton lien reste valable, réessaie.'
  retry: 'Réessayer'
</i18n>

<i18n lang="yaml" locale="pl">
ready:
  title: 'Potwierdź subskrypcję'
  message: 'Chcesz zapisać się do newslettera „{newsletter}” od {organization}. Potwierdź zapis, aby od teraz otrzymywać nowości e-mailem.'
  action: 'Potwierdź subskrypcję'
confirmed:
  title: 'Subskrypcja potwierdzona'
  message: 'Dziękujemy! Od teraz będziesz otrzymywać ten newsletter. Każdy e-mail zawiera link do wypisania się.'
invalid:
  title: 'Potwierdzenie nie powiodło się'
  message: 'Link potwierdzający jest nieprawidłowy lub wygasł. Poproś nadawcę o ponowne dodanie.'
error:
  title: 'Coś poszło nie tak'
  message: 'Nie udało się połączyć z serwerem. Twój link jest nadal ważny, spróbuj ponownie.'
  retry: 'Spróbuj ponownie'
</i18n>

<i18n lang="yaml" locale="cs">
ready:
  title: 'Potvrď odběr'
  message: 'Chceš odebírat newsletter „{newsletter}“ od {organization}. Potvrď své přihlášení a dostávej od teď novinky e-mailem.'
  action: 'Potvrdit odběr'
confirmed:
  title: 'Odběr potvrzen'
  message: 'Děkujeme! Od teď budeš dostávat tento newsletter. Každý e-mail obsahuje odkaz pro odhlášení.'
invalid:
  title: 'Potvrzení se nezdařilo'
  message: 'Potvrzovací odkaz je neplatný nebo vypršel. Požádej odesílatele, aby tě přidal znovu.'
error:
  title: 'Něco se pokazilo'
  message: 'Nepodařilo se spojit se serverem. Tvůj odkaz je stále platný, zkus to prosím znovu.'
  retry: 'Zkusit znovu'
</i18n>

<style scoped>
.confirm-card {
  width: 100%;
  max-width: 440px;
}
</style>
