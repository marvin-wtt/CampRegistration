<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card
      v-if="registration"
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
              <q-timeline-entry
                v-for="entry in timelineEntries"
                :key="entry.id"
                :color="entry.color"
                :icon="entry.icon"
                :subtitle="entry.subtitle"
                :title="entry.title"
              >
                <div
                  v-if="entry.caption"
                  class="text-caption audit-fields-label"
                >
                  {{ entry.caption }}
                </div>
                <div
                  v-if="entry.note"
                  class="text-body2 q-mb-xs"
                >
                  {{ entry.note }}
                </div>
                <div
                  v-for="warning in entry.warnings"
                  :key="warning"
                  class="text-caption audit-warning q-mb-xs"
                >
                  {{ warning }}
                </div>
                <div
                  v-if="entry.fields.length"
                  class="q-mb-xs"
                >
                  <div class="text-caption audit-fields-label q-mb-xs">
                    {{ t('timeline.changedFields') }}
                  </div>
                  <div class="audit-field-chips">
                    <q-chip
                      v-for="field in entry.fields"
                      :key="field.path"
                      dense
                      size="sm"
                      class="audit-field-chip"
                    >
                      {{ field.label }}
                      <q-tooltip>{{ field.path }}</q-tooltip>
                    </q-chip>
                  </div>
                </div>
                <div
                  v-if="entry.actor"
                  class="text-caption audit-fields-label"
                >
                  {{ t('timeline.by', { actor: entry.actor }) }}
                </div>
                <m-btn
                  v-if="entry.message"
                  text
                  primary
                  dense
                  no-caps
                  size="sm"
                  class="q-mt-xs"
                  :label="t('timeline.viewMessage')"
                  @click="openMessage(entry.message)"
                />
              </q-timeline-entry>

              <!-- Fallback for registrations created before audit logging -->
              <q-timeline-entry
                v-if="!auditEntries.length"
                :subtitle="formattedCreatedAt"
                :title="t('timeline.registered')"
                color="positive"
                icon="how_to_reg"
              />
            </q-timeline>
          </div>
        </div>
      </q-scroll-area>

      <q-separator />

      <q-card-actions
        align="right"
        class="q-pa-md"
      >
        <m-btn
          outline
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
import { useDialogPluginComponent, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import type {
  AuditActor,
  AuditLogEntry,
  Message,
  MessageDelivery,
} from '@camp-registration/common/entities';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { useAuditTimeline } from '@/composables/audit/auditTimeline';
import { useAPIService } from '@/services/APIService';
import { formatPersonName } from '@/utils/formatters';
import { extractFormFields } from '@/utils/surveyJS';
import { useRegistrationsStore } from '@/stores/registration-store';
import { useEventDetailsStore } from '@/stores/event-details-store';
import RegistrationDialogHeader from '@/components/event/table/dialogs/RegistrationDialogHeader.vue';
import RegistrationFormViewDialog from '@/components/event/table/dialogs/RegistrationFormViewDialog.vue';
import MessageDetailsDialog from '@/components/event/contact/MessageDetailsDialog.vue';

defineEmits([...useDialogPluginComponent.emits]);

const quasar = useQuasar();
// eslint-disable-next-line @typescript-eslint/unbound-method
const { t, te, locale } = useI18n();
const { to } = useObjectTranslation();
// Trigger names are shared with the audit log.
// eslint-disable-next-line @typescript-eslint/unbound-method
const { t: tGlobal, te: teGlobal } = useI18n({ useScope: 'global' });
const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent();
const route = useRoute();
const apiService = useAPIService();

const { registrationId } = defineProps<{
  registrationId: string;
}>();

const { data: registrations } = storeToRefs(useRegistrationsStore());
const { data: event } = storeToRefs(useEventDetailsStore());

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

interface ChangedField {
  // Human-readable question name, or the raw path when it can't be resolved.
  label: string;
  // The raw audit path — always shown as the tooltip / fallback.
  path: string;
}

interface TimelineDisplayEntry {
  id: string;
  // ISO timestamp, for merging audit entries and messages into one timeline.
  at: string;
  title: string;
  subtitle: string;
  color: string;
  icon: string;
  fields: ChangedField[];
  actor: string | null;
  caption?: string;
  note?: string;
  warnings?: string[];
  message?: Message;
}

// Maps a registration `data` leaf path to its form question label (e.g.
// `emergency_contacts.*.name` → "Contacts > * > Name"), the same mapping the
// table-column and email editors use. Rebuilt when the event's form changes.
const DATA_PREFIX = 'data.';

const fieldLabels = computed<Map<string, string>>(() => {
  const form = event.value?.form;
  if (!form) {
    return new Map();
  }
  return new Map(
    extractFormFields(form).map(({ value, label }) => [value, label]),
  );
});

const resolveField = (path: string): ChangedField => {
  // Only form answers (`data.*`) have question labels; `customData.*` and any
  // top-level column fall back to the raw path.
  if (path.startsWith(DATA_PREFIX)) {
    const label = fieldLabels.value.get(path.slice(DATA_PREFIX.length));
    if (label) {
      return { label, path };
    }
  }
  return { label: path, path };
};

const auditEntries = ref<AuditLogEntry[]>([]);
const auditLoading = ref(true);

onMounted(async () => {
  const eventId = route.params.eventId;
  if (typeof eventId !== 'string') {
    auditLoading.value = false;
    return;
  }

  // Either may fail on its own (e.g. no permission to view messages) — the
  // timeline then just shows what it could load.
  const [audit, received] = await Promise.allSettled([
    apiService.fetchRegistrationAuditLog(eventId, registrationId),
    apiService.fetchRegistrationMessages(eventId, registrationId),
  ]);
  auditEntries.value = audit.status === 'fulfilled' ? audit.value : [];
  deliveries.value = received.status === 'fulfilled' ? received.value : [];
  auditLoading.value = false;
});

// The emails this registration received — one delivery per address.
const deliveries = ref<MessageDelivery[]>([]);

interface ReceivedEmail {
  // Shaped as a message for MessageDetailsDialog: the rendered email, with
  // this registration's addresses as its only recipient.
  message: Message;
  trigger: string | null;
}

// Groups the per-address deliveries of one send into a single email.
const receivedEmails = computed<ReceivedEmail[]>(() => {
  const groups = new Map<string, MessageDelivery[]>();
  for (const delivery of deliveries.value) {
    const key =
      delivery.messageId ??
      `${delivery.trigger ?? ''}|${delivery.createdAt.slice(0, 16)}`;
    groups.set(key, [...(groups.get(key) ?? []), delivery]);
  }

  return [...groups.values()].flatMap(([first, ...rest]) => {
    if (!first) {
      return [];
    }
    return [
      {
        trigger: first.trigger,
        message: {
          id: first.id,
          subject: first.subject,
          body: first.body,
          replyTo: first.replyTo,
          priority: first.priority,
          attachments: first.attachments,
          recipients: [
            {
              registrationId,
              deliveries: [first, ...rest].map(
                ({ to, bouncedAt, bounceReason }) => ({
                  to,
                  bouncedAt,
                  bounceReason,
                }),
              ),
            },
          ],
          sentBy: first.sentBy,
          createdAt: first.createdAt,
        },
      },
    ];
  });
});

function openMessage(message: Message): void {
  quasar.dialog({
    component: MessageDetailsDialog,
    componentProps: {
      message,
      registrations: registrations.value ?? [],
    },
  });
}

const triggerLabel = (trigger: string): string => {
  const key = `audit.entities.messageTemplate.values.trigger.${trigger}`;
  return teGlobal(key) ? tGlobal(key) : trigger;
};

function buildEmailEntry({
  message,
  trigger,
}: ReceivedEmail): TimelineDisplayEntry {
  const warnings = (message.recipients?.[0]?.deliveries ?? [])
    .filter((delivery) => delivery.bouncedAt)
    .map((delivery) => t('timeline.bounced', { to: delivery.to ?? '—' }));
  const at = message.createdAt ?? '';

  return {
    id: `email-${message.id}`,
    at,
    title: trigger ? t('timeline.automatedEmail') : t('timeline.messageSent'),
    subtitle: at ? formatDateTime(at) : '',
    color: warnings.length > 0 ? 'negative' : 'info',
    icon: trigger ? 'mail_asterisk' : 'mail',
    fields: [],
    actor: message.sentBy?.name ?? null,
    ...(trigger ? { caption: triggerLabel(trigger) } : {}),
    note: message.subject,
    warnings,
    message,
  };
}

const { formatDateTime: formatAuditDateTime, actorLabel: resolveActorLabel } =
  useAuditTimeline();

const formatDateTime = (timestamp: string): string =>
  formatAuditDateTime(timestamp, locale.value);

const actorLabel = (actor: AuditActor | null): string | null =>
  resolveActorLabel(actor, t('timeline.deletedUser'));

const statusLabel = (status: string): string => {
  const key = `status.${status.toLowerCase()}`;
  return te(key) ? t(key) : status;
};

// Mirrors the status colors used in the dialog header / table cells.
const statusColor = (status: string): string => {
  switch (status) {
    case 'ACCEPTED':
      return 'positive';
    case 'PENDING':
      return 'info';
    default:
      return 'warning';
  }
};

const buildEntries = (entry: AuditLogEntry): TimelineDisplayEntry[] => {
  const shared = {
    at: entry.createdAt,
    subtitle: formatDateTime(entry.createdAt),
    actor: actorLabel(entry.actor),
  };

  if (entry.action === 'created') {
    return [
      {
        ...shared,
        id: entry.id,
        title: t('timeline.created'),
        color: 'positive',
        icon: 'how_to_reg',
        fields: [],
      },
    ];
  }

  if (entry.action === 'deleted') {
    return [
      {
        ...shared,
        id: entry.id,
        title: t('timeline.deleted'),
        color: 'negative',
        icon: 'delete',
        fields: [],
      },
    ];
  }

  const entries: TimelineDisplayEntry[] = [];

  // A status change is the most salient edit — surface it as its own entry,
  // titled with the new status and coloured by it (e.g. "Accepted").
  const status = entry.details?.values?.status;
  if (typeof status === 'string') {
    entries.push({
      ...shared,
      id: `${entry.id}-status`,
      title: statusLabel(status),
      color: statusColor(status),
      icon: 'swap_horiz',
      fields: [],
    });
  }

  const fields = entry.details?.changedFields ?? [];
  if (fields.length > 0) {
    entries.push({
      ...shared,
      id: `${entry.id}-fields`,
      title: t('timeline.updated'),
      color: 'primary',
      icon: 'edit',
      fields: fields.map(resolveField),
    });
  }

  return entries;
};

// Newest first, audit entries and messages interleaved.
const timelineEntries = computed<TimelineDisplayEntry[]>(() =>
  [
    ...auditEntries.value.flatMap(buildEntries),
    ...receivedEmails.value.map(buildEmailEntry),
  ].sort((a, b) => b.at.localeCompare(a.at)),
);

const personName = computed<string>(() => {
  const firstName = registration.value?.computedData.firstName?.trim() ?? '';
  const lastName = registration.value?.computedData.lastName?.trim() ?? '';
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName.length > 0 ? formatPersonName(fullName) : '?';
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

const translatedGender = computed<string>(() => {
  const g = registration.value?.computedData.gender;
  if (!g) {
    return '';
  }
  const key = `gender.${g}`;
  const result = t(key);

  return result === key ? g : result;
});

const translatedRole = computed<string>(() => {
  const r = registration.value?.computedData.role;
  if (!r) {
    return '';
  }
  const key = `role.${r}`;
  const result = t(key);

  return result === key ? r : result;
});

const formattedDateOfBirth = computed<string>(() => {
  const dob = registration.value?.computedData.dateOfBirth;
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
  const createdAt = registration.value?.createdAt;
  if (!createdAt) {
    return '';
  }
  const date = new Date(createdAt);
  return date.toLocaleString(locale.value, {
    year: 'numeric',
    month: '2-digit',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
});

const street = computed<string | null>(
  () => registration.value?.computedData.address.street ?? null,
);

const city = computed<string | null>(() => {
  const zipCode = registration.value?.computedData.address.zipCode;
  const city = registration.value?.computedData.address.city;

  if (zipCode == null && city == null) {
    return null;
  }

  return [zipCode, city].filter(Boolean).join(' ');
});

const country = computed<string | null>(() => {
  const country = registration.value?.computedData.address.country;
  if (country == null) {
    return country ?? null;
  }

  return te(`country.${country}`) ? t(`country.${country}`) : country;
});

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
  deleted: 'Deleted'
  by: 'by {actor}'
  changedFields: 'Changed:'
  deletedUser: 'Deleted user'
  messageSent: 'Message sent'
  automatedEmail: 'Automated email sent'
  viewMessage: 'View message'
  bounced: 'Not delivered to {to}'

action:
  close: 'Close'
  showFormData: 'Show form data'
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
  deleted: 'Gelöscht'
  by: 'von {actor}'
  changedFields: 'Geändert:'
  deletedUser: 'Gelöschter Benutzer'
  messageSent: 'Nachricht gesendet'
  automatedEmail: 'Automatische E-Mail gesendet'
  viewMessage: 'Nachricht ansehen'
  bounced: 'Nicht zugestellt an {to}'

action:
  close: 'Schließen'
  showFormData: 'Formulardaten anzeigen'
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
  deleted: 'Supprimé'
  by: 'par {actor}'
  changedFields: 'Modifié :'
  deletedUser: 'Utilisateur supprimé'
  messageSent: 'Message envoyé'
  automatedEmail: 'E-mail automatique envoyé'
  viewMessage: 'Voir le message'
  bounced: 'Non distribué à {to}'

action:
  close: 'Fermer'
  showFormData: 'Afficher les données du formulaire'
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
  deleted: 'Usunięto'
  by: 'przez {actor}'
  changedFields: 'Zmieniono:'
  deletedUser: 'Usunięty użytkownik'
  messageSent: 'Wysłano wiadomość'
  automatedEmail: 'Wysłano automatyczny e-mail'
  viewMessage: 'Zobacz wiadomość'
  bounced: 'Nie dostarczono do {to}'

action:
  close: 'Zamknij'
  showFormData: 'Pokaż dane formularza'
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
  deleted: 'Smazáno'
  by: 'uživatelem {actor}'
  changedFields: 'Změněno:'
  deletedUser: 'Smazaný uživatel'
  messageSent: 'Zpráva odeslána'
  automatedEmail: 'Automatický e-mail odeslán'
  viewMessage: 'Zobrazit zprávu'
  bounced: 'Nedoručeno na {to}'

action:
  close: 'Zavřít'
  showFormData: 'Zobrazit data formuláře'
</i18n>

<style scoped>
.details-card {
  background: var(--md3-surface-container-low);
  overflow: hidden;
}

.header-btn {
  color: var(--md3-on-surface-variant);
}

.audit-fields-label {
  color: var(--md3-on-surface-variant);
}

/* Chips flow and wrap; long question labels stay fully visible by wrapping
   their text rather than truncating. The raw path remains in the tooltip. */
.audit-field-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.audit-field-chip {
  max-width: 100%;
  height: auto;
  margin: 0;
}

.audit-field-chip :deep(.q-chip__content) {
  white-space: normal;
  overflow-wrap: anywhere;
  line-height: 1.25;
  padding-block: 3px;
}

.audit-warning {
  color: var(--md3-error);
}

@media (min-width: 600px) {
  .timeline-column {
    border-left: 1px solid var(--md3-outline-variant);
  }
}
</style>
