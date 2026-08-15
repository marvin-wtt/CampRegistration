<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="organization-details-card">
      <q-card-section class="q-pb-sm">
        <div class="row items-start no-wrap">
          <div class="col">
            <div class="text-h6">{{ organization.name }}</div>
            <div class="text-caption text-on-surface-variant">
              {{
                t('submitted', {
                  date: d(new Date(organization.submittedAt), 'short'),
                })
              }}
            </div>
          </div>
          <q-chip
            dense
            square
            :class="`status--${organization.verificationStatus.toLowerCase()}`"
          >
            {{ t(`status.${organization.verificationStatus}`) }}
          </q-chip>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="scroll details-body">
        <div
          v-for="group in groups"
          :key="group.title"
          class="q-mb-md"
        >
          <div class="section-label q-mb-xs">{{ group.title }}</div>
          <div
            v-for="row in group.rows"
            :key="row.label"
            class="detail-row row items-baseline"
          >
            <div class="detail-label col-12 col-sm-5">{{ row.label }}</div>
            <div class="col-12 col-sm-7">
              <a
                v-if="row.href && row.value"
                :href="row.href"
                target="_blank"
                rel="noopener noreferrer"
                class="detail-link"
              >
                {{ row.value }}
              </a>
              <span
                v-else
                :class="{ 'text-on-surface-variant': !row.value }"
              >
                {{ row.value || '—' }}
              </span>
            </div>
          </div>
        </div>

        <q-banner
          v-if="organization.verificationNote"
          dense
          class="note-banner rounded-md"
        >
          <template #avatar>
            <q-icon name="sticky_note_2" />
          </template>
          <div class="text-caption text-weight-medium">
            {{ t('field.verificationNote') }}
          </div>
          <div class="text-body2">{{ organization.verificationNote }}</div>
        </q-banner>

        <q-banner
          v-if="organization.reviewNote"
          dense
          class="review-banner rounded-md q-mt-sm"
        >
          <template #avatar>
            <q-icon name="rate_review" />
          </template>
          <div class="text-caption text-weight-medium">
            {{ t('field.reviewNote') }}
          </div>
          <div class="text-body2">{{ organization.reviewNote }}</div>
        </q-banner>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn
          v-close-popup
          :label="t('action.close')"
          flat
          rounded
          no-caps
          color="primary"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { countryName } from '@/utils/countries';
import type { Organization } from '@camp-registration/common/entities';

const props = defineProps<{ organization: Organization }>();

const { dialogRef, onDialogHide } = useDialogPluginComponent();
const { t, d, locale } = useI18n();
defineEmits([...useDialogPluginComponent.emits]);

interface DetailRow {
  label: string;
  value: string;
  href?: string | undefined;
}

const groups = computed<{ title: string; rows: DetailRow[] }[]>(() => {
  const organization = props.organization;

  return [
    {
      title: t('section.contact'),
      rows: [
        {
          label: t('field.contactEmail'),
          value: organization.contactEmail,
          href: `mailto:${organization.contactEmail}`,
        },
        { label: t('field.phone'), value: organization.phone ?? '' },
        {
          label: t('field.website'),
          value: organization.website ?? '',
          href: organization.website ?? undefined,
        },
      ],
    },
    {
      title: t('section.registration'),
      rows: [
        { label: t('field.address'), value: organization.addressStreet },
        {
          label: t('field.city'),
          value: `${organization.addressZipCode} ${organization.addressCity}`,
        },
        {
          label: t('field.country'),
          value: countryName(organization.country, locale.value),
        },
        {
          label: t('field.registrationNumber'),
          value: organization.registrationNumber,
        },
      ],
    },
  ];
});
</script>

<style lang="scss" scoped>
.organization-details-card {
  width: 560px;
  max-width: 90vw;
}

.details-body {
  max-height: 60vh;
}

.section-label {
  color: var(--md3-on-surface-variant);
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.detail-row {
  padding: 0.25rem 0;
}

.detail-label {
  color: var(--md3-on-surface-variant);
}

.detail-link {
  color: var(--md3-primary);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.note-banner {
  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface-variant);
}

.review-banner {
  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
}

.status--verified {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
}

.status--pending {
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}

.status--rejected {
  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
}
</style>

<i18n lang="yaml" locale="en">
submitted: 'Submitted {date}'
status:
  PENDING: 'Awaiting review'
  VERIFIED: 'Verified'
  REJECTED: 'Rejected'
section:
  contact: 'Contact'
  registration: 'Registered address'
field:
  contactEmail: 'Contact email'
  phone: 'Phone'
  website: 'Website'
  address: 'Street and number'
  city: 'Postal code and city'
  country: 'Country'
  registrationNumber: 'Registration number'
  verificationNote: 'Note from the applicant'
  reviewNote: 'Previous review note'
action:
  close: 'Close'
</i18n>

<i18n lang="yaml" locale="de">
submitted: 'Eingereicht am {date}'
status:
  PENDING: 'Wartet auf Prüfung'
  VERIFIED: 'Verifiziert'
  REJECTED: 'Abgelehnt'
section:
  contact: 'Kontakt'
  registration: 'Eingetragene Adresse'
field:
  contactEmail: 'Kontakt-E-Mail'
  phone: 'Telefon'
  website: 'Website'
  address: 'Straße und Hausnummer'
  city: 'PLZ und Stadt'
  country: 'Land'
  registrationNumber: 'Registernummer'
  verificationNote: 'Hinweis der Organisation'
  reviewNote: 'Vorherige Prüfnotiz'
action:
  close: 'Schließen'
</i18n>

<i18n lang="yaml" locale="fr">
submitted: 'Soumise le {date}'
status:
  PENDING: 'En attente de contrôle'
  VERIFIED: 'Vérifiée'
  REJECTED: 'Refusée'
section:
  contact: 'Contact'
  registration: 'Adresse enregistrée'
field:
  contactEmail: 'E-mail de contact'
  phone: 'Téléphone'
  website: 'Site web'
  address: 'Rue et numéro'
  city: 'Code postal et ville'
  country: 'Pays'
  registrationNumber: "Numéro d'enregistrement"
  verificationNote: "Note de l'organisation"
  reviewNote: 'Note de contrôle précédente'
action:
  close: 'Fermer'
</i18n>

<i18n lang="yaml" locale="pl">
submitted: 'Zgłoszono {date}'
status:
  PENDING: 'Oczekuje na sprawdzenie'
  VERIFIED: 'Zweryfikowana'
  REJECTED: 'Odrzucona'
section:
  contact: 'Kontakt'
  registration: 'Adres rejestrowy'
field:
  contactEmail: 'E-mail kontaktowy'
  phone: 'Telefon'
  website: 'Strona internetowa'
  address: 'Ulica i numer'
  city: 'Kod pocztowy i miasto'
  country: 'Kraj'
  registrationNumber: 'Numer rejestrowy'
  verificationNote: 'Uwaga od organizacji'
  reviewNote: 'Poprzednia uwaga weryfikatora'
action:
  close: 'Zamknij'
</i18n>

<i18n lang="yaml" locale="cs">
submitted: 'Odesláno {date}'
status:
  PENDING: 'Čeká na kontrolu'
  VERIFIED: 'Ověřená'
  REJECTED: 'Zamítnutá'
section:
  contact: 'Kontakt'
  registration: 'Registrovaná adresa'
field:
  contactEmail: 'Kontaktní e-mail'
  phone: 'Telefon'
  website: 'Web'
  address: 'Ulice a číslo'
  city: 'PSČ a město'
  country: 'Země'
  registrationNumber: 'Registrační číslo'
  verificationNote: 'Poznámka od organizace'
  reviewNote: 'Předchozí poznámka z kontroly'
action:
  close: 'Zavřít'
</i18n>
