<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card
      class="details-card rounded-xl"
      style="width: min(700px, 95vw); max-width: min(900px, 95vw)"
    >
      <registration-dialog-header :registration="registration">
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
            <template v-if="emails?.length">
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
                      v-for="email in emails"
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
                    <q-item-label v-if="street">
                      {{ street }}
                    </q-item-label>
                    <q-item-label v-if="city">
                      {{ city }}
                    </q-item-label>
                    <q-item-label v-if="country">
                      {{ country }}
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

          <!-- Right column: room + timeline -->
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
              v-if="auditLoading"
              class="row justify-center q-py-lg"
            >
              <q-spinner
                color="primary"
                size="2em"
              />
            </div>

            <q-timeline
              v-else
              class="q-px-lg"
              color="primary"
            >
              <template v-if="timelineEntries.length">
                <q-timeline-entry
                  v-for="entry in timelineEntries"
                  :key="entry.id"
                  :color="entry.color"
                  :icon="entry.icon"
                  :subtitle="entry.subtitle"
                  :title="entry.title"
                >
                  <div
                    v-for="(line, index) in entry.details"
                    :key="index"
                    class="text-body2"
                  >
                    {{ line }}
                  </div>
                  <div
                    v-if="entry.actor"
                    class="text-caption text-grey-6"
                  >
                    {{ t('timeline.by', { actor: entry.actor }) }}
                  </div>
                </q-timeline-entry>
              </template>

              <!-- Fallback for registrations created before audit logging -->
              <q-timeline-entry
                v-else
                :subtitle="formattedCreatedAt"
                :title="t('timeline.registered')"
                color="positive"
                icon="how_to_reg"
              />
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
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import type {
  AuditActor,
  AuditChangeSet,
  AuditLogEntry,
  Registration,
} from '@camp-registration/common/entities';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import { useAPIService } from 'src/services/APIService';
import { formatPersonName } from 'src/utils/formatters';
import RegistrationDialogHeader from 'components/campManagement/table/dialogs/RegistrationDialogHeader.vue';

defineEmits([...useDialogPluginComponent.emits]);

// eslint-disable-next-line @typescript-eslint/unbound-method
const { t, te, locale } = useI18n();
const { to } = useObjectTranslation();
const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent();
const route = useRoute();
const apiService = useAPIService();

const { registration } = defineProps<{
  registration: Registration;
}>();

interface TimelineDisplayEntry {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  icon: string;
  details: string[];
  actor: string | null;
}

const auditEntries = ref<AuditLogEntry[]>([]);
const auditLoading = ref(true);

onMounted(async () => {
  const campId = route.params.campId;
  if (typeof campId !== 'string') {
    auditLoading.value = false;
    return;
  }

  try {
    auditEntries.value = await apiService.fetchRegistrationAuditLog(
      campId,
      registration.id,
    );
  } catch {
    // Endpoint unavailable (e.g. not yet migrated) — fall back to the legacy
    // single "registered" entry rather than breaking the dialog.
    auditEntries.value = [];
  } finally {
    auditLoading.value = false;
  }
});

const formatDateTime = (timestamp: string): string =>
  new Date(timestamp).toLocaleString(locale.value, {
    year: 'numeric',
    month: '2-digit',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const statusLabel = (status: unknown): string => {
  if (typeof status !== 'string') {
    return '';
  }
  const key = `status.${status.toLowerCase()}`;
  return te(key) ? t(key) : status;
};

const statusColor = (status: unknown): string => {
  switch (status) {
    case 'ACCEPTED':
      return 'positive';
    case 'WAITLISTED':
      return 'warning';
    case 'PENDING':
      return 'info';
    default:
      return 'primary';
  }
};

const actionMeta = (
  action: string,
  changes: AuditChangeSet | null,
): { title: string; icon: string; color: string } => {
  switch (action) {
    case 'created':
      return {
        title: t('timeline.created'),
        icon: 'how_to_reg',
        color: 'positive',
      };
    case 'deleted':
      return {
        title: t('timeline.deleted'),
        icon: 'delete',
        color: 'negative',
      };
    case 'updated':
    default:
      return {
        title: t('timeline.updated'),
        // A status change is the most salient kind of edit — colour by it.
        icon: changes?.fields?.status ? 'swap_horiz' : 'edit',
        color: changes?.fields?.status
          ? statusColor(changes.fields.status.to)
          : 'primary',
      };
  }
};

const changedFieldNames = (changes: AuditChangeSet | null): string[] => {
  const names = [
    ...Object.keys(changes?.data ?? {}),
    ...Object.keys(changes?.fields ?? {}).filter((key) => key !== 'status'),
  ];
  return [...new Set(names)];
};

// One entry can carry several kinds of change at once (e.g. status + data in a
// single edit); each becomes its own line.
const detailsFor = (
  action: string,
  changes: AuditChangeSet | null,
): string[] => {
  const lines: string[] = [];
  const status = changes?.fields?.status;

  if (status) {
    if (action === 'created') {
      const label = statusLabel(status.to);
      if (label) {
        lines.push(label);
      }
    } else {
      const from = statusLabel(status.from) || '—';
      const to = statusLabel(status.to) || '—';
      lines.push(`${from} → ${to}`);
    }
  }

  const fields = changedFieldNames(changes);
  if (fields.length > 0) {
    lines.push(t('timeline.changedFields', { fields: fields.join(', ') }));
  }

  return lines;
};

const actorLabel = (actor: AuditActor | null): string | null => {
  if (actor === null) {
    return null;
  }
  return actor.name ?? t('timeline.deletedUser');
};

const timelineEntries = computed<TimelineDisplayEntry[]>(() =>
  auditEntries.value.map((entry) => {
    const meta = actionMeta(entry.action, entry.changes);
    return {
      id: entry.id,
      title: meta.title,
      subtitle: formatDateTime(entry.createdAt),
      color: meta.color,
      icon: meta.icon,
      details: detailsFor(entry.action, entry.changes),
      actor: actorLabel(entry.actor),
    };
  }),
);

const personName = computed<string>(() => {
  const firstName = registration.computedData.firstName?.trim() ?? '';
  const lastName = registration.computedData.lastName?.trim() ?? '';
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName.length > 0 ? formatPersonName(fullName) : '?';
});

const emails = computed<string[] | null>(() => {
  const values = registration.computedData.emails;

  if (!values) {
    return null;
  }

  const normalizeEmail = (email: string): string => email.trim().toLowerCase();

  return [...new Set(values.map(normalizeEmail).filter(Boolean))];
});

const hasAddress = computed<boolean>(() => {
  const addr = registration.computedData.address;
  return !!(addr.street || addr.city || addr.zipCode || addr.country);
});

const translatedGender = computed<string>(() => {
  const g = registration.computedData.gender;
  if (!g) {
    return '';
  }
  const key = `gender.${g}`;
  const result = t(key);

  return result === key ? g : result;
});

const translatedRole = computed<string>(() => {
  const r = registration.computedData.role;
  if (!r) {
    return '';
  }
  const key = `role.${r}`;
  const result = t(key);

  return result === key ? r : result;
});

const formattedDateOfBirth = computed<string>(() => {
  const dob = registration.computedData.dateOfBirth;
  if (!dob) {
    return '';
  }
  const date = new Date(dob);

  return date.toLocaleDateString(locale.value, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

const formattedCreatedAt = computed<string>(() => {
  const date = new Date(registration.createdAt);
  return date.toLocaleString(locale.value, {
    year: 'numeric',
    month: '2-digit',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
});

const street = computed<string | null>(
  () => registration.computedData.address.street,
);

const city = computed<string | null>(() => {
  const zipCode = registration.computedData.address.zipCode;
  const city = registration.computedData.address.city;

  if (zipCode == null && city == null) {
    return null;
  }

  return [zipCode, city].filter(Boolean).join(' ');
});

const country = computed<string | null>(() => {
  const country = registration.computedData.address.country;
  if (country == null) {
    return country;
  }

  return te(`country.${country}`) ? t(`country.${country}`) : country;
});
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
  registered: 'Registered'
  created: 'Registered'
  updated: 'Updated'
  statusChanged: 'Status changed'
  deleted: 'Deleted'
  by: 'by {actor}'
  changedFields: 'Changed: {fields}'
  deletedUser: 'Deleted user'

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
  registered: 'Angemeldet'
  created: 'Angemeldet'
  updated: 'Aktualisiert'
  statusChanged: 'Status geändert'
  deleted: 'Gelöscht'
  by: 'von {actor}'
  changedFields: 'Geändert: {fields}'
  deletedUser: 'Gelöschter Benutzer'

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
  registered: 'Inscrit'
  created: 'Inscrit'
  updated: 'Mis à jour'
  statusChanged: 'Statut modifié'
  deleted: 'Supprimé'
  by: 'par {actor}'
  changedFields: 'Modifié : {fields}'
  deletedUser: 'Utilisateur supprimé'

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
  registered: 'Zarejestrowano'
  created: 'Zarejestrowano'
  updated: 'Zaktualizowano'
  statusChanged: 'Zmieniono status'
  deleted: 'Usunięto'
  by: 'przez {actor}'
  changedFields: 'Zmieniono: {fields}'
  deletedUser: 'Usunięty użytkownik'

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
  registered: 'Zaregistrováno'
  created: 'Zaregistrováno'
  updated: 'Aktualizováno'
  statusChanged: 'Stav změněn'
  deleted: 'Smazáno'
  by: 'uživatelem {actor}'
  changedFields: 'Změněno: {fields}'
  deletedUser: 'Smazaný uživatel'

action:
  close: 'Zavřít'
</i18n>

<style scoped>
.details-card {
  background: var(--md3-surface-container-low);
  overflow: hidden;
}

.header-btn {
  color: var(--md3-on-surface-variant);
}

@media (min-width: 600px) {
  .timeline-column {
    border-left: 1px solid var(--md3-outline-variant);
  }
}
</style>
