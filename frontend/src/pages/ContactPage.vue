<template>
  <q-page class="row justify-center q-pa-md">
    <div class="col-12 col-md-8 col-lg-6 q-py-lg">
      <m-btn
        flat
        round
        icon="arrow_back"
        :aria-label="t('back')"
        class="q-mb-md"
        @click="goBack"
      />

      <h1 class="text-h4 q-mt-none q-mb-sm">
        {{ t('title') }}
      </h1>

      <p class="text-body1 text-on-surface-variant q-mb-lg">
        {{ t('caption') }}
      </p>

      <div
        v-if="sent"
        class="contact-success row items-center no-wrap q-pa-md rounded-lg"
        data-test="contact-success"
      >
        <q-icon
          name="check_circle"
          size="md"
          class="q-mr-md"
        />
        <span class="text-body1">{{ t('success') }}</span>
      </div>

      <q-form
        v-else
        class="column q-gutter-md"
        data-test="contact-form"
        @submit="send"
      >
        <q-input
          v-model="name"
          :label="t('name.label')"
          :hint="t('name.hint')"
          autocomplete="name"
          :disable="loading"
          data-test="name"
          outlined
          rounded
        />

        <q-input
          v-model="message"
          :label="t('message.label')"
          type="textarea"
          :disable="loading"
          :rules="[(val?: string) => !!val?.trim() || t('message.required')]"
          autogrow
          input-style="min-height: 8rem"
          data-test="message"
          outlined
          rounded
        />

        <q-input
          v-model="email"
          :label="t('email.label')"
          :hint="t('email.hint')"
          type="email"
          autocomplete="email"
          :disable="loading"
          data-test="email"
          outlined
          rounded
        />

        <div
          v-if="error"
          class="text-negative"
          data-test="error"
        >
          {{ error }}
        </div>

        <div class="row justify-end">
          <m-btn
            :label="t('action.send')"
            type="submit"
            icon="send"
            color="primary"
            :loading
            data-test="submit"
            rounded
            unelevated
          />
        </div>
      </q-form>
    </div>
  </q-page>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMeta } from 'quasar';
import { useRouter } from 'vue-router';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import { useAPIService } from '@/services/APIService';
import { useErrorExtractor } from '@/composables/serviceHandler';

const { t } = useI18n();
const router = useRouter();
const api = useAPIService();
const { extractErrorText } = useErrorExtractor();

const name = ref<string>('');
const message = ref<string>('');
const email = ref<string>('');
const loading = ref<boolean>(false);
const error = ref<string | null>(null);
const sent = ref<boolean>(false);

useMeta(() => {
  return {
    title: t('title'),
    titleTemplate: (pageTitle) => `${pageTitle} | ${t('app_name')}`,
  };
});

async function send() {
  loading.value = true;
  error.value = null;

  try {
    await api.sendFeedback({
      message: message.value,
      name: name.value.trim() || undefined,
      email: email.value.trim() || undefined,
    });
    sent.value = true;
  } catch (err) {
    error.value = extractErrorText(err);
  } finally {
    loading.value = false;
  }
}

function goBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    void router.push('/');
  }
}
</script>

<style scoped>
.contact-success {
  background: var(--md3-positive-container);
  color: var(--md3-on-positive-container);
}
</style>

<i18n lang="yaml" locale="en">
title: 'Contact'
caption: "Questions, feedback or suggestions? We'd love to hear from you."
back: 'Back'
success: 'Thank you! Your message has been sent.'

name:
  label: 'Name'
  hint: 'Optional'

message:
  label: 'Your message'
  required: 'Please enter a message'

email:
  label: 'Email'
  hint: "Optional — add it if you'd like a reply"

action:
  send: 'Send'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Kontakt'
caption: 'Fragen, Feedback oder Vorschläge? Wir freuen uns, von dir zu hören.'
back: 'Zurück'
success: 'Danke! Deine Nachricht wurde gesendet.'

name:
  label: 'Name'
  hint: 'Optional'

message:
  label: 'Deine Nachricht'
  required: 'Bitte gib eine Nachricht ein'

email:
  label: 'E-Mail'
  hint: 'Optional — gib sie an, wenn du eine Antwort möchtest'

action:
  send: 'Senden'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Contact'
caption: 'Des questions, des retours ou des suggestions ? Écris-nous.'
back: 'Retour'
success: 'Merci ! Ton message a été envoyé.'

name:
  label: 'Nom'
  hint: 'Facultatif'

message:
  label: 'Ton message'
  required: 'Merci de saisir un message'

email:
  label: 'E-mail'
  hint: 'Facultatif — indique-le si tu souhaites une réponse'

action:
  send: 'Envoyer'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Kontakt'
caption: 'Pytania, opinie lub sugestie? Chętnie się z Tobą skontaktujemy.'
back: 'Wstecz'
success: 'Dziękujemy! Twoja wiadomość została wysłana.'

name:
  label: 'Imię i nazwisko'
  hint: 'Opcjonalnie'

message:
  label: 'Twoja wiadomość'
  required: 'Wpisz wiadomość'

email:
  label: 'E-mail'
  hint: 'Opcjonalnie — podaj, jeśli chcesz otrzymać odpowiedź'

action:
  send: 'Wyślij'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Kontakt'
caption: 'Máte dotazy, zpětnou vazbu nebo návrhy? Rádi se vám ozveme.'
back: 'Zpět'
success: 'Děkujeme! Vaše zpráva byla odeslána.'

name:
  label: 'Jméno'
  hint: 'Volitelné'

message:
  label: 'Vaše zpráva'
  required: 'Zadejte prosím zprávu'

email:
  label: 'E-mail'
  hint: 'Volitelné — uveďte, pokud chcete odpověď'

action:
  send: 'Odeslat'
</i18n>
