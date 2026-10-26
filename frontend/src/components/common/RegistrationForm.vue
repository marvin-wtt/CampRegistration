<template>
  <div>
    <survey-component
      v-if="model"
      v-show="submitState === null"
      id="survey"
      :model="model"
      data-test="registration-form"
    />

    <div
      v-if="submitState !== null"
      class="registration-submit-status row justify-center content-center q-pa-md"
      data-test="registration-submit-status"
    >
      <q-card
        flat
        class="registration-submit-status__card rounded-xl elevation-1"
        :data-test="`registration-submit-status-${submitState}`"
      >
        <q-card-section class="column items-center q-gutter-y-sm text-center">
          <q-avatar
            size="88px"
            font-size="44px"
            :color="badgeColor"
            :text-color="badgeTextColor"
            :icon="!isBusy ? badgeIcon : undefined"
            class="registration-submit-status__badge"
          >
            <q-spinner
              v-if="isBusy"
              size="40px"
              :thickness="4"
            />
          </q-avatar>

          <div class="text-h5 text-weight-medium">{{ statusTitle }}</div>
          <p class="text-body1 text-on-surface-variant q-mb-none">
            {{ statusText }}
          </p>
        </q-card-section>

        <q-card-section
          v-if="submitState === 'error' && submitError"
          class="q-pt-none"
        >
          <q-banner
            dense
            rounded
            class="bg-error-container text-on-error-container text-body2"
          >
            {{ submitError }}
          </q-banner>
        </q-card-section>

        <q-card-section
          v-if="submitState === 'success' && submittedRegistration"
        >
          <registration-copy-download
            :event-details="props.eventDetails"
            :registration="submittedRegistration"
          />
        </q-card-section>

        <q-card-actions
          v-if="submitState === 'redirecting' && payment?.checkoutUrl"
          align="center"
          class="q-pb-md"
        >
          <m-btn
            primary
            icon="payments"
            :label="t('payment.continue')"
            :href="payment.checkoutUrl"
            data-test="registration-payment-continue"
          />
        </q-card-actions>

        <q-card-actions
          v-if="submitState === 'success'"
          align="center"
          class="q-gutter-sm q-pb-md"
        >
          <m-btn
            v-if="payment && submittedRegistration?.status !== 'WAITLISTED'"
            primary
            icon="payments"
            :label="t('payment.pay')"
            :href="payment.pageUrl"
            data-test="registration-payment-page"
          />
          <m-btn
            outline
            primary
            icon="person_add"
            :label="t('complete.registerAnother')"
            data-test="registration-register-another"
            @click="emit('restart')"
          />
          <m-btn
            outline
            primary
            icon="explore"
            :label="t('complete.exploreEvents')"
            :to="{ name: 'events' }"
          />
        </q-card-actions>

        <q-card-actions
          v-else-if="submitState === 'priceChanged'"
          align="center"
          class="q-gutter-sm q-pb-md"
        >
          <m-btn
            primary
            icon="how_to_reg"
            :label="t('submit.priceChanged.confirm', { amount: quotedPrice })"
            data-test="registration-price-confirm"
            @click="confirmServerQuote"
          />
          <m-btn
            outline
            primary
            icon="edit"
            :label="t('submit.priceChanged.back')"
            data-test="registration-price-back"
            @click="backToForm"
          />
        </q-card-actions>

        <q-card-actions
          v-else-if="submitState === 'error'"
          align="center"
          class="q-pb-md"
        >
          <m-btn
            primary
            icon="refresh"
            :label="t('submit.error.retry')"
            data-test="registration-submit-retry"
            @click="retrySubmit"
          />
        </q-card-actions>
      </q-card>
    </div>

    <!-- A form-defined completed page replaces the panel above, so the copy
         offer is rendered alongside it rather than inside it. -->
    <div
      v-if="submitState === null && submitted && submittedRegistration"
      class="row justify-center q-pa-md"
    >
      <q-card
        flat
        class="registration-copy-card rounded-xl elevation-1"
      >
        <q-card-section>
          <registration-copy-download
            :event-details="props.eventDetails"
            :registration="submittedRegistration"
          />
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script lang="ts" setup>
import 'survey-core/survey-core.min.css';

import { useI18n } from 'vue-i18n';
import { computed, onBeforeMount, ref, toRef, watch, watchEffect } from 'vue';
import { SurveyModel } from 'survey-core';
import { SurveyComponent } from 'survey-vue3-ui';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import RegistrationCopyDownload from '@/components/common/RegistrationCopyDownload.vue';
import {
  startAutoDataUpdate,
  startAutoThemeUpdate,
} from '@/composables/survey';
import {
  addFileSlotResolver,
  addMarkdownRenderer,
} from '@/lib/surveyJs/textProcessing';
import { readAsDataURL } from '@/utils/readAsDataURL';
import { emphasizeForwardNavigation } from '@/lib/surveyJs/navigation';
import { addAmountSummary, trackAmountDue } from '@/lib/surveyJs/amountDue';
import type {
  EventDetails,
  Registration,
  RegistrationCreatePaymentMeta,
  RegistrationPriceCheck,
} from '@camp-registration/common/entities';
import { formatMoney } from '@camp-registration/common/utils';
import { useAPIService } from '@/services/APIService';
import { serverQuoteFromPriceChange } from '@/services/RegistrationService';
import { useErrorExtractor } from '@/composables/serviceHandler';

const { locale, t } = useI18n();
const api = useAPIService();
const { extractErrorText } = useErrorExtractor();

/** A submit that also reports the payment step for the submitter. */
export interface RegistrationSubmitResult {
  registration: Registration;
  payment: RegistrationCreatePaymentMeta | null;
}

interface Props {
  data?: object;
  eventDetails: EventDetails;
  // Fixed for the form's lifetime: changing the group needs a new form.
  group?: string | null | undefined;
  submitFn?: (
    id: string,
    formData: Record<string, unknown>,
    locale: string,
    // What the form displayed, for the server to compare — never an amount.
    priceCheck?: RegistrationPriceCheck,
  ) => Promise<Registration | RegistrationSubmitResult | void>;
  uploadFileFn?: (file: File) => Promise<string>;
  moderation?: boolean;
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  moderation: false,
  readonly: false,
});

const emit = defineEmits<{
  (e: 'bgColorUpdate', color: string | undefined): void;
  (e: 'activeChange', active: boolean): void;
  // "Register another person": the page decides what a fresh start means. A
  // link to the event can't, since it usually is the current page already.
  (e: 'restart'): void;
}>();

// Submit lifecycle shown by the custom overlay. While it is non-null the
// survey (including its own completed page) is hidden and this UI takes over.
const submitState = ref<
  'saving' | 'redirecting' | 'success' | 'error' | 'priceChanged' | null
>(null);
// After a price change: the server's amount, which the person confirms.
const serverQuote = ref<number | null>(null);
// Set when the new registration owes money: where to pay, and whether a
// checkout is already waiting (then we redirect straight to it).
const payment = ref<RegistrationCreatePaymentMeta | null>(null);
const submitError = ref<string>();
// Stays true once the submission succeeded, including when survey-core takes
// the screen back over to show the form's own completed page.
const submitted = ref<boolean>(false);
// What the server echoed back for the submission, used to render the
// registrant's copy. Kept separate from the live model, which `retrySubmit`
// may clear.
const submittedRegistration = ref<Registration>();

// Lets the page hide anything that only applies while the form is being
// filled in — the privacy disclosure above all.
watch([submitState, submitted], ([state, done]) =>
  emit('activeChange', state === null && !done),
);

const statusTitle = computed(() => {
  switch (submitState.value) {
    case 'saving':
      return t('submit.saving.title');
    case 'redirecting':
      return t('payment.redirecting.title');
    case 'success':
      switch (submittedRegistration.value?.status) {
        case 'PENDING':
          return t('complete.pending.title');
        case 'WAITLISTED':
          return t('complete.waitlisted.title');
        default:
          return t('complete.title');
      }
    case 'error':
      return t('submit.error.title');
    case 'priceChanged':
      return t('submit.priceChanged.title');
    default:
      return '';
  }
});

const statusText = computed(() => {
  switch (submitState.value) {
    case 'saving':
      return t('submit.saving.text');
    case 'redirecting':
      return t('payment.redirecting.text');
    case 'success':
      switch (submittedRegistration.value?.status) {
        case 'PENDING':
          return t('complete.pending.text');
        case 'WAITLISTED':
          return t('complete.waitlisted.text');
        default:
          return t('complete.text');
      }
    case 'error':
      return t('submit.error.text');
    case 'priceChanged':
      return t('submit.priceChanged.text', { amount: quotedPrice.value });
    default:
      return '';
  }
});

const badgeColor = computed(() => {
  switch (submitState.value) {
    case 'success':
      switch (submittedRegistration.value?.status) {
        case 'PENDING':
          return 'info-container';
        case 'WAITLISTED':
          return 'warning-container';
        default:
          return 'positive-container';
      }
    case 'error':
      return 'error-container';
    case 'priceChanged':
      return 'warning-container';
    default:
      return 'primary-container';
  }
});

const badgeTextColor = computed(() => {
  switch (submitState.value) {
    case 'success':
      switch (submittedRegistration.value?.status) {
        case 'PENDING':
          return 'on-info-container';
        case 'WAITLISTED':
          return 'on-warning-container';
        default:
          return 'on-positive-container';
      }
    case 'error':
      return 'on-error-container';
    case 'priceChanged':
      return 'on-warning-container';
    default:
      return 'on-primary-container';
  }
});

const isBusy = computed<boolean>(
  () => submitState.value === 'saving' || submitState.value === 'redirecting',
);

const badgeIcon = computed(() => {
  if (submitState.value === 'priceChanged') {
    return 'price_change';
  }
  if (submitState.value !== 'success') {
    return 'error';
  }

  switch (submittedRegistration.value?.status) {
    case 'PENDING':
      return 'schedule';
    case 'WAITLISTED':
      return 'hourglass_top';
    default:
      return 'check_circle';
  }
});

// A readonly form reuses the moderation layout (TOC, no validation) and puts
// survey-core into display mode.
const moderationLayout = props.moderation || props.readonly;

const model = createModel(
  props.eventDetails.id,
  moderationLayout
    ? createModerationForm(props.eventDetails.form)
    : props.eventDetails.form,
);
model.validationEnabled = !moderationLayout;
model.readOnly = props.readonly;
if (props.data) {
  model.data = props.data;
  mapFileIdToFileContent(model);
}

// After loading data: assigning `model.data` fires no change event. Managers
// never see the Complete button, so neither needs the total.
const amountShown = moderationLayout
  ? null
  : trackAmountDue(model, props.eventDetails);
if (amountShown) {
  addAmountSummary(model, amountShown);
}

const bgColor = ref<string>();

const eventData = toRef(props.eventDetails);

watchEffect(() => {
  emit('bgColorUpdate', bgColor.value);
});

// Before the first render, not `onMounted`: this is also what puts the event's
// logo on the model, and applying it afterwards renders the header twice — once
// without a logo, once with.
onBeforeMount(() => {
  // Auto variables update on locale change
  startAutoDataUpdate(model, eventData, props.group);
  startAutoThemeUpdate(model, eventData, bgColor);
});

function createModerationForm(form: object) {
  return {
    ...form,
    showTOC: true,
    fitToContainer: true,
  };
}

function createModel(eventId: string, form: object): SurveyModel {
  const survey = new SurveyModel(form);
  survey.locale = locale.value;

  if (moderationLayout) {
    const hideComplete = () => {
      survey.navigationBar.getActionById('sv-nav-complete')?.setVisible(false);
    };
    hideComplete();
    survey.onCurrentPageChanged.add(hideComplete);
  }

  // Handle file uploads
  survey.onUploadFiles.add(async (_, options) => {
    const uploadFileFn = props.uploadFileFn;
    if (!uploadFileFn) {
      options.callback([], [t('upload.unavailable')]);
      return;
    }

    try {
      // The stored value is the server's file name; the local copy is only
      // read back so the question can preview it.
      const files = await Promise.all(
        options.files.map(async (file) => ({
          file: {
            name: await uploadFileFn(file),
            type: file.type,
            size: file.size,
          },
          content: await readAsDataURL(file),
        })),
      );

      options.callback(files);
    } catch (e: unknown) {
      options.callback([], [extractErrorText(e)]);
    }
  });
  // Remove file from storage
  survey.onClearFiles.add((_, options) => {
    // Files cannot be deleted as the user has no permissions to do so.
    // Files will be deleted eventually by a cleanup job
    options.callback('success');
  });
  addMarkdownRenderer(survey);
  addFileSlotResolver(survey, (slot, locale, group) =>
    api.getEventFileSlotUrl(eventId, slot, locale, group),
  );

  emphasizeForwardNavigation(survey);

  // survey-core redirects right after `onComplete` fires, while the submission
  // is still in flight, so the redirect is held until the save succeeded. A
  // manager editing a registration is never sent away.
  let pendingRedirect: string | undefined;
  survey.onNavigateToUrl.add((_, options) => {
    pendingRedirect = props.moderation ? undefined : options.url;
    options.allow = false;
  });

  // Send data to server. The saving/error UI is rendered by the Vue overlay
  // (see submitState), so the survey's own completed page stays hidden until
  // the submission actually succeeds.
  survey.onComplete.add(async (sender) => {
    const submitFn = props.submitFn;
    if (!submitFn) {
      return;
    }

    pendingRedirect = undefined;
    submitError.value = undefined;
    submitState.value = 'saving';
    payment.value = null;

    mapFileQuestionValues(sender);

    // What the summary showed. Only for the server to compare: it charges
    // its own amount, whatever this says.
    const priceCheck =
      serverQuote.value !== null
        ? { displayedTotal: serverQuote.value }
        : amountShown
          ? { displayedTotal: amountShown.amount }
          : undefined;

    try {
      const result = await submitFn(
        eventId,
        sender.data ?? {},
        sender.locale,
        priceCheck,
      );
      const registration =
        result && 'registration' in result ? result.registration : result;
      payment.value =
        result && 'registration' in result ? result.payment : null;
      submittedRegistration.value = registration ?? undefined;
      submitted.value = true;

      // The event charges at registration and a checkout is ready: go there
      // directly. The card stays up with a manual link in case the browser
      // blocks or delays the navigation.
      if (payment.value?.checkoutUrl) {
        submitState.value = 'redirecting';
        window.location.assign(payment.value.checkoutUrl);
        return;
      }

      if (sender.showCompletePage && hasCustomCompletedHtml(sender)) {
        // Reveal the form-defined completed page (survey-core shows it by
        // default; the survey element is unhidden as submitState clears).
        submitState.value = null;
        sender.render();
      } else {
        submitState.value = 'success';
      }
      if (pendingRedirect) {
        redirect(pendingRedirect);
      }
    } catch (e: unknown) {
      const quote = serverQuoteFromPriceChange(e);
      if (quote !== null) {
        serverQuote.value = quote;
        submitState.value = 'priceChanged';
        return;
      }
      submitError.value = extractErrorText(e);
      submitState.value = 'error';
    }
  });

  return survey;
}

const quotedPrice = computed(() =>
  serverQuote.value === null
    ? ''
    : formatMoney(serverQuote.value, props.eventDetails.currency, locale.value),
);

// Resubmits, now confirming the server's amount the person was just shown.
function confirmServerQuote() {
  retrySubmit();
}

function backToForm() {
  serverQuote.value = null;
  model.clear(false, false);
  submitState.value = null;
}

function retrySubmit() {
  if (model.state !== 'completed') {
    return;
  }
  model.clear(false, false);
  model.doComplete();
}

// The URL comes from the form definition, so only web addresses are followed.
function redirect(url: string) {
  let target: URL;
  try {
    target = new URL(url, window.location.href);
  } catch {
    return;
  }

  if (target.protocol === 'http:' || target.protocol === 'https:') {
    window.location.assign(target.href);
  }
}

// When the form defines its own completed page — plain or matched by a
// condition — survey-core renders it; otherwise the Vue panel (see
// submitState) replaces survey-core's built-in "Thank you" text. Both getters
// fall back to that default text, hence the comparisons.
function hasCustomCompletedHtml(survey: SurveyModel): boolean {
  return (
    !survey.locCompletedHtml.isEmpty ||
    survey.renderedCompletedHtml !== survey.completedHtml
  );
}

function mapFileIdToFileContent(survey: SurveyModel) {
  const questions = survey.getAllQuestions(false, undefined, true);
  questions.forEach((question) => {
    if (question.getType() !== 'file') {
      return;
    }

    const mapToContent = (file: unknown) => {
      if (typeof file !== 'string') {
        return file;
      }

      const url = file.match(/^https?:\/\//) ? file : api.getFileUrl(file);

      return {
        name: file,
        type: '',
        content: url,
      };
    };

    if (Array.isArray(question.value)) {
      question.value = question.value.map(mapToContent);
    } else {
      question.value = mapToContent(question.value);
    }
  });
}

function mapFileQuestionValues(survey: SurveyModel) {
  const questions = survey.getAllQuestions(false, undefined, true);
  questions.forEach((question) => {
    if (question.getType() !== 'file') {
      return;
    }

    if (Array.isArray(question.value)) {
      question.value = question.value.map((value) => {
        return isFile(value) ? value.name : value;
      });
    } else {
      question.value = isFile(question.value)
        ? question.value.name
        : question.value;
    }
  });
}

function isFile(file: unknown): file is Pick<File, 'name'> {
  return file != null && typeof file === 'object' && 'name' in file;
}

defineExpose({
  submit: () => model.doComplete(),
});
</script>

<i18n lang="yaml" locale="en">
payment:
  pay: 'Pay now'
  continue: 'Continue to payment'
  redirecting:
    title: 'Registration saved'
    text: 'Taking you to the payment page…'
upload:
  unavailable: 'File uploads are not available here.'
submit:
  saving:
    title: 'Submitting registration'
    text: 'Please wait while your registration is being saved.'
  priceChanged:
    title: 'The price has changed'
    text: 'Registering now costs {amount}. The price changed while the form was open.'
    confirm: 'Register for {amount}'
    back: 'Back to the form'
  error:
    title: 'Registration failed'
    text: 'Your registration could not be saved. Please try again.'
    retry: 'Try again'
complete:
  title: 'Registration complete!'
  text: "Thanks for signing up — we've received your registration and can't wait to see you at the event."
  pending:
    title: 'Registration received!'
    text: 'Your registration is now pending review. We will let you know as soon as it has been processed.'
  waitlisted:
    title: "You're on the waitlist"
    text: 'This event is currently full, so your registration has been placed on the waiting list. We will notify you if a spot opens up.'
  registerAnother: 'Register another person'
  exploreEvents: 'Explore other events'
</i18n>

<i18n lang="yaml" locale="de">
payment:
  pay: 'Jetzt bezahlen'
  continue: 'Weiter zur Zahlung'
  redirecting:
    title: 'Anmeldung gespeichert'
    text: 'Du wirst zur Zahlungsseite weitergeleitet…'
upload:
  unavailable: 'Datei-Uploads sind hier nicht möglich.'
submit:
  saving:
    title: 'Anmeldung wird gesendet'
    text: 'Bitte warte, während deine Anmeldung gespeichert wird.'
  priceChanged:
    title: 'Der Preis hat sich geändert'
    text: 'Die Anmeldung kostet jetzt {amount}. Der Preis hat sich geändert, während das Formular geöffnet war.'
    confirm: 'Für {amount} anmelden'
    back: 'Zurück zum Formular'
  error:
    title: 'Anmeldung fehlgeschlagen'
    text: 'Deine Anmeldung konnte nicht gespeichert werden. Bitte versuche es erneut.'
    retry: 'Erneut versuchen'
complete:
  title: 'Anmeldung abgeschlossen!'
  text: 'Danke für deine Anmeldung — wir haben sie erhalten und freuen uns schon darauf, dich bei der Veranstaltung zu begrüßen.'
  pending:
    title: 'Anmeldung eingegangen!'
    text: 'Deine Anmeldung wird nun geprüft. Wir informieren dich, sobald sie bearbeitet wurde.'
  waitlisted:
    title: 'Du stehst auf der Warteliste'
    text: 'Diese Veranstaltung ist derzeit ausgebucht, daher wurde deine Anmeldung auf die Warteliste gesetzt. Wir benachrichtigen dich, sobald ein Platz frei wird.'
  registerAnother: 'Weitere Person anmelden'
  exploreEvents: 'Weitere Veranstaltungen entdecken'
</i18n>

<i18n lang="yaml" locale="fr">
payment:
  pay: 'Payer maintenant'
  continue: 'Continuer vers le paiement'
  redirecting:
    title: 'Inscription enregistrée'
    text: 'Redirection vers la page de paiement…'
upload:
  unavailable: 'L’envoi de fichiers n’est pas disponible ici.'
submit:
  saving:
    title: "Envoi de l'inscription"
    text: "Veuillez patienter pendant l'enregistrement de votre inscription."
  priceChanged:
    title: 'Le prix a changé'
    text: "L'inscription coûte désormais {amount}. Le prix a changé pendant que le formulaire était ouvert."
    confirm: "S'inscrire pour {amount}"
    back: 'Retour au formulaire'
  error:
    title: "Échec de l'inscription"
    text: "Votre inscription n'a pas pu être enregistrée. Veuillez réessayer."
    retry: 'Réessayer'
complete:
  title: 'Inscription terminée !'
  text: "Merci pour ton inscription — nous l'avons bien reçue et avons hâte de te voir au événement."
  pending:
    title: 'Inscription reçue !'
    text: "Ton inscription est en cours d'examen. Nous te tiendrons informé dès qu'elle aura été traitée."
  waitlisted:
    title: "Tu es sur liste d'attente"
    text: "Cet événement est actuellement complet, ton inscription a donc été placée sur liste d'attente. Nous te préviendrons si une place se libère."
  registerAnother: 'Inscrire une autre personne'
  exploreEvents: "Découvrir d'autres événements"
</i18n>

<i18n lang="yaml" locale="pl">
payment:
  pay: 'Zapłać teraz'
  continue: 'Przejdź do płatności'
  redirecting:
    title: 'Zgłoszenie zapisane'
    text: 'Przekierowujemy Cię na stronę płatności…'
upload:
  unavailable: 'Przesyłanie plików nie jest tu dostępne.'
submit:
  saving:
    title: 'Wysyłanie rejestracji'
    text: 'Poczekaj, trwa zapisywanie rejestracji.'
  priceChanged:
    title: 'Cena się zmieniła'
    text: 'Rejestracja kosztuje teraz {amount}. Cena zmieniła się, gdy formularz był otwarty.'
    confirm: 'Zarejestruj się za {amount}'
    back: 'Wróć do formularza'
  error:
    title: 'Rejestracja nie powiodła się'
    text: 'Nie udało się zapisać rejestracji. Spróbuj ponownie.'
    retry: 'Spróbuj ponownie'
complete:
  title: 'Rejestracja zakończona!'
  text: 'Dziękujemy za rejestrację — otrzymaliśmy Twoje zgłoszenie i nie możemy się doczekać spotkania na tym wydarzeniu.'
  pending:
    title: 'Zgłoszenie otrzymane!'
    text: 'Twoje zgłoszenie oczekuje teraz na weryfikację. Poinformujemy Cię, gdy tylko zostanie rozpatrzone.'
  waitlisted:
    title: 'Jesteś na liście oczekujących'
    text: 'To wydarzenie jest obecnie pełne, więc Twoje zgłoszenie zostało umieszczone na liście oczekujących. Powiadomimy Cię, gdy zwolni się miejsce.'
  registerAnother: 'Zarejestruj kolejną osobę'
  exploreEvents: 'Odkryj inne wydarzenia'
</i18n>

<i18n lang="yaml" locale="cs">
payment:
  pay: 'Zaplatit nyní'
  continue: 'Pokračovat k platbě'
  redirecting:
    title: 'Registrace uložena'
    text: 'Přesměrováváme tě na platební stránku…'
upload:
  unavailable: 'Nahrávání souborů zde není k dispozici.'
submit:
  saving:
    title: 'Odesílání registrace'
    text: 'Počkej prosím, než bude registrace uložena.'
  priceChanged:
    title: 'Cena se změnila'
    text: 'Registrace nyní stojí {amount}. Cena se změnila, zatímco byl formulář otevřený.'
    confirm: 'Zaregistrovat se za {amount}'
    back: 'Zpět k formuláři'
  error:
    title: 'Registrace se nezdařila'
    text: 'Registraci se nepodařilo uložit. Zkus to prosím znovu.'
    retry: 'Zkusit znovu'
complete:
  title: 'Registrace dokončena!'
  text: 'Děkujeme za registraci — tvou přihlášku jsme přijali a těšíme se na tebe na táboře.'
  pending:
    title: 'Registrace přijata!'
    text: 'Tvoje registrace nyní čeká na schválení. Jakmile bude zpracována, dáme ti vědět.'
  waitlisted:
    title: 'Jsi na čekací listině'
    text: 'Tato akce je momentálně plně obsazená, proto byla tvoje registrace zařazena na čekací listinu. Jakmile se uvolní místo, dáme ti vědět.'
  registerAnother: 'Registrovat další osobu'
  exploreEvents: 'Prozkoumat další akcey'
</i18n>

<style lang="scss">
#survey {
  a {
    color: inherit;
    font-weight: bold;
    font-style: oblique;
  }

  .sd-completedpage {
    // survey-core already applies generous top/bottom padding by default
    // (and that's what visually centers the complete page); only the
    // horizontal padding was missing.
    padding-left: 24px;
    padding-right: 24px;
  }
}

.registration-submit-status {
  min-height: 55vh;
}

.registration-submit-status__card {
  width: 100%;
  max-width: 600px;
  padding-top: 24px;

  background-color: var(--md3-surface-container-low);
  color: var(--md3-on-surface);

  animation: registration-submit-rise 0.35s cubic-bezier(0.2, 0, 0, 1) both;
}

// The form's own completed page already fills the screen, so the copy panel
// shown alongside it takes the card's shape without the full-height centering.
.registration-copy-card {
  width: 100%;
  max-width: 600px;

  background-color: var(--md3-surface-container-low);
  color: var(--md3-on-surface);
}

.registration-submit-status__badge {
  animation: registration-submit-pop 0.4s cubic-bezier(0.2, 0.8, 0.2, 1.2) both;
}

@keyframes registration-submit-rise {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes registration-submit-pop {
  0% {
    opacity: 0;
    transform: scale(0.6);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .registration-submit-status__card,
  .registration-submit-status__badge {
    animation: none;
  }
}
</style>
