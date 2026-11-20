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

        <template v-else>
          <q-icon
            name="error_outline"
            color="negative"
            size="4rem"
            class="q-mb-md"
          />
          <div class="text-h6 text-weight-medium q-mb-sm">
            {{ t('error.title') }}
          </div>
          <div class="text-body2 text-on-surface-variant">
            {{ t('error.message') }}
          </div>
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
import { useAPIService } from '@/services/APIService';
import type { NewsletterConfirmation } from '@camp-registration/common/entities';

const { t } = useI18n();
const route = useRoute();
const api = useAPIService();

const token = route.params.token as string;
const state = ref<'loading' | 'ready' | 'confirmed' | 'error'>('loading');
const confirmation = ref<NewsletterConfirmation>();
const submitting = ref(false);

async function load() {
  try {
    confirmation.value = await api.fetchNewsletterConfirmation(token);
    state.value = confirmation.value.confirmed ? 'confirmed' : 'ready';
  } catch {
    state.value = 'error';
  }
}

async function confirm() {
  submitting.value = true;
  try {
    await api.requestCsrfToken();
    await api.confirmNewsletterSubscription(token);
    state.value = 'confirmed';
  } catch {
    state.value = 'error';
  } finally {
    submitting.value = false;
  }
}

void load();
</script>

<i18n lang="yaml" locale="en">
ready:
  title: 'Confirm your subscription'
  message: '{organization} would like to add you to their newsletter "{newsletter}". Confirm below to start receiving it.'
  action: 'Confirm subscription'
confirmed:
  title: 'Subscription confirmed'
  message: 'Thank you! You will now receive this newsletter. Every email contains a link to unsubscribe.'
error:
  title: 'Confirmation failed'
  message: 'The confirmation link is invalid or has expired. Ask the sender to add you again.'
</i18n>

<i18n lang="yaml" locale="de">
ready:
  title: 'Bestätige dein Abonnement'
  message: '{organization} möchte dich in den Newsletter „{newsletter}“ aufnehmen. Bestätige unten, um ihn zu erhalten.'
  action: 'Abonnement bestätigen'
confirmed:
  title: 'Abonnement bestätigt'
  message: 'Danke! Du erhältst ab jetzt diesen Newsletter. Jede E-Mail enthält einen Link zum Abmelden.'
error:
  title: 'Bestätigung fehlgeschlagen'
  message: 'Der Bestätigungslink ist ungültig oder abgelaufen. Bitte den Absender, dich erneut hinzuzufügen.'
</i18n>

<i18n lang="yaml" locale="fr">
ready:
  title: 'Confirme ton abonnement'
  message: '{organization} aimerait t’ajouter à sa newsletter « {newsletter} ». Confirme ci-dessous pour commencer à la recevoir.'
  action: 'Confirmer l’abonnement'
confirmed:
  title: 'Abonnement confirmé'
  message: 'Merci ! Tu recevras désormais cette newsletter. Chaque e-mail contient un lien de désinscription.'
error:
  title: 'Échec de la confirmation'
  message: 'Le lien de confirmation est invalide ou a expiré. Demande à l’expéditeur de t’ajouter à nouveau.'
</i18n>

<i18n lang="yaml" locale="pl">
ready:
  title: 'Potwierdź subskrypcję'
  message: '{organization} chce dodać Cię do newslettera „{newsletter}”. Potwierdź poniżej, aby zacząć go otrzymywać.'
  action: 'Potwierdź subskrypcję'
confirmed:
  title: 'Subskrypcja potwierdzona'
  message: 'Dziękujemy! Od teraz będziesz otrzymywać ten newsletter. Każdy e-mail zawiera link do wypisania się.'
error:
  title: 'Potwierdzenie nie powiodło się'
  message: 'Link potwierdzający jest nieprawidłowy lub wygasł. Poproś nadawcę o ponowne dodanie.'
</i18n>

<i18n lang="yaml" locale="cs">
ready:
  title: 'Potvrď odběr'
  message: '{organization} tě chce přidat do newsletteru „{newsletter}“. Potvrď níže a začni ho dostávat.'
  action: 'Potvrdit odběr'
confirmed:
  title: 'Odběr potvrzen'
  message: 'Děkujeme! Od teď budeš dostávat tento newsletter. Každý e-mail obsahuje odkaz pro odhlášení.'
error:
  title: 'Potvrzení se nezdařilo'
  message: 'Potvrzovací odkaz je neplatný nebo vypršel. Požádej odesílatele, aby tě přidal znovu.'
</i18n>

<style scoped>
.confirm-card {
  width: 100%;
  max-width: 440px;
}
</style>
