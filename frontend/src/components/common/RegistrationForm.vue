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
            :icon="submitState !== 'saving' ? badgeIcon : undefined"
            class="registration-submit-status__badge"
          >
            <q-spinner
              v-if="submitState === 'saving'"
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

        <q-card-section v-if="submitState === 'success' && submittedData">
          <registration-copy-download
            :event-details="props.eventDetails"
            :data="submittedData"
            :locale="submittedLocale || locale"
          />
        </q-card-section>

        <q-card-actions
          v-if="submitState === 'success'"
          align="center"
          class="q-gutter-sm q-pb-md"
        >
          <m-btn
            outline
            primary
            icon="person_add"
            :label="t('complete.registerAnother')"
            :to="{
              name: 'event',
              params: { eventId: props.eventDetails.id },
            }"
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
      v-if="submitState === null && submitted && submittedData"
      class="row justify-center q-pa-md"
    >
      <q-card
        flat
        class="registration-copy-card rounded-xl elevation-1"
      >
        <q-card-section>
          <registration-copy-download
            :event-details="props.eventDetails"
            :data="submittedData"
            :locale="submittedLocale || locale"
          />
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script lang="ts" setup>
import 'survey-core/survey-core.min.css';

import { useI18n } from 'vue-i18n';
import { createMarkdownConverter } from '@/utils/markdown';
import {
  computed,
  onMounted,
  ref,
  toRaw,
  toRef,
  watch,
  watchEffect,
} from 'vue';
import { SurveyModel } from 'survey-core';
import { SurveyComponent } from 'survey-vue3-ui';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import RegistrationCopyDownload from '@/components/common/RegistrationCopyDownload.vue';
import {
  startAutoDataUpdate,
  startAutoThemeUpdate,
  addFileSlotResolver,
} from '@/composables/survey';
import type { EventDetails } from '@camp-registration/common/entities';
import { useAPIService } from '@/services/APIService';
import { useErrorExtractor } from '@/composables/serviceHandler';

const mdConverter = createMarkdownConverter();

const { locale, t } = useI18n();
const api = useAPIService();
const { extractErrorText } = useErrorExtractor();

interface Props {
  data?: object;
  eventDetails: EventDetails;
  submitFn?: (
    id: string,
    formData: Record<string, unknown>,
    locale: string,
  ) => Promise<void>;
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
}>();

// Submit lifecycle shown by the custom overlay. While it is non-null the
// survey (including its own completed page) is hidden and this UI takes over.
const submitState = ref<'saving' | 'success' | 'error' | null>(null);
const submitError = ref<string>();
// Stays true once the submission succeeded, including when survey-core takes
// the screen back over to show the form's own completed page.
const submitted = ref<boolean>(false);
// Snapshot of what was actually submitted. The registrant's copy is generated
// from this rather than from the live model, which `retrySubmit` may clear.
const submittedData = ref<Record<string, unknown>>();
const submittedLocale = ref<string>();

// Lets the page hide anything that only applies while the form is being
// filled in — the privacy disclosure above all.
watch([submitState, submitted], ([state, done]) =>
  emit('activeChange', state === null && !done),
);

const statusTitle = computed(() => {
  switch (submitState.value) {
    case 'saving':
      return t('submit.saving.title');
    case 'success':
      return t('complete.title');
    case 'error':
      return t('submit.error.title');
    default:
      return '';
  }
});

const statusText = computed(() => {
  switch (submitState.value) {
    case 'saving':
      return t('submit.saving.text');
    case 'success':
      return t('complete.text');
    case 'error':
      return t('submit.error.text');
    default:
      return '';
  }
});

const badgeColor = computed(() => {
  switch (submitState.value) {
    case 'success':
      return 'positive-container';
    case 'error':
      return 'error-container';
    default:
      return 'primary-container';
  }
});

const badgeTextColor = computed(() => {
  switch (submitState.value) {
    case 'success':
      return 'on-positive-container';
    case 'error':
      return 'on-error-container';
    default:
      return 'on-primary-container';
  }
});

const badgeIcon = computed(() =>
  submitState.value === 'success' ? 'check_circle' : 'error',
);

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
model.mode = props.readonly ? 'display' : 'edit';
if (props.data) {
  model.data = props.data;
  mapFileIdToFileContent(model);
}

const bgColor = ref<string>();

const eventData = toRef(props.eventDetails);

watchEffect(() => {
  emit('bgColorUpdate', bgColor.value);
});

onMounted(() => {
  // Auto variables update on locale change
  startAutoDataUpdate(model, eventData);
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

  // When the form defines its own completed page we let survey-core render it;
  // otherwise the default success UI is a Vue panel (see submitState) rather
  // than survey-core's built-in "Thank you" text.
  const hasFormCompletedHtml = hasCustomCompletedHtml(form);

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
      options.callback('error');
      return;
    }

    try {
      interface FileOption {
        file: Pick<File, 'name' | 'type' | 'size'>;
        content?: unknown;
      }

      const fileUploads = options.files.map(async (file) => {
        const name = await uploadFileFn(file);

        return new File([file], name, {
          type: file.type,
          lastModified: file.lastModified,
        });
      });

      const files = await Promise.all(fileUploads);

      const readFileAsync = async (file: File): Promise<FileOption> => {
        const textContent = await readFile(file);
        return {
          file: { name: file.name, type: file.type, size: file.size },
          content: textContent,
        };
      };

      const fileOptions: FileOption[] = await Promise.all<FileOption>(
        files.map((file) => readFileAsync(file)),
      );

      options.callback('success', fileOptions);
    } catch {
      options.callback('error');
    }
  });
  // Remove file from storage
  survey.onClearFiles.add((_, options) => {
    // Files cannot be deleted as the user has no permissions to do so.
    // Files will be deleted eventually by a cleanup job
    options.callback('success');
  });
  // Convert markdown to html
  survey.onTextMarkdown.add((_, options) => {
    // Remove root paragraphs <p></p>
    options.html = mdConverter.renderInline(options.text);
  });
  // Workaround for date input for Safari < 4.1
  survey.onAfterRenderPage.add((_, options) => {
    const dateInputs: NodeListOf<HTMLInputElement> =
      options.htmlElement.querySelectorAll('input[type=date]');
    dateInputs.forEach((input) => {
      input.placeholder = 'yyyy-mm-dd';
    });
  });

  // Resolve {_file.<slot>} placeholders to locale-aware file URLs on demand.
  addFileSlotResolver(survey, eventId, api);

  // Send data to server. The saving/error UI is rendered by the Vue overlay
  // (see submitState), so the survey's own completed page stays hidden until
  // the submission actually succeeds.
  survey.onComplete.add(async (sender) => {
    const submitFn = props.submitFn;
    if (!submitFn) {
      return;
    }

    submitError.value = undefined;
    submitState.value = 'saving';

    mapFileQuestionValues(sender);

    try {
      await submitFn(eventId, sender.data ?? {}, sender.locale);
      submittedData.value = structuredClone(toRaw(sender.data ?? {}));
      submittedLocale.value = sender.locale;
      submitted.value = true;
      if (sender.showCompletePage && hasFormCompletedHtml) {
        // Reveal the form-defined completed page (survey-core shows it by
        // default; the survey element is unhidden as submitState clears).
        submitState.value = null;
        sender.render();
      } else {
        submitState.value = 'success';
      }
    } catch (e: unknown) {
      submitError.value = extractErrorText(e);
      submitState.value = 'error';
    }
  });

  return survey;
}

function retrySubmit() {
  if (model.state !== 'completed') {
    return;
  }
  model.clear(false, false);
  model.doComplete();
}

function hasCustomCompletedHtml(form: object): boolean {
  return (
    'completedHtml' in form &&
    typeof form.completedHtml === 'string' &&
    form.completedHtml.length > 0
  );
}

function readFile(file: File) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = () => {
      resolve(fileReader.result);
    };
    fileReader.onerror = reject;
    fileReader.readAsDataURL(file);
  });
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

      const url = file.match(/^https?:\/\//)
        ? file
        : `${window.origin}/api/v1/files/${file}`;

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
submit:
  saving:
    title: 'Submitting registration'
    text: 'Please wait while your registration is being saved.'
  error:
    title: 'Registration failed'
    text: 'Your registration could not be saved. Please try again.'
    retry: 'Try again'
complete:
  title: 'Registration complete!'
  text: "Thanks for signing up — we've received your registration and can't wait to see you at event."
  registerAnother: 'Register another person'
  exploreEvents: 'Explore other events'
</i18n>

<i18n lang="yaml" locale="de">
submit:
  saving:
    title: 'Anmeldung wird gesendet'
    text: 'Bitte warte, während deine Anmeldung gespeichert wird.'
  error:
    title: 'Anmeldung fehlgeschlagen'
    text: 'Deine Anmeldung konnte nicht gespeichert werden. Bitte versuche es erneut.'
    retry: 'Erneut versuchen'
complete:
  title: 'Anmeldung abgeschlossen!'
  text: 'Danke für deine Anmeldung — wir haben sie erhalten und freuen uns schon darauf, dich bei der Veranstaltung zu begrüßen.'
  registerAnother: 'Weitere Person anmelden'
  exploreEvents: 'Weitere Veranstaltungen entdecken'
</i18n>

<i18n lang="yaml" locale="fr">
submit:
  saving:
    title: "Envoi de l'inscription"
    text: "Veuillez patienter pendant l'enregistrement de votre inscription."
  error:
    title: "Échec de l'inscription"
    text: "Votre inscription n'a pas pu être enregistrée. Veuillez réessayer."
    retry: 'Réessayer'
complete:
  title: 'Inscription terminée !'
  text: "Merci pour ton inscription — nous l'avons bien reçue et avons hâte de te voir au événement."
  registerAnother: 'Inscrire une autre personne'
  exploreEvents: "Découvrir d'autres événements"
</i18n>

<i18n lang="yaml" locale="pl">
submit:
  saving:
    title: 'Wysyłanie rejestracji'
    text: 'Poczekaj, trwa zapisywanie rejestracji.'
  error:
    title: 'Rejestracja nie powiodła się'
    text: 'Nie udało się zapisać rejestracji. Spróbuj ponownie.'
    retry: 'Spróbuj ponownie'
complete:
  title: 'Rejestracja zakończona!'
  text: 'Dziękujemy za rejestrację — otrzymaliśmy Twoje zgłoszenie i nie możemy się doczekać spotkania na tym wydarzeniu.'
  registerAnother: 'Zarejestruj kolejną osobę'
  exploreEvents: 'Odkryj inne wydarzenia'
</i18n>

<i18n lang="yaml" locale="cs">
submit:
  saving:
    title: 'Odesílání registrace'
    text: 'Počkej prosím, než bude registrace uložena.'
  error:
    title: 'Registrace se nezdařila'
    text: 'Registraci se nepodařilo uložit. Zkus to prosím znovu.'
    retry: 'Zkusit znovu'
complete:
  title: 'Registrace dokončena!'
  text: 'Děkujeme za registraci — tvou přihlášku jsme přijali a těšíme se na tebe na táboře.'
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
