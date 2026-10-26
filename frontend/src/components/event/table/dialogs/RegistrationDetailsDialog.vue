<template>
  <responsive-dialog
    ref="dialogRef"
    :snap-points="[0.6, 'full']"
    @hide="onDialogHide"
  >
    <q-card
      v-if="registration"
      class="details-card"
      :class="sheet ? 'details-card--sheet' : 'rounded-xl'"
      :style="sheet ? undefined : { width: 'min(560px, 95vw)' }"
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
        v-if="canViewTimeline || showPayments"
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
          v-if="showPayments"
          name="payments"
          :label="t('tab.payments')"
          data-test="registration-tab-payments"
        />
        <q-tab
          v-if="canViewTimeline"
          name="timeline"
          :label="t('section.timeline')"
        />
      </q-tabs>

      <q-tab-panels
        v-model="activeTab"
        animated
        class="details-panels bg-transparent"
      >
        <q-tab-panel
          name="details"
          class="q-pa-none"
        >
          <div
            v-if="hasDetails || showPayments"
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
                      <country-icon
                        v-if="row.country"
                        :country="row.country"
                      />
                      <q-icon
                        v-else
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
                  <q-item-section
                    v-if="row.badge"
                    side
                  >
                    <span class="row-badge rounded-full">{{ row.badge }}</span>
                  </q-item-section>
                </q-item>
              </q-list>
            </section>

            <section v-if="emails?.length || phoneNumbers.length || hasAddress">
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

            <!-- The glance stays here; the history and actions have a tab. -->
            <section v-if="showPayments">
              <div class="section-title">{{ t('section.payment') }}</div>
              <q-list class="segmented-list">
                <q-item
                  class="segment"
                  clickable
                  data-test="registration-payment-summary"
                  @click="activeTab = 'payments'"
                >
                  <q-item-section avatar>
                    <div class="row-icon">
                      <q-icon
                        name="payments"
                        size="20px"
                      />
                    </div>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="row-label">
                      {{ paymentSummary.label }}
                    </q-item-label>
                    <q-item-label class="row-value">
                      {{ paymentSummary.value }}
                    </q-item-label>
                    <q-item-label
                      v-if="paymentSummary.caption"
                      class="row-caption"
                    >
                      {{ paymentSummary.caption }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <div class="row items-center no-wrap q-gutter-x-xs">
                      <payment-status-chip
                        v-if="registration.payment.status !== 'NOT_REQUIRED'"
                        :status="registration.payment.status"
                      />
                      <q-icon
                        name="chevron_right"
                        size="20px"
                        class="row-action"
                      />
                    </div>
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
          v-if="showPayments && event"
          name="payments"
          class="q-pa-none"
          lazy-render
        >
          <div class="details-panel scroll">
            <registration-payments-section
              :event-id="event.id"
              :registration
            />
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
  </responsive-dialog>
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
import { countryName } from '@/utils/countries';
import { formatPhoneNumber } from '@/utils/formatPhoneNumber';
import { useRegistrationHelper } from '@/composables/registrationHelper';
import { useRegistrationsStore } from '@/stores/registration-store';
import { useEventDetailsStore } from '@/stores/event-details-store';
import RegistrationActionList from '@/components/event/table/RegistrationActionList.vue';
import RegistrationDialogHeader from '@/components/event/table/dialogs/RegistrationDialogHeader.vue';
import RegistrationFormViewDialog from '@/components/event/table/dialogs/RegistrationFormViewDialog.vue';
import RegistrationTimeline from '@/components/event/table/dialogs/RegistrationTimeline.vue';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import CountryIcon from '@/components/common/localization/CountryIcon.vue';
import RegistrationPaymentsSection from '@/components/event/payment/RegistrationPaymentsSection.vue';
import PaymentStatusChip from '@/components/event/payment/PaymentStatusChip.vue';
import { formatMoney } from '@camp-registration/common/utils';
import { useEventSettings } from '@/composables/eventSettings';
import {
  type PaymentSettings,
  SETTING_KEYS,
} from '@camp-registration/common/settings';

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

const { registrationId, initialTab = 'details' } = defineProps<{
  registrationId: string;
  initialTab?: 'details' | 'payments' | 'timeline';
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
const activeTab = ref<'details' | 'payments' | 'timeline'>(initialTab);

const { settings: paymentSettings } = useEventSettings<
  Pick<PaymentSettings, 'enabled'>
>(SETTING_KEYS.PAYMENT, { enabled: false });

// Only while the event collects payments and this registration owes (or has
// paid) anything. Money already recorded stays visible after payments are
// turned off; a mere quote does not.
const showPayments = computed<boolean>(() => {
  const payment = registration.value?.payment;
  if (!can('event.payments.view') || !payment) {
    return false;
  }
  if (payment.status === 'NOT_REQUIRED') {
    return false;
  }

  return (
    paymentSettings.enabled ||
    payment.amountPaid > 0 ||
    payment.status === 'REFUNDED'
  );
});

// What the payments tab holds, at a glance: what is open, else what was paid.
const paymentSummary = computed(() => {
  const payment = registration.value?.payment;
  if (!payment) {
    return { label: '', value: '', caption: null };
  }
  const money = (minor: number) =>
    formatMoney(minor, payment.currency, locale.value);
  // Both amounts named, so "200 € of 200 €" can't read like a page count.
  const caption =
    payment.amountDue === null
      ? null
      : t('payment.figures', {
          paid: money(payment.amountPaid),
          due: money(payment.amountDue),
        });

  if (payment.overpaid > 0) {
    return {
      label: t('payment.overpaid'),
      value: money(payment.overpaid),
      caption,
    };
  }
  if (payment.outstanding > 0) {
    return {
      label: t('payment.open'),
      value: money(payment.outstanding),
      caption,
    };
  }

  return {
    label: t('payment.paid'),
    value: money(payment.amountPaid),
    caption: null,
  };
});

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
  payment: 'Payment'
  personal: 'Personal'
  contact: 'Contact'
  address: 'Address'
  timeline: 'Timeline'

tab:
  payments: 'Payments'
  details: 'Details'

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
  copy: 'Copy'
  showFormData: 'Show form data'

notification:
  copied: 'Copied to clipboard'
  copyFailed: 'Copying failed'

empty: 'No details available for this registration'
payment:
  open: 'Open'
  paid: 'Paid'
  overpaid: 'Overpaid by'
  figures: '{paid} paid · {due} due'
</i18n>

<i18n lang="yaml" locale="de">
section:
  payment: 'Zahlung'
  personal: 'Persönliches'
  contact: 'Kontakt'
  address: 'Adresse'
  timeline: 'Verlauf'

tab:
  payments: 'Zahlungen'
  details: 'Details'

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
  copy: 'Kopieren'
  showFormData: 'Formulardaten anzeigen'

notification:
  copied: 'In die Zwischenablage kopiert'
  copyFailed: 'Kopieren fehlgeschlagen'

empty: 'Für diese Anmeldung sind keine Details verfügbar'
payment:
  open: 'Offen'
  paid: 'Bezahlt'
  overpaid: 'Überzahlt um'
  figures: '{paid} bezahlt · {due} fällig'
</i18n>

<i18n lang="yaml" locale="fr">
section:
  payment: 'Paiement'
  personal: 'Informations personnelles'
  contact: 'Contact'
  address: 'Adresse'
  timeline: 'Historique'

tab:
  payments: 'Paiements'
  details: 'Détails'

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
  copy: 'Copier'
  showFormData: 'Afficher les données du formulaire'

notification:
  copied: 'Copié dans le presse-papiers'
  copyFailed: 'Échec de la copie'

empty: 'Aucun détail disponible pour cette inscription'
payment:
  open: 'À payer'
  paid: 'Payé'
  overpaid: 'Trop-perçu de'
  figures: '{paid} payés · {due} dus'
</i18n>

<i18n lang="yaml" locale="pl">
section:
  payment: 'Płatność'
  personal: 'Dane osobowe'
  contact: 'Kontakt'
  address: 'Adres'
  timeline: 'Historia'

tab:
  payments: 'Płatności'
  details: 'Szczegóły'

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
  copy: 'Kopiuj'
  showFormData: 'Pokaż dane formularza'

notification:
  copied: 'Skopiowano do schowka'
  copyFailed: 'Kopiowanie nie powiodło się'

empty: 'Brak szczegółów dla tego zgłoszenia'
payment:
  open: 'Do zapłaty'
  paid: 'Zapłacono'
  overpaid: 'Nadpłata'
  figures: 'Zapłacono {paid} · do zapłaty {due}'
</i18n>

<i18n lang="yaml" locale="cs">
section:
  payment: 'Platba'
  personal: 'Osobní údaje'
  contact: 'Kontakt'
  address: 'Adresa'
  timeline: 'Časová osa'

tab:
  payments: 'Platby'
  details: 'Podrobnosti'

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
  copy: 'Kopírovat'
  showFormData: 'Zobrazit data formuláře'

notification:
  copied: 'Zkopírováno do schránky'
  copyFailed: 'Kopírování se nezdařilo'

empty: 'Pro tuto registraci nejsou k dispozici žádné podrobnosti'
payment:
  open: 'Nezaplaceno'
  paid: 'Zaplaceno'
  overpaid: 'Přeplaceno o'
  figures: 'Zaplaceno {paid} · splatné {due}'
</i18n>

<style scoped lang="scss">
@use '../../../../css/segmented-list';

.details-card {
  background: var(--md3-surface-container-low);
  overflow: hidden;
}

.header-btn {
  color: var(--md3-on-surface-variant);
}

/* One height for every tab, so switching tabs doesn't resize the dialog. */
.details-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 16px;
  height: min(480px, 62vh);
}

.timeline-panel {
  height: min(480px, 62vh);
}

/* The sheet draws the surface and sets the height: header, tabs and actions
   stay put, the panels fill the rest and scroll. */
.details-card--sheet {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: transparent;
}

.details-card--sheet :deep(.dialog-header) {
  padding-top: 0;
  background: transparent;
}

.details-card--sheet .details-tabs {
  background: transparent;
}

.details-card--sheet .details-panels {
  flex: 1;
  min-height: 0;
}

.details-card--sheet .details-panel {
  height: 100%;
}

.details-card--sheet .empty-state,
.details-card--sheet .timeline-panel {
  height: 100%;
}

.details-card--sheet .details-actions {
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
}

.empty-state {
  height: min(480px, 62vh);
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
