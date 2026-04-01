<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card style="min-width: min(580px, 95vw); max-width: 640px">
      <q-bar class="text-white">
        <q-icon name="person" />
        <div class="q-ml-sm text-subtitle1 text-weight-medium ellipsis">
          {{ personName }}
        </div>

        <q-space />

        <q-badge
          :color="statusColor"
          :label="t(`status.${registration.status.toLowerCase()}`)"
          class="q-mr-sm"
          rounded
        />

        <q-btn
          v-close-popup
          dense
          flat
          icon="close"
          @click="onDialogCancel"
        >
          <q-tooltip>
            {{ t('action.close') }}
          </q-tooltip>
        </q-btn>
      </q-bar>

      <q-scroll-area style="height: min(520px, 65vh)">
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
                {{ registration.computedData.gender }}
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
              <q-item-label>{{ registration.computedData.role }}</q-item-label>
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

        <!-- Registration Metadata -->
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
                name="schedule"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label overline>
                {{ t('field.createdAt') }}
              </q-item-label>
              <q-item-label>
                {{ formattedCreatedAt }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-if="registration.room">
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

        <!-- Timeline (placeholder for future events) -->
        <q-separator inset />
        <q-list>
          <q-item-label header>
            {{ t('section.timeline') }}
          </q-item-label>

          <q-item class="justify-center q-py-md">
            <q-item-section class="items-center text-grey-6">
              <q-icon
                name="timeline"
                size="2rem"
              />
              <q-item-label class="q-mt-sm">
                {{ t('timeline.empty') }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
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
    case 'WAITLISTED':
      return 'info';
    default:
      return 'warning';
  }
});

const hasAddress = computed<boolean>(() => {
  const addr = registration.computedData.address;
  return !!(addr.street || addr.city || addr.zipCode || addr.country);
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
  createdAt: 'Registered On'
  room: 'Room'

timeline:
  empty: 'No timeline events yet.'

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
  createdAt: 'Angemeldet am'
  room: 'Zimmer'

timeline:
  empty: 'Noch keine Ereignisse.'

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
  createdAt: 'Inscrit le'
  room: 'Chambre'

timeline:
  empty: "Aucun événement pour l'instant."

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
  createdAt: 'Zarejestrowano'
  room: 'Pokój'

timeline:
  empty: 'Brak wydarzeń w historii.'

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
  createdAt: 'Zaregistrováno'
  room: 'Pokoj'

timeline:
  empty: 'Zatím žádné události.'

action:
  close: 'Zavřít'
</i18n>

<style scoped></style>
