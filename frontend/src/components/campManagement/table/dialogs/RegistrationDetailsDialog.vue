<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card style="min-width: min(580px, 95vw); max-width: min(900px, 95vw)">
      <!-- Header -->
      <q-card-section class="row items-center no-wrap q-py-sm">
        <q-icon
          color="primary"
          name="person"
          size="sm"
        />
        <div class="col-grow q-ml-sm text-h6 ellipsis">
          {{ personName }}
        </div>

        <q-chip
          :color="statusColor"
          class="q-ml-sm q-mr-xs"
          dense
          size="sm"
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
          <div class="col-12 col-md-6">
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
                      {{ email }}
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
                    <q-item-label v-if="registration.computedData.address.street">
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
                    <q-item-label v-if="registration.computedData.address.country">
                      {{ registration.computedData.address.country }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </template>
          </div>

          <!-- Right column: room + timeline -->
          <div class="col-12 col-md-6 timeline-column">
            <!-- Room (registration metadata) -->
            <template v-if="registration.room">
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

              <q-separator inset />
            </template>

            <!-- Timeline -->
            <q-list>
              <q-item-label header>
                {{ t('section.timeline') }}
              </q-item-label>
            </q-list>

            <q-timeline
              class="q-px-md"
              color="primary"
              layout="comfortable"
            >
              <q-timeline-entry
                :subtitle="formattedCreatedAt"
                :title="t('timeline.registered')"
                color="positive"
                icon="how_to_reg"
              />
            </q-timeline>

            <p class="text-caption text-grey-6 text-center q-px-md q-pb-md">
              {{ t('timeline.moreComingSoon') }}
            </p>
          </div>
        </div>
      </q-scroll-area>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import type { Registration } from '@camp-registration/common/entities';
import { useObjectTranslation } from 'src/composables/objectTranslation';

defineEmits([...useDialogPluginComponent.emits]);

const { t, locale } = useI18n();
const { to } = useObjectTranslation();
const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent();

const { registration } = defineProps<{
  registration: Registration;
}>();

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

const formattedCreatedAt = computed<string>(() => {
  const date = new Date(registration.createdAt);
  return date.toLocaleString(locale.value, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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
  moreComingSoon: 'More timeline events will be available in a future update.'

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
  moreComingSoon: 'Weitere Zeitstrahl-Einträge werden in einem zukünftigen Update verfügbar sein.'

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
  moreComingSoon: "D'autres événements seront disponibles dans une future mise à jour."

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
  moreComingSoon: 'Więcej wpisów będzie dostępnych w przyszłej aktualizacji.'

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
  moreComingSoon: 'Další záznamy budou dostupné v budoucí aktualizaci.'

action:
  close: 'Zavřít'
</i18n>

<style scoped>
@media (min-width: 1024px) {
  .timeline-column {
    border-left: 1px solid rgba(0, 0, 0, 0.12);
  }
}
</style>
