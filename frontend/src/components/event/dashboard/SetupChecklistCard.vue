<template>
  <q-card
    flat
    bordered
    class="setup-card"
  >
    <q-card-section>
      <dashboard-card-header
        :icon="allDone ? 'task_alt' : 'construction'"
        :tone="allDone ? 'positive' : 'primary'"
        :title="t('title')"
        :caption="
          allDone
            ? t('done')
            : t('progress', { done: doneCount, total: steps.length })
        "
      />
    </q-card-section>

    <q-list class="setup-list">
      <q-item
        v-for="step in steps"
        :key="step.key"
        :to="{ name: step.route }"
        clickable
        class="setup-step"
        :class="{ 'setup-step--done': step.done }"
        :data-test="`dashboard-setup-${step.key}`"
      >
        <q-item-section avatar>
          <q-skeleton
            v-if="step.loading"
            type="circle"
            size="24px"
          />
          <q-icon
            v-else
            :name="step.done ? 'check_circle' : 'radio_button_unchecked'"
            :class="step.done ? 'text-positive' : 'step-icon--open'"
            size="24px"
          />
        </q-item-section>
        <q-item-section>
          <q-item-label class="step-label">{{ step.label }}</q-item-label>
          <q-item-label caption>{{ step.hint }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon
            name="chevron_right"
            size="18px"
          />
        </q-item-section>
      </q-item>
    </q-list>

    <q-card-section
      v-if="suggestions.length > 0"
      class="suggestions q-pt-none"
    >
      <div class="section-label">{{ t('optional') }}</div>
      <q-list class="suggestion-list">
        <q-item
          v-for="suggestion in suggestions"
          :key="suggestion.key"
          :to="{ name: suggestion.route }"
          clickable
          class="suggestion"
          :data-test="`dashboard-setup-${suggestion.key}`"
        >
          <q-item-section avatar>
            <q-icon
              :name="suggestion.icon"
              size="22px"
              class="suggestion-icon"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label class="step-label">{{
              suggestion.label
            }}</q-item-label>
            <q-item-label caption>{{ suggestion.hint }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon
              name="chevron_right"
              size="18px"
            />
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>
  </q-card>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { EventDetails } from '@camp-registration/common/entities';
import DashboardCardHeader from '@/components/event/dashboard/DashboardCardHeader.vue';
import { useEventFilesStore } from '@/stores/event-files-store';
import { usePermissions } from '@/composables/permissions';
import type { PermissionRequirement } from '@/composables/scopePermissions';

// Steps the manager cannot act on are left out.
const { event } = defineProps<{
  event: EventDetails;
}>();

const { t } = useI18n();
const { canAccess } = usePermissions();
const eventFilesStore = useEventFilesStore();

interface SetupStep {
  key: string;
  label: string;
  hint: string;
  route: string;
  done: boolean;
  loading: boolean;
  permission: PermissionRequirement<'event'>;
}

const steps = computed(() =>
  (
    [
      {
        key: 'window',
        label: t('step.window.label'),
        hint: t('step.window.hint'),
        route: 'management.event.settings.edit',
        done: !!(event.registrationOpensAt || event.registrationClosesAt),
        loading: false,
        permission: 'event.edit',
      },
      {
        key: 'files',
        label: t('step.files.label'),
        hint: t('step.files.hint'),
        route: 'management.event.settings.files',
        done: eventFilesStore.missingFilesCount === 0,
        loading: eventFilesStore.isLoading,
        permission: 'event.files.view',
      },
    ] satisfies SetupStep[]
  ).filter((step) => canAccess(step.permission)),
);

interface Suggestion {
  key: string;
  label: string;
  hint: string;
  icon: string;
  route: string;
  permission: PermissionRequirement<'event'>;
}

// Worth a look but never required, so they don't count towards progress: every
// event starts with a form (from a preset or the reference event).
const suggestions = computed(() =>
  (
    [
      {
        key: 'form',
        label: t('suggestion.form.label'),
        hint: t('suggestion.form.hint'),
        icon: 'edit_note',
        route: 'management.event.settings.form',
        permission: { all: ['event.edit', 'event.files.view'] },
      },
      {
        key: 'emails',
        label: t('suggestion.emails.label'),
        hint: t('suggestion.emails.hint'),
        icon: 'forward_to_inbox',
        route: 'management.event.settings.emails',
        permission: {
          any: [
            'event.message_templates.edit',
            'event.message_templates.create',
          ],
        },
      },
      {
        key: 'access',
        label: t('suggestion.access.label'),
        hint: t('suggestion.access.hint'),
        icon: 'group_add',
        route: 'management.event.settings.access',
        permission: 'event.managers.create',
      },
    ] satisfies Suggestion[]
  ).filter((suggestion) => canAccess(suggestion.permission)),
);

const doneCount = computed<number>(
  () => steps.value.filter((step) => step.done && !step.loading).length,
);

const allDone = computed<boolean>(() => doneCount.value === steps.value.length);
</script>

<style scoped>
.setup-card {
  border-radius: 16px;
}

.setup-list {
  padding: 0 8px 8px;
}

.setup-step {
  border-radius: 12px;
}

.step-label {
  font-weight: 500;
}

.setup-step--done .step-label {
  color: var(--md3-on-surface-variant);
}

.step-icon--open {
  color: var(--md3-outline);
}

.section-label {
  margin: 0 8px 4px;
  color: var(--md3-on-surface-variant);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.suggestions {
  padding-right: 8px;
  padding-left: 8px;
}

.suggestion-list {
  display: grid;
  gap: 6px;
}

.suggestion {
  border-radius: 12px;
}

.suggestion-icon {
  color: var(--md3-primary);
}
</style>

<i18n lang="yaml" locale="en">
title: 'Get ready to open registration'
progress: '{done} of {total} steps done'
done: 'Everything is set up'
optional: 'Optional'
suggestion:
  form:
    label: 'Review the registration form'
    hint: 'It was copied from a preset or an earlier event — adjust it to this one'
  emails:
    label: 'Review the automated emails'
    hint: 'Confirmations and other emails sent on your behalf'
  access:
    label: 'Give your team access'
    hint: 'Invite co-organizers to help manage the event'
step:
  window:
    label: 'Set the registration window'
    hint: 'When people can sign up'
  files:
    label: 'Upload the event files'
    hint: 'Files the form and emails refer to'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Bereit für die Anmeldung'
progress: '{done} von {total} Schritten erledigt'
done: 'Alles ist eingerichtet'
optional: 'Optional'
suggestion:
  form:
    label: 'Anmeldeformular prüfen'
    hint: 'Es stammt aus einer Vorlage oder einer früheren Veranstaltung – passe es an diese an'
  emails:
    label: 'Automatische E-Mails prüfen'
    hint: 'Bestätigungen und weitere E-Mails, die in deinem Namen verschickt werden'
  access:
    label: 'Team Zugriff geben'
    hint: 'Lade Mitorganisierende ein, die Veranstaltung mitzuverwalten'
step:
  window:
    label: 'Anmeldezeitraum festlegen'
    hint: 'Wann man sich anmelden kann'
  files:
    label: 'Dateien hochladen'
    hint: 'Dateien, auf die Formular und E-Mails verweisen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Prêt à ouvrir les inscriptions'
progress: '{done} étapes sur {total} terminées'
done: 'Tout est configuré'
optional: 'Facultatif'
suggestion:
  form:
    label: "Vérifier le formulaire d'inscription"
    hint: "Il provient d'un modèle ou d'un événement précédent — adapte-le à celui-ci"
  emails:
    label: 'Vérifier les e-mails automatiques'
    hint: 'Confirmations et autres e-mails envoyés en ton nom'
  access:
    label: 'Donner accès à ton équipe'
    hint: "Invite des co-organisateurs à gérer l'événement avec toi"
step:
  window:
    label: "Définir la période d'inscription"
    hint: "Quand on peut s'inscrire"
  files:
    label: "Téléverser les fichiers de l'événement"
    hint: 'Fichiers auxquels renvoient le formulaire et les e-mails'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Przygotuj otwarcie rejestracji'
progress: 'Ukończono {done} z {total} kroków'
done: 'Wszystko skonfigurowane'
optional: 'Opcjonalnie'
suggestion:
  form:
    label: 'Sprawdź formularz rejestracji'
    hint: 'Pochodzi z szablonu lub wcześniejszego wydarzenia — dostosuj go do tego'
  emails:
    label: 'Sprawdź automatyczne e-maile'
    hint: 'Potwierdzenia i inne e-maile wysyłane w twoim imieniu'
  access:
    label: 'Daj dostęp zespołowi'
    hint: 'Zaproś współorganizatorów do zarządzania wydarzeniem'
step:
  window:
    label: 'Ustal okres rejestracji'
    hint: 'Kiedy można się zapisać'
  files:
    label: 'Prześlij pliki wydarzenia'
    hint: 'Pliki, do których odwołują się formularz i e-maile'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Příprava na otevření registrace'
progress: 'Hotovo {done} z {total} kroků'
done: 'Vše je nastaveno'
optional: 'Volitelné'
suggestion:
  form:
    label: 'Zkontrolovat registrační formulář'
    hint: 'Pochází ze šablony nebo dřívější akce — upravte ho pro tuto'
  emails:
    label: 'Zkontrolovat automatické e-maily'
    hint: 'Potvrzení a další e-maily odesílané vaším jménem'
  access:
    label: 'Dát přístup týmu'
    hint: 'Pozvěte spoluorganizátory ke správě akce'
step:
  window:
    label: 'Nastavit období registrace'
    hint: 'Kdy se lze přihlásit'
  files:
    label: 'Nahrát soubory akce'
    hint: 'Soubory, na které odkazuje formulář a e-maily'
</i18n>
