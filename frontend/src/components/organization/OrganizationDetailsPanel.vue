<template>
  <div>
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

    <!-- Part of what a moderator vets: an organization cannot be verified
         until it has published a complete notice, so the decision needs to
         be made with the notice on screen. -->
    <q-expansion-item
      class="q-mt-sm"
      @show="loadNotice"
    >
      <template #header>
        <q-item-section avatar>
          <q-icon name="privacy_tip" />
        </q-item-section>
        <q-item-section>{{ t('privacyNotice.title') }}</q-item-section>
        <q-item-section
          v-if="noticeState === 'missing' || noticeState === 'ready'"
          side
        >
          <q-chip
            dense
            square
            :class="
              noticeState === 'ready' ? 'notice--published' : 'notice--missing'
            "
          >
            {{
              noticeState === 'ready'
                ? t('privacyNotice.published')
                : t('privacyNotice.notPublished')
            }}
          </q-chip>
        </q-item-section>
      </template>

      <q-banner
        v-if="noticeState === 'missing'"
        dense
        class="review-banner rounded-md"
      >
        {{ t('privacyNotice.missing') }}
      </q-banner>
      <div
        v-else-if="noticeState === 'loading'"
        class="q-pa-md"
      >
        <q-spinner size="24px" />
      </div>
      <privacy-notice
        v-else-if="notice"
        :notice
        class="q-pa-md"
      />
    </q-expansion-item>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { countryName } from '@/utils/countries';
import type { Organization } from '@camp-registration/common/entities';
import {
  composePrivacyNotice,
  supervisoryAuthorityFor,
  type PublishedPrivacyNotice,
} from '@camp-registration/common/privacy';
import PrivacyNotice from '@/components/privacy/PrivacyNotice.vue';
import { usePrivacyNoticeService } from '@/services/PrivacyNoticeService';

const props = defineProps<{
  organization: Organization;
  /**
   * Fetch the notice up front instead of on expand, so its state shows in the
   * header. Worth the extra request where the notice gates the decision being
   * made — verification is refused while it is unpublished.
   */
  eagerNotice?: boolean;
}>();

const { t, locale } = useI18n();
const { fetchOrganizationNotice } = usePrivacyNoticeService();

const noticeState = ref<'idle' | 'loading' | 'ready' | 'missing'>('idle');
const notice = ref<PublishedPrivacyNotice | null>(null);

onMounted(() => {
  if (props.eagerNotice) {
    void loadNotice();
  }
});

/**
 * Assembled here rather than fetched: the moderator reviews the organization's
 * own notice, which has no event to compose it against, and the controller
 * identity and supervisory authority are already derivable from the
 * organization on screen.
 */
async function loadNotice() {
  if (noticeState.value !== 'idle') {
    return;
  }

  noticeState.value = 'loading';
  try {
    const stored = await fetchOrganizationNotice(props.organization.id);

    if (stored.publishedVersion === null) {
      noticeState.value = 'missing';
      return;
    }

    notice.value = {
      controller: {
        name: props.organization.name,
        contactEmail: props.organization.contactEmail,
        phone: props.organization.phone,
        website: props.organization.website,
        addressStreet: props.organization.addressStreet,
        addressZipCode: props.organization.addressZipCode,
        addressCity: props.organization.addressCity,
        country: props.organization.country,
        registrationNumber: props.organization.registrationNumber,
      },
      supervisoryAuthority: supervisoryAuthorityFor(props.organization.country),
      notice: composePrivacyNotice(stored.content),
      organizationVersion: stored.publishedVersion,
      eventVersion: null,
    };
    noticeState.value = 'ready';
  } catch {
    noticeState.value = 'missing';
  }
}

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
          value: organization.registrationNumber ?? '',
        },
      ],
    },
  ];
});
</script>

<style lang="scss" scoped>
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

.notice--published {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
}

.notice--missing {
  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
}
</style>

<i18n lang="yaml" locale="en">
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
privacyNotice:
  title: 'Privacy notice'
  published: 'Published'
  notPublished: 'Not published'
  missing: 'This organisation has not published a privacy notice. It cannot be verified until it does.'
</i18n>

<i18n lang="yaml" locale="de">
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
privacyNotice:
  title: 'Datenschutzinformationen'
  published: 'Veröffentlicht'
  notPublished: 'Nicht veröffentlicht'
  missing: 'Diese Organisation hat keine Datenschutzinformationen veröffentlicht. Bis dahin kann sie nicht verifiziert werden.'
</i18n>

<i18n lang="yaml" locale="fr">
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
privacyNotice:
  title: 'Informations sur la protection des données'
  published: 'Publiées'
  notPublished: 'Non publiées'
  missing: "Cette organisation n'a pas publié d'informations sur la protection des données. Elle ne peut pas être vérifiée tant que ce n'est pas fait."
</i18n>

<i18n lang="yaml" locale="pl">
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
privacyNotice:
  title: 'Informacje o ochronie danych'
  published: 'Opublikowane'
  notPublished: 'Nieopublikowane'
  missing: 'Ta organizacja nie opublikowała informacji o ochronie danych. Do tego czasu nie może zostać zweryfikowana.'
</i18n>

<i18n lang="yaml" locale="cs">
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
privacyNotice:
  title: 'Informace o ochraně osobních údajů'
  published: 'Zveřejněné'
  notPublished: 'Nezveřejněné'
  missing: 'Tato organizace nezveřejnila informace o ochraně osobních údajů. Do té doby ji nelze ověřit.'
</i18n>
