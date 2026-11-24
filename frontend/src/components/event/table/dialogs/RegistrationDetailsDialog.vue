<template>
  <responsive-dialog
    ref="dialogRef"
    :snap-points="[0.6, 'full']"
    @hide="onDialogHide"
  >
    <q-card
      v-if="registration"
      class="details-card column no-wrap"
      :class="sheet ? 'details-card--sheet' : 'rounded-xl'"
      :style="
        sheet ? undefined : { width: 'min(960px, 95vw)', maxWidth: 'none' }
      "
      :flat="sheet"
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
            >
              <q-item
                clickable
                :disable="!event"
                @click="showFormData"
              >
                <q-item-section>
                  {{ t('action.showFormData') }}
                </q-item-section>
              </q-item>
              <q-item
                clickable
                data-test="registration-history"
                @click="showHistory"
              >
                <q-item-section>
                  {{ t('action.history') }}
                </q-item-section>
              </q-item>
              <q-separator />
            </registration-action-list>
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

      <!-- Narrow: one column, the fee right after the facts. Wide: the facts
           span the top, contact and fee sit side by side below. -->
      <div class="details-body col scroll">
        <div class="details-grid">
          <section
            v-if="personalRows.length"
            class="area-wide"
          >
            <div class="section-title">{{ t('section.personal') }}</div>
            <div class="fact-grid">
              <div
                v-for="row in personalRows"
                :key="row.key"
                class="fact rounded-lg"
              >
                <div class="fact-label row items-center no-wrap">
                  <country-icon
                    v-if="row.country"
                    :country="row.country"
                    class="q-mr-sm"
                  />
                  <q-icon
                    v-else
                    :name="row.icon"
                    size="18px"
                    class="fact-icon q-mr-sm"
                  />
                  <span class="ellipsis">{{ row.label }}</span>
                </div>
                <div class="fact-value">
                  {{ row.value }}
                </div>
                <span
                  v-if="row.badge"
                  class="row-badge rounded-full"
                >
                  {{ row.badge }}
                </span>
              </div>
            </div>
          </section>

          <registration-fee-section
            class="area-side"
            :registration-id
          />

          <section
            v-if="emails?.length || phoneNumbers.length || hasAddress"
            class="area-main"
          >
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
                    @click.stop.prevent="copy(email)"
                  >
                    <q-tooltip>
                      {{ t('action.copy') }}
                    </q-tooltip>
                  </q-btn>
                </q-item-section>
              </q-item>

              <q-item
                v-for="phoneNumber in phoneNumbers"
                :key="phoneNumber"
                :href="`tel:${phoneNumber.replace(/\s/g, '')}`"
                class="segment"
                clickable
                tag="a"
              >
                <q-item-section avatar>
                  <div class="row-icon">
                    <q-icon
                      name="phone"
                      size="20px"
                    />
                  </div>
                </q-item-section>
                <q-item-section class="overflow-hidden">
                  <q-item-label class="row-label">
                    {{ t('field.phone') }}
                  </q-item-label>
                  <q-item-label class="row-value row-value--link ellipsis">
                    {{ phoneNumber }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn
                    class="row-action"
                    flat
                    icon="content_copy"
                    round
                    size="sm"
                    @click.stop.prevent="copy(phoneNumber)"
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

          <div
            v-if="!hasDetails"
            class="area-main empty-state column flex-center text-center q-pa-xl"
          >
            <q-icon
              name="inbox"
              size="40px"
            />
            <div class="text-body2 q-mt-sm">
              {{ t('empty') }}
            </div>
          </div>
        </div>
      </div>
    </q-card>
  </responsive-dialog>
</template>

<script setup lang="ts">
import { copyToClipboard, useDialogPluginComponent, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { countryName } from '@/utils/countries';
import { formatPhoneNumber } from '@/utils/formatPhoneNumber';
import { useRegistrationHelper } from '@/composables/registrationHelper';
import { useRegistrationsStore } from '@/stores/registration-store';
import { useEventDetailsStore } from '@/stores/event-details-store';
import RegistrationActionList from '@/components/event/table/RegistrationActionList.vue';
import RegistrationDialogHeader from '@/components/event/table/dialogs/RegistrationDialogHeader.vue';
import RegistrationFormViewDialog from '@/components/event/table/dialogs/RegistrationFormViewDialog.vue';
import RegistrationTimelineDialog from '@/components/event/table/dialogs/RegistrationTimelineDialog.vue';
import RegistrationFeeSection from '@/components/event/finances/fees/RegistrationFeeSection.vue';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import CountryIcon from '@/components/common/localization/CountryIcon.vue';

defineEmits([...useDialogPluginComponent.emits]);

const quasar = useQuasar();
// Mirrors ResponsiveDialog's switch to a bottom sheet.
const sheet = computed<boolean>(() => quasar.screen.lt.sm);
// eslint-disable-next-line @typescript-eslint/unbound-method
const { t, te, d, locale } = useI18n();
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

// Formatted before deduplicating, so one number entered twice in different
// notations is listed once.
const phoneNumbers = computed<string[]>(() => {
  const value = registration.value;
  if (!value?.computedData.phoneNumbers) {
    return [];
  }

  const countries = {
    country: registrationHelper.country(value),
    eventCountries: event.value?.countries ?? [],
  };

  return [
    ...new Set(
      value.computedData.phoneNumbers
        .map((phoneNumber) => phoneNumber.trim())
        .filter(Boolean)
        .map((phoneNumber) => formatPhoneNumber(phoneNumber, countries)),
    ),
  ];
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
  // Same format as the table's date cells
  return dob ? d(dob, { dateStyle: 'medium' }) : '';
});

const ageBadge = computed<string | undefined>(() => {
  const age = registration.value
    ? registrationHelper.age(registration.value)
    : undefined;
  return age !== undefined ? t('field.age', { age }) : undefined;
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
  // Shows this country's flag in place of the icon.
  country?: string;
  label: string;
  value: string;
  badge?: string | undefined;
}

// As in GenderTableCell; custom form options keep the generic icon.
const GENDER_ICONS: Record<string, string> = {
  m: 'male',
  f: 'female',
  d: 'transgender',
};

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
      badge: ageBadge.value,
    });
  }
  if (data.gender) {
    rows.push({
      key: 'gender',
      icon: GENDER_ICONS[data.gender] ?? 'wc',
      label: t('field.gender'),
      value: translatedGender.value,
    });
  }
  // With the role and room: how the person takes part. Only meaningful when
  // the event has several groups.
  if (value.group && (event.value?.countries.length ?? 0) > 1) {
    rows.push({
      key: 'group',
      icon: 'flag',
      country: value.group,
      label: t('field.group'),
      value: countryName(value.group, locale.value),
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
    personalRows.value.length > 0 ||
    !!emails.value?.length ||
    phoneNumbers.value.length > 0 ||
    hasAddress.value,
);

async function copy(value: string): Promise<void> {
  try {
    await copyToClipboard(value);
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

function showHistory(): void {
  if (!registration.value) {
    return;
  }

  const { firstName, lastName } = registration.value.computedData;
  quasar.dialog({
    component: RegistrationTimelineDialog,
    componentProps: {
      eventId,
      registrationId,
      createdAt: registration.value.createdAt,
      name: [firstName, lastName].filter(Boolean).join(' '),
    },
  });
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
      group: registration.value.group,
    },
  });
}
</script>

<i18n lang="yaml" locale="en">
section:
  personal: 'Personal'
  contact: 'Contact'
  address: 'Address'

field:
  group: 'Group'
  dateOfBirth: 'Date of Birth'
  age: 'Age {age}'
  gender: 'Gender'
  role: 'Role'
  email: 'Email'
  phone: 'Phone'
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
  history: 'History'
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

field:
  group: 'Gruppe'
  dateOfBirth: 'Geburtsdatum'
  age: 'Alter {age}'
  gender: 'Geschlecht'
  role: 'Rolle'
  email: 'E-Mail'
  phone: 'Telefon'
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
  history: 'Verlauf'
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

field:
  group: 'Groupe'
  dateOfBirth: 'Date de naissance'
  age: 'Âge {age}'
  gender: 'Genre'
  role: 'Rôle'
  email: 'E-mail'
  phone: 'Téléphone'
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
  history: 'Historique'
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

field:
  group: 'Grupa'
  dateOfBirth: 'Data urodzenia'
  age: 'Wiek {age}'
  gender: 'Płeć'
  role: 'Rola'
  email: 'E-mail'
  phone: 'Telefon'
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
  history: 'Historia'
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

field:
  group: 'Skupina'
  dateOfBirth: 'Datum narození'
  age: 'Věk {age}'
  gender: 'Pohlaví'
  role: 'Role'
  email: 'E-mail'
  phone: 'Telefon'
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
  history: 'Historie'
  copy: 'Kopírovat'
  showFormData: 'Zobrazit data formuláře'

notification:
  copied: 'Zkopírováno do schránky'
  copyFailed: 'Kopírování se nezdařilo'

empty: 'Pro tuto registraci nejsou k dispozici žádné podrobnosti'
</i18n>

<style scoped>
.details-card {
  max-height: min(840px, calc(100vh - 48px));
  background: var(--md3-surface-container-low);
  overflow: hidden;
}

.header-btn {
  color: var(--md3-on-surface-variant);
}

/* Only the body scrolls. Sized by its own width, so the layout follows the
   dialog rather than the viewport. */
.details-body {
  min-height: 0;
  padding: 8px 20px 20px;
  container-type: inline-size;
}

/* `dense` lets contact fill the row beside the fee though it comes later. */
.details-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-auto-flow: row dense;
  align-items: start;
  gap: 20px;
}

/* Short facts as tiles: two per row, an odd last one takes the full row. */
.fact-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.fact:last-child:nth-child(odd) {
  grid-column: 1 / -1;
}

/* Wide: the facts in one row of equal tiles; contact beside a fixed-width fee. */
@container (min-width: 640px) {
  .fact-grid {
    grid-template-columns: none;
    grid-auto-flow: column;
    grid-auto-columns: minmax(0, 1fr);
  }

  .fact:last-child:nth-child(odd) {
    grid-column: auto;
  }

  .details-grid:has(> .area-side) {
    grid-template-columns: minmax(0, 1fr) 320px;
  }

  .details-grid .area-wide {
    grid-column: 1 / -1;
  }

  .details-grid:has(> .area-side) .area-main {
    grid-column: 1;
  }

  .details-grid .area-side {
    grid-column: 2;
  }
}

/* The sheet draws the surface and sets the height. */
.details-card--sheet {
  width: 100%;
  height: 100%;
  max-height: none;
  background: transparent;
}

.details-card--sheet :deep(.dialog-header) {
  padding-top: 0;
}

.details-card--sheet .details-body {
  padding: 8px 16px calc(16px + env(safe-area-inset-bottom));
}

.section-title {
  padding: 0 4px 8px;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--md3-primary);
}

.fact {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  min-width: 0;
  padding: 12px 14px;
  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface);
}

.fact-label {
  max-width: 100%;
  font-size: 0.75rem;
  line-height: 1rem;
  letter-spacing: 0.02em;
  color: var(--md3-on-surface-variant);
}

.fact-icon {
  color: var(--md3-primary);
}

.fact-value {
  max-width: 100%;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.5rem;
  overflow-wrap: anywhere;
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

.row-badge {
  display: inline-block;
  padding: 2px 10px;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.125rem;
  white-space: nowrap;
  background: var(--md3-tertiary-container);
  color: var(--md3-on-tertiary-container);
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
</style>
