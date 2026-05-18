<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
    @show="loadLogs"
  >
    <q-card style="width: min(700px, 95vw); max-width: min(900px, 95vw)">
      <!-- Header -->
      <q-card-section class="row items-center no-wrap q-py-sm">
        <q-icon
          color="primary"
          name="person"
          size="sm"
        />
        <div class="col-shrink q-ml-sm text-h6 ellipsis">
          {{ personName }}
        </div>

        <q-space />

        <q-chip
          :color="statusColor"
          class="q-ml-sm q-mr-xs"
          dense
          size="md"
          text-color="white"
        >
          {{ t(`status.${registration.status.toLowerCase()}`) }}
        </q-chip>

        <q-btn
          v-close-popup
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
      </q-card-section>

      <q-separator />

      <q-scroll-area style="height: min(520px, 65vh)">
        <div class="row">
          <!-- Left column: personal info, contact, address -->
          <div class="col-12 col-sm-6">
            <!-- Personal Information -->
            <q-list>
              <q-item-label header>
                {{ t('section.personalInfo') }}
              </q-item-label>

              <q-item>
                <q-item-section
                  avatar
                  top
                >
                  <q-icon
                    color="primary"
                    name="badge"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label overline>
                    {{ t('field.name') }}
                  </q-item-label>
                  <q-item-label>
                    {{ personName }}
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="registration.computedData.dateOfBirth">
                <q-item-section
                  avatar
                  top
                >
                  <q-icon
                    color="primary"
                    name="cake"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label overline>
                    {{ t('field.dateOfBirth') }}
                  </q-item-label>
                  <q-item-label>{{ formattedDateOfBirth }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="registration.computedData.gender">
                <q-item-section
                  avatar
                  top
                >
                  <q-icon
                    color="primary"
                    name="wc"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label overline>
                    {{ t('field.gender') }}
                  </q-item-label>
                  <q-item-label>
                    {{ translatedGender }}
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="registration.computedData.role">
                <q-item-section
                  avatar
                  top
                >
                  <q-icon
                    color="primary"
                    name="work"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label overline>
                    {{ t('field.role') }}
                  </q-item-label>
                  <q-item-label>{{ translatedRole }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>

            <!-- Contact -->
            <template v-if="registration.computedData.emails?.length">
              <q-separator inset />
              <q-list>
                <q-item-label header>
                  {{ t('section.contact') }}
                </q-item-label>

                <q-item>
                  <q-item-section
                    avatar
                    top
                  >
                    <q-icon
                      color="primary"
                      name="email"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label overline>
                      {{ t('field.email') }}
                    </q-item-label>
                    <q-item-label
                      v-for="email in registration.computedData.emails"
                      :key="email"
                    >
                      <a
                        :href="`mailto:${email}`"
                        style="all: unset; cursor: pointer"
                      >
                        {{ email }}
                      </a>
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </template>

            <!-- Address -->
            <template v-if="hasAddress">
              <q-separator inset />
              <q-list>
                <q-item-label header>
                  {{ t('section.address') }}
                </q-item-label>

                <q-item>
                  <q-item-section
                    avatar
                    top
                  >
                    <q-icon
                      color="primary"
                      name="home"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label
                      v-if="registration.computedData.address.street"
                    >
                      {{ registration.computedData.address.street }}
                    </q-item-label>
                    <q-item-label
                      v-if="
                        registration.computedData.address.zipCode ||
                        registration.computedData.address.city
                      "
                    >
                      {{
                        [
                          registration.computedData.address.zipCode,
                          registration.computedData.address.city,
                        ]
                          .filter(Boolean)
                          .join(' ')
                      }}
                    </q-item-label>
                    <q-item-label
                      v-if="registration.computedData.address.country"
                    >
                      {{ registration.computedData.address.country }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </template>

            <!-- Room (registration metadata) -->
            <template v-if="registration.room">
              <q-separator inset />

              <q-list>
                <q-item-label header>
                  {{ t('section.registration') }}
                </q-item-label>

                <q-item>
                  <q-item-section
                    avatar
                    top
                  >
                    <q-icon
                      color="primary"
                      name="hotel"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label overline>
                      {{ t('field.room') }}
                    </q-item-label>
                    <q-item-label>
                      {{ to(registration.room) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </template>
          </div>

          <!-- Right column: timeline -->
          <div class="col-12 col-sm-6 timeline-column">
            <q-separator
              class="lt-sm"
              inset
            />

            <!-- Timeline -->
            <q-list>
              <q-item-label header>
                {{ t('section.timeline') }}
              </q-item-label>
            </q-list>

            <div
              v-if="logsLoading"
              class="flex flex-center q-py-md"
            >
              <q-spinner
                color="primary"
                size="md"
              />
            </div>

            <q-timeline
              v-else
              class="q-px-lg"
              color="primary"
            >
              <q-timeline-entry
                v-for="entry in timelineEntries"
                :key="entry.id"
                :color="entry.color"
                :icon="entry.icon"
                :subtitle="entry.subtitle"
                :title="entry.title"
              >
                <div
                  v-if="entry.note"
                  class="text-caption text-grey-7"
                >
                  <q-icon name="notes" />
                  {{ entry.note }}
                </div>
                <div
                  v-if="entry.author"
                  class="text-caption text-grey-6"
                >
                  {{ entry.author }}
                </div>
              </q-timeline-entry>
            </q-timeline>
          </div>
        </div>
      </q-scroll-area>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed, ref } from 'vue';
import type {
  Registration,
  RegistrationLog,
} from '@camp-registration/common/entities';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import { useAPIService } from 'src/services/APIService';

defineEmits([...useDialogPluginComponent.emits]);

const { t, locale } = useI18n();
const { to } = useObjectTranslation();
const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent();
const apiService = useAPIService();

const { registration, campId } = defineProps<{
  registration: Registration;
  campId: string;
}>();

const logsLoading = ref<boolean>(false);
const logs = ref<RegistrationLog[]>([]);

async function loadLogs() {
  logsLoading.value = true;
  try {
    logs.value = await apiService.fetchRegistrationLogs(
      campId,
      registration.id,
    );
  } finally {
    logsLoading.value = false;
  }
}

interface TimelineEntry {
  id: string;
  icon: string;
  color: string;
  title: string;
  subtitle: string;
  note: string | null;
  author: string | null;
}

const timelineEntries = computed<TimelineEntry[]>(() => {
  const entries: TimelineEntry[] = [];

  for (const log of logs.value) {
    entries.push({
      id: log.id,
      icon: actionIcon(log.action),
      color: actionColor(log),
      title: actionTitle(log),
      subtitle: formatDate(log.createdAt),
      note: log.note,
      author: log.userName,
    });
  }

  return entries;
});

function actionIcon(action: RegistrationLog['action']): string {
  switch (action) {
    case 'CREATE':
      return 'how_to_reg';
    case 'UPDATE':
      return 'edit';
    case 'DELETE':
      return 'delete';
  }
}

function actionColor(log: RegistrationLog): string {
  switch (log.action) {
    case 'CREATE':
      return 'positive';
    case 'DELETE':
      return 'negative';
    case 'UPDATE': {
      const after = log.after;
      if (after?.status === 'ACCEPTED') return 'positive';
      if (after?.status === 'WAITLISTED') return 'warning';
      return 'primary';
    }
  }
}

function actionTitle(log: RegistrationLog): string {
  switch (log.action) {
    case 'CREATE':
      return t('timeline.created');
    case 'DELETE':
      return t('timeline.deleted');
    case 'UPDATE': {
      const before = log.before;
      const after = log.after;
      if (before?.status !== after?.status) {
        const rawStatus = after?.status;
        const newStatus =
          typeof rawStatus === 'string' ? rawStatus.toLowerCase() : '';
        const key = `timeline.statusChanged.${newStatus}`;
        const result = t(key);
        return result === key ? t('timeline.updated') : result;
      }
      return t('timeline.updated');
    }
  }
}

const personName = computed<string>(() => {
  const firstName = registration.computedData.firstName?.trim() ?? '';
  const lastName = registration.computedData.lastName?.trim() ?? '';
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName.length > 0 ? fullName : '?';
});

const statusColor = computed<string>(() => {
  switch (registration.status) {
    case 'ACCEPTED':
      return 'positive';
    case 'PENDING':
      return 'info';
    case 'WAITLISTED':
    default:
      return 'warning';
  }
});

const hasAddress = computed<boolean>(() => {
  const addr = registration.computedData.address;
  return !!(addr.street || addr.city || addr.zipCode || addr.country);
});

const translatedGender = computed<string>(() => {
  const g = registration.computedData.gender;
  if (!g) return '';
  const key = `gender.${g}`;
  const result = t(key);
  return result === key ? g : result;
});

const translatedRole = computed<string>(() => {
  const r = registration.computedData.role;
  if (!r) return '';
  const key = `role.${r}`;
  const result = t(key);
  return result === key ? r : result;
});

const formattedDateOfBirth = computed<string>(() => {
  const dob = registration.computedData.dateOfBirth;
  if (!dob) return '';
  const date = new Date(dob);
  return date.toLocaleDateString(locale.value, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString(locale.value, {
    year: 'numeric',
    month: '2-digit',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>

<i18n lang="yaml" locale="en">
section:
  personalInfo: 'Personal Information'
  contact: 'Contact'
  address: 'Address'
  registration: 'Registration'
  timeline: 'Timeline'

status:
  pending: 'Pending'
  waitlisted: 'Waitlisted'
  accepted: 'Accepted'

field:
  name: 'Name'
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

timeline:
  created: 'Registered'
  updated: 'Updated'
  deleted: 'Deleted'
  statusChanged:
    accepted: 'Status changed to Accepted'
    pending: 'Status changed to Pending'
    waitlisted: 'Status changed to Waitlisted'

action:
  close: 'Close'
</i18n>

<i18n lang="yaml" locale="de">
section:
  personalInfo: 'Persönliche Informationen'
  contact: 'Kontakt'
  address: 'Adresse'
  registration: 'Anmeldung'
  timeline: 'Verlauf'

status:
  pending: 'Ausstehend'
  waitlisted: 'Warteliste'
  accepted: 'Akzeptiert'

field:
  name: 'Name'
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

timeline:
  created: 'Angemeldet'
  updated: 'Aktualisiert'
  deleted: 'Gelöscht'
  statusChanged:
    accepted: 'Status geändert zu Akzeptiert'
    pending: 'Status geändert zu Ausstehend'
    waitlisted: 'Status geändert zu Warteliste'

action:
  close: 'Schließen'
</i18n>

<i18n lang="yaml" locale="fr">
section:
  personalInfo: 'Informations personnelles'
  contact: 'Contact'
  address: 'Adresse'
  registration: 'Inscription'
  timeline: 'Historique'

status:
  pending: 'En attente'
  waitlisted: "Liste d'attente"
  accepted: 'Accepté'

field:
  name: 'Nom'
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

timeline:
  created: 'Inscrit'
  updated: 'Mis à jour'
  deleted: 'Supprimé'
  statusChanged:
    accepted: 'Statut changé en Accepté'
    pending: 'Statut changé en En attente'
    waitlisted: "Statut changé en Liste d'attente"

action:
  close: 'Fermer'
</i18n>

<i18n lang="yaml" locale="pl">
section:
  personalInfo: 'Informacje osobowe'
  contact: 'Kontakt'
  address: 'Adres'
  registration: 'Rejestracja'
  timeline: 'Historia'

status:
  pending: 'Oczekuje'
  waitlisted: 'Lista oczekujących'
  accepted: 'Zaakceptowano'

field:
  name: 'Imię i nazwisko'
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

timeline:
  created: 'Zarejestrowano'
  updated: 'Zaktualizowano'
  deleted: 'Usunięto'
  statusChanged:
    accepted: 'Status zmieniony na Zaakceptowano'
    pending: 'Status zmieniony na Oczekuje'
    waitlisted: 'Status zmieniony na Lista oczekujących'

action:
  close: 'Zamknij'
</i18n>

<i18n lang="yaml" locale="cs">
section:
  personalInfo: 'Osobní informace'
  contact: 'Kontakt'
  address: 'Adresa'
  registration: 'Registrace'
  timeline: 'Časová osa'

status:
  pending: 'Čeká na schválení'
  waitlisted: 'Na čekací listině'
  accepted: 'Přijato'

field:
  name: 'Jméno'
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

timeline:
  created: 'Zaregistrováno'
  updated: 'Aktualizováno'
  deleted: 'Odstraněno'
  statusChanged:
    accepted: 'Stav změněn na Přijato'
    pending: 'Stav změněn na Čeká na schválení'
    waitlisted: 'Stav změněn na Čekací listina'

action:
  close: 'Zavřít'
</i18n>

<style scoped>
@media (min-width: 600px) {
  .timeline-column {
    border-left: 1px solid rgba(0, 0, 0, 0.12);
  }
}
</style>
