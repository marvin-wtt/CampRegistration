<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card
      v-if="registration"
      class="details-card rounded-xl"
      style="width: min(560px, 95vw)"
    >
      <registration-dialog-header :registration="registration">
        <q-btn
          class="header-btn"
          dense
          flat
          icon="more_vert"
          round
        >
          <q-tooltip>
            {{ t('action.menu') }}
          </q-tooltip>
          <q-menu auto-close>
            <registration-action-list
              :registration="registration"
              hide-details
            />
          </q-menu>
        </q-btn>

        <q-btn
          v-close-popup
          class="header-btn"
          dense
          flat
          icon="close"
          round
          @click="onDialogCancel"
        >
          <q-tooltip>
            {{ t('action.close') }}
          </q-tooltip>
        </q-btn>
      </registration-dialog-header>

      <q-tabs
        v-if="canViewTimeline"
        v-model="activeTab"
        align="justify"
        no-caps
        narrow-indicator
        active-color="primary"
        indicator-color="primary"
        class="details-tabs"
      >
        <q-tab
          name="details"
          :label="t('tab.details')"
        />
        <q-tab
          name="timeline"
          :label="t('section.timeline')"
        />
      </q-tabs>

      <q-tab-panels
        v-model="activeTab"
        animated
        class="bg-transparent"
      >
        <q-tab-panel
          name="details"
          class="q-pa-none"
        >
          <div
            v-if="hasDetails"
            class="details-panel scroll"
          >
            <section v-if="personalRows.length">
              <div class="section-title">{{ t('section.personal') }}</div>
              <q-list class="segmented-list">
                <q-item
                  v-for="row in personalRows"
                  :key="row.key"
                  class="segment"
                >
                  <q-item-section avatar>
                    <div class="row-icon">
                      <q-icon
                        :name="row.icon"
                        size="20px"
                      />
                    </div>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="row-label">
                      {{ row.label }}
                    </q-item-label>
                    <q-item-label class="row-value">
                      {{ row.value }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </section>

            <section v-if="emails?.length || hasAddress">
              <div class="section-title">{{ t('section.contact') }}</div>
              <q-list class="segmented-list">
                <q-item
                  v-for="email in emails"
                  :key="email"
                  :href="`mailto:${email}`"
                  class="segment"
                  clickable
                  tag="a"
                >
                  <q-item-section avatar>
                    <div class="row-icon">
                      <q-icon
                        name="email"
                        size="20px"
                      />
                    </div>
                  </q-item-section>
                  <q-item-section class="overflow-hidden">
                    <q-item-label class="row-label">
                      {{ t('field.email') }}
                    </q-item-label>
                    <q-item-label class="row-value row-value--link ellipsis">
                      {{ email }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-btn
                      class="row-action"
                      flat
                      icon="content_copy"
                      round
                      size="sm"
                      @click.stop.prevent="copyEmail(email)"
                    >
                      <q-tooltip>
                        {{ t('action.copy') }}
                      </q-tooltip>
                    </q-btn>
                  </q-item-section>
                </q-item>

                <q-item
                  v-if="hasAddress"
                  class="segment"
                >
                  <q-item-section avatar>
                    <div class="row-icon">
                      <q-icon
                        name="home"
                        size="20px"
                      />
                    </div>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="row-label">
                      {{ t('section.address') }}
                    </q-item-label>
                    <q-item-label class="row-value">
                      <div v-if="street">{{ street }}</div>
                      <div v-if="city">{{ city }}</div>
                      <div v-if="country">{{ country }}</div>
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </section>
          </div>

          <div
            v-else
            class="empty-state column flex-center text-center q-pa-xl"
          >
            <q-icon
              name="inbox"
              size="40px"
            />
            <div class="text-body2 q-mt-sm">
              {{ t('empty') }}
            </div>
          </div>
        </q-tab-panel>

        <q-tab-panel
          v-if="canViewTimeline"
          name="timeline"
          class="q-pa-none"
          lazy-render
        >
          <q-scroll-area class="timeline-panel">
            <registration-timeline
              :event-id
              :registration-id
              :created-at="registration.createdAt"
            />
          </q-scroll-area>
        </q-tab-panel>
      </q-tab-panels>

      <q-card-actions
        align="right"
        class="details-actions"
      >
        <m-btn
          tonal
          primary
          icon="assignment"
          :disable="!event"
          :label="t('action.showFormData')"
          @click="showFormData"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { copyToClipboard, useDialogPluginComponent, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { usePermissions } from '@/composables/permissions';
import { useRegistrationHelper } from '@/composables/registrationHelper';
import { useRegistrationsStore } from '@/stores/registration-store';
import { useEventDetailsStore } from '@/stores/event-details-store';
import RegistrationActionList from '@/components/event/table/RegistrationActionList.vue';
import RegistrationDialogHeader from '@/components/event/table/dialogs/RegistrationDialogHeader.vue';
import RegistrationFormViewDialog from '@/components/event/table/dialogs/RegistrationFormViewDialog.vue';
import RegistrationTimeline from '@/components/event/table/dialogs/RegistrationTimeline.vue';

defineEmits([...useDialogPluginComponent.emits]);

const quasar = useQuasar();
// eslint-disable-next-line @typescript-eslint/unbound-method
const { t, te, d } = useI18n();
const { to } = useObjectTranslation();
const registrationHelper = useRegistrationHelper();
const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent();
const route = useRoute();

const { registrationId } = defineProps<{
  registrationId: string;
}>();

const { data: registrations } = storeToRefs(useRegistrationsStore());
const { data: event } = storeToRefs(useEventDetailsStore());
const eventId = String(route.params.eventId);
const { can } = usePermissions();

// Hide the whole section rather than an empty one when neither source is
// visible to the viewer; RegistrationTimeline itself notes a partial view.
const canViewTimeline = computed(
  () => can('event.audit.view') || can('event.messages.view'),
);

// The timeline panel is `lazy-render`, so switching to it is what mounts
// RegistrationTimeline and fires its fetch — not every dialog open.
const activeTab = ref<'details' | 'timeline'>('details');

// Reactive lookup instead of a static snapshot, so edits made elsewhere
// (e.g. the table's inline cell editors) are reflected while the dialog is open.
const registration = computed(() =>
  registrations.value?.find((r) => r.id === registrationId),
);

// Close automatically if the registration is deleted while the dialog is open.
watch(registration, (value) => {
  if (!value) {
    dialogRef.value?.hide();
  }
});

const emails = computed<string[] | null>(() => {
  const values = registration.value?.computedData.emails;

  if (!values) {
    return null;
  }

  const normalizeEmail = (email: string): string => email.trim().toLowerCase();

  return [...new Set(values.map(normalizeEmail).filter(Boolean))];
});

const hasAddress = computed<boolean>(() => {
  const addr = registration.value?.computedData.address;
  return !!(addr?.street || addr?.city || addr?.zipCode || addr?.country);
});

// Known values are translated; anything else (custom form options) is shown as-is.
function translateOr(prefix: string, value: string | null): string {
  if (!value) {
    return '';
  }
  const key = `${prefix}.${value}`;
  return te(key) ? t(key) : value;
}

const translatedGender = computed<string>(() =>
  translateOr('gender', registration.value?.computedData.gender ?? null),
);

const translatedRole = computed<string>(() =>
  translateOr('role', registration.value?.computedData.role ?? null),
);

const formattedDateOfBirth = computed<string>(() => {
  const dob = registration.value?.computedData.dateOfBirth;
  if (!dob || !registration.value) {
    return '';
  }

  // Same format as the table's date cells
  const formatted = d(dob, { dateStyle: 'medium' });
  const age = registrationHelper.age(registration.value);

  return age !== undefined ? `${formatted} (${age})` : formatted;
});

const street = computed<string | null>(
  () => registration.value?.computedData.address.street ?? null,
);

const city = computed<string | null>(() => {
  const { zipCode, city } = registration.value?.computedData.address ?? {};
  return [zipCode, city].filter(Boolean).join(' ') || null;
});

const country = computed<string | null>(
  () =>
    translateOr(
      'country',
      registration.value?.computedData.address.country ?? null,
    ) || null,
);

interface DetailRow {
  key: string;
  icon: string;
  label: string;
  value: string;
}

const personalRows = computed<DetailRow[]>(() => {
  const value = registration.value;
  if (!value) {
    return [];
  }

  const data = value.computedData;
  const rows: DetailRow[] = [];

  if (data.dateOfBirth) {
    rows.push({
      key: 'dateOfBirth',
      icon: 'cake',
      label: t('field.dateOfBirth'),
      value: formattedDateOfBirth.value,
    });
  }
  if (data.gender) {
    rows.push({
      key: 'gender',
      icon: 'wc',
      label: t('field.gender'),
      value: translatedGender.value,
    });
  }
  if (data.role) {
    rows.push({
      key: 'role',
      icon: 'work',
      label: t('field.role'),
      value: translatedRole.value,
    });
  }
  if (value.room) {
    rows.push({
      key: 'room',
      icon: 'hotel',
      label: t('field.room'),
      value: to(value.room),
    });
  }

  return rows;
});

const hasDetails = computed<boolean>(
  () =>
    personalRows.value.length > 0 || !!emails.value?.length || hasAddress.value,
);

async function copyEmail(email: string): Promise<void> {
  try {
    await copyToClipboard(email);
    quasar.notify({
      type: 'positive',
      message: t('notification.copied'),
      icon: 'assignment_turned_in',
    });
  } catch {
    quasar.notify({
      type: 'negative',
      message: t('notification.copyFailed'),
    });
  }
}

function showFormData(): void {
  if (!event.value || !registration.value) {
    return;
  }

  quasar.dialog({
    component: RegistrationFormViewDialog,
    componentProps: {
      event: event.value,
      data: registration.value.data,
    },
  });
}
</script>

<i18n lang="yaml" locale="en">
section:
  personal: 'Personal'
  contact: 'Contact'
  address: 'Address'
  timeline: 'Timeline'

tab:
  details: 'Details'

field:
  dateOfBirth: 'Date of Birth'
  gender: 'Gender'
  role: 'Role'
  email: 'Email'
  room: 'Room'

gender:
  m: 'Male'
  f: 'Female'
  d: 'Diverse'

role:
  participant: 'Participant'
  counselor: 'Counselor'

action:
  close: 'Close'
  menu: 'More actions'
  copy: 'Copy'
  showFormData: 'Show form data'

notification:
  copied: 'Copied to clipboard'
  copyFailed: 'Copying failed'

empty: 'No details available for this registration'
</i18n>

<i18n lang="yaml" locale="de">
section:
  personal: 'Persönliches'
  contact: 'Kontakt'
  address: 'Adresse'
  timeline: 'Verlauf'

tab:
  details: 'Details'

field:
  dateOfBirth: 'Geburtsdatum'
  gender: 'Geschlecht'
  role: 'Rolle'
  email: 'E-Mail'
  room: 'Zimmer'

gender:
  m: 'Männlich'
  f: 'Weiblich'
  d: 'Divers'

role:
  participant: 'Teilnehmer'
  counselor: 'Betreuer'

action:
  close: 'Schließen'
  menu: 'Weitere Aktionen'
  copy: 'Kopieren'
  showFormData: 'Formulardaten anzeigen'

notification:
  copied: 'In die Zwischenablage kopiert'
  copyFailed: 'Kopieren fehlgeschlagen'

empty: 'Für diese Anmeldung sind keine Details verfügbar'
</i18n>

<i18n lang="yaml" locale="fr">
section:
  personal: 'Informations personnelles'
  contact: 'Contact'
  address: 'Adresse'
  timeline: 'Historique'

tab:
  details: 'Détails'

field:
  dateOfBirth: 'Date de naissance'
  gender: 'Genre'
  role: 'Rôle'
  email: 'E-mail'
  room: 'Chambre'

gender:
  m: 'Masculin'
  f: 'Féminin'
  d: 'Divers'

role:
  participant: 'Participant'
  counselor: 'Conseiller'

action:
  close: 'Fermer'
  menu: 'Plus d’actions'
  copy: 'Copier'
  showFormData: 'Afficher les données du formulaire'

notification:
  copied: 'Copié dans le presse-papiers'
  copyFailed: 'Échec de la copie'

empty: 'Aucun détail disponible pour cette inscription'
</i18n>

<i18n lang="yaml" locale="pl">
section:
  personal: 'Dane osobowe'
  contact: 'Kontakt'
  address: 'Adres'
  timeline: 'Historia'

tab:
  details: 'Szczegóły'

field:
  dateOfBirth: 'Data urodzenia'
  gender: 'Płeć'
  role: 'Rola'
  email: 'E-mail'
  room: 'Pokój'

gender:
  m: 'Mężczyzna'
  f: 'Kobieta'
  d: 'Inna'

role:
  participant: 'Uczestnik'
  counselor: 'Opiekun'

action:
  close: 'Zamknij'
  menu: 'Więcej działań'
  copy: 'Kopiuj'
  showFormData: 'Pokaż dane formularza'

notification:
  copied: 'Skopiowano do schowka'
  copyFailed: 'Kopiowanie nie powiodło się'

empty: 'Brak szczegółów dla tego zgłoszenia'
</i18n>

<i18n lang="yaml" locale="cs">
section:
  personal: 'Osobní údaje'
  contact: 'Kontakt'
  address: 'Adresa'
  timeline: 'Časová osa'

tab:
  details: 'Podrobnosti'

field:
  dateOfBirth: 'Datum narození'
  gender: 'Pohlaví'
  role: 'Role'
  email: 'E-mail'
  room: 'Pokoj'

gender:
  m: 'Muž'
  f: 'Žena'
  d: 'Jiné'

role:
  participant: 'Účastník'
  counselor: 'Pečovatel'

action:
  close: 'Zavřít'
  menu: 'Další akce'
  copy: 'Kopírovat'
  showFormData: 'Zobrazit data formuláře'

notification:
  copied: 'Zkopírováno do schránky'
  copyFailed: 'Kopírování se nezdařilo'

empty: 'Pro tuto registraci nejsou k dispozici žádné podrobnosti'
</i18n>

<style scoped>
.details-card {
  background: var(--md3-surface-container-low);
  overflow: hidden;
}

.header-btn {
  color: var(--md3-on-surface-variant);
}

/* Details size to their content; the timeline needs a fixed viewport for its
   scroll area. */
.details-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 16px;
  max-height: min(480px, 62vh);
}

.timeline-panel {
  height: min(480px, 62vh);
}

.section-title {
  padding: 0 4px 8px;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--md3-primary);
}

/* MD3 Expressive segmented list: rows are separate tiles with a small gap,
   and only the group's outer corners are fully rounded. */
.segmented-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.segment {
  min-height: 64px;
  padding: 10px 12px 10px 16px;
  background: var(--md3-surface-container-high);
  border-radius: 4px;
  color: var(--md3-on-surface);
}

.segment:first-child {
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
}

.segment:last-child {
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
}

.segment :deep(.q-item__section--avatar) {
  min-width: 0;
  padding-right: 16px;
}

.row-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}

.row-label {
  font-size: 0.75rem;
  line-height: 1rem;
  letter-spacing: 0.02em;
  color: var(--md3-on-surface-variant);
}

.row-value {
  margin-top: 2px;
  font-size: 1rem;
  line-height: 1.5rem;
  color: var(--md3-on-surface);
}

.row-value--link {
  color: var(--md3-primary);
}

.row-action {
  color: var(--md3-on-surface-variant);
}

.empty-state {
  color: var(--md3-on-surface-variant);
}

.details-actions {
  padding: 8px 16px 16px;
}

/* Shares the header's surface tone, so the two read as one top zone; the
   divider from content sits below the tabs instead of between them. */
.details-tabs {
  background: var(--md3-surface-container);
  border-bottom: 1px solid var(--md3-outline-variant);
}

.details-tabs :deep(.q-tab) {
  min-height: 48px;
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--md3-on-surface-variant);
}

.details-tabs :deep(.q-tab--active) {
  color: var(--md3-primary);
}

.details-tabs :deep(.q-tabs__indicator) {
  height: 3px;
  border-radius: 3px 3px 0 0;
}
</style>
