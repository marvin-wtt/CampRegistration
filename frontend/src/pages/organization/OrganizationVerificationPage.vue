<template>
  <page-state-handler
    padding
    :error
    :loading="isLoading"
    class="row justify-center"
  >
    <div
      v-if="organization"
      class="column col-sm-10 col-md-8 col-12 q-gutter-md"
    >
      <div class="text-h6">{{ t('title') }}</div>

      <q-banner
        :class="`status-banner status--${organization.verificationStatus.toLowerCase()} rounded-md`"
      >
        <template #avatar>
          <q-icon :name="statusIcon" />
        </template>
        <div class="text-weight-medium">
          {{ t(`status.${organization.verificationStatus}.title`) }}
        </div>
        <div class="text-body2">
          {{ t(`status.${organization.verificationStatus}.description`) }}
        </div>
      </q-banner>

      <q-banner
        v-if="organization.reviewNote"
        class="review-note rounded-md"
      >
        <template #avatar>
          <q-icon name="rate_review" />
        </template>
        <div class="text-weight-medium">{{ t('reviewNote') }}</div>
        <div class="text-body2">{{ organization.reviewNote }}</div>
      </q-banner>

      <q-list
        bordered
        separator
        class="rounded-lg"
      >
        <q-item
          v-for="row in details"
          :key="row.label"
        >
          <q-item-section>
            <q-item-label caption>{{ row.label }}</q-item-label>
            <q-item-label>{{ row.value || '—' }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>

      <div
        v-if="organization.verificationStatus === 'REJECTED'"
        class="row justify-end"
      >
        <q-btn
          color="primary"
          :label="t('action.resubmit')"
          rounded
          unelevated
          no-caps
          :disable="!canOrg('organization.edit')"
          @click="resubmit"
        />
      </div>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import { useOrganizationDetailsStore } from '@/stores/organization-details-store';
import { useOrganizationPermissions } from '@/composables/organizationPermissions';
import { countryName } from '@/utils/countries';

const { t, locale } = useI18n();
const store = useOrganizationDetailsStore();
const { data: organization, isLoading, error } = storeToRefs(store);
const { canOrg } = useOrganizationPermissions();

const statusIcon = computed(() => {
  const status = organization.value?.verificationStatus;
  if (status === 'VERIFIED') return 'verified';
  if (status === 'REJECTED') return 'cancel';
  return 'hourglass_empty';
});

const details = computed(() => {
  const value = organization.value;
  if (!value) {
    return [];
  }

  return [
    {
      label: t('field.address'),
      value: `${value.addressStreet}, ${value.addressZipCode} ${value.addressCity}, ${countryName(value.country, locale.value)}`,
    },
    { label: t('field.registrationNumber'), value: value.registrationNumber },
    { label: t('field.contactEmail'), value: value.contactEmail },
    { label: t('field.phone'), value: value.phone ?? '' },
    { label: t('field.website'), value: value.website ?? '' },
    { label: t('field.note'), value: value.verificationNote ?? '' },
  ];
});

async function resubmit() {
  await store.submitVerification();
}

onMounted(async () => {
  await store.fetchData();
});
</script>

<style lang="scss" scoped>
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

.review-note {
  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface-variant);
}
</style>

<i18n lang="yaml" locale="en">
title: 'Verification'
reviewNote: 'Reviewer note'
status:
  PENDING:
    title: 'Awaiting verification'
    description: 'You can already build camps. They stay private drafts until an administrator verifies this organization.'
  VERIFIED:
    title: 'Verified'
    description: 'This organization can publish camps and send newsletters.'
  REJECTED:
    title: 'Rejected'
    description: 'Correct the details in settings, then submit for verification again.'
field:
  address: 'Address'
  registrationNumber: 'Registration number'
  contactEmail: 'Contact email'
  phone: 'Phone'
  website: 'Website'
  note: 'Note for the reviewer'
action:
  resubmit: 'Submit for verification'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Verifizierung'
reviewNote: 'Hinweis der Prüfung'
status:
  PENDING:
    title: 'Warten auf Verifizierung'
    description: 'Du kannst bereits Camps anlegen. Sie bleiben private Entwürfe, bis ein Administrator diese Organisation verifiziert.'
  VERIFIED:
    title: 'Verifiziert'
    description: 'Diese Organisation kann Camps veröffentlichen und Newsletter versenden.'
  REJECTED:
    title: 'Abgelehnt'
    description: 'Korrigiere die Angaben in den Einstellungen und reiche sie erneut zur Verifizierung ein.'
field:
  address: 'Adresse'
  registrationNumber: 'Registernummer'
  contactEmail: 'Kontakt-E-Mail'
  phone: 'Telefon'
  website: 'Website'
  note: 'Hinweis für die Prüfung'
action:
  resubmit: 'Zur Verifizierung einreichen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Vérification'
reviewNote: 'Note du vérificateur'
status:
  PENDING:
    title: 'En attente de vérification'
    description: "Tu peux déjà préparer des camps. Ils restent des brouillons privés jusqu'à la vérification de cette organisation."
  VERIFIED:
    title: 'Vérifiée'
    description: 'Cette organisation peut publier des camps et envoyer des newsletters.'
  REJECTED:
    title: 'Refusée'
    description: 'Corrige les informations dans les paramètres, puis soumets à nouveau.'
field:
  address: 'Adresse'
  registrationNumber: "Numéro d'enregistrement"
  contactEmail: 'E-mail de contact'
  phone: 'Téléphone'
  website: 'Site web'
  note: 'Note pour le vérificateur'
action:
  resubmit: 'Soumettre à vérification'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Weryfikacja'
reviewNote: 'Uwaga weryfikatora'
status:
  PENDING:
    title: 'Oczekuje na weryfikację'
    description: 'Możesz już przygotowywać obozy. Pozostaną prywatnymi wersjami roboczymi do czasu weryfikacji organizacji.'
  VERIFIED:
    title: 'Zweryfikowana'
    description: 'Ta organizacja może publikować obozy i wysyłać newslettery.'
  REJECTED:
    title: 'Odrzucona'
    description: 'Popraw dane w ustawieniach, a następnie zgłoś ponownie do weryfikacji.'
field:
  address: 'Adres'
  registrationNumber: 'Numer rejestrowy'
  contactEmail: 'E-mail kontaktowy'
  phone: 'Telefon'
  website: 'Strona internetowa'
  note: 'Uwaga dla weryfikatora'
action:
  resubmit: 'Zgłoś do weryfikacji'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Ověření'
reviewNote: 'Poznámka ověřovatele'
status:
  PENDING:
    title: 'Čeká na ověření'
    description: 'Tábory můžeš připravovat už teď. Zůstanou soukromými koncepty, dokud správce organizaci neověří.'
  VERIFIED:
    title: 'Ověřená'
    description: 'Tato organizace může zveřejňovat tábory a posílat newslettery.'
  REJECTED:
    title: 'Zamítnutá'
    description: 'Uprav údaje v nastavení a odešli je znovu k ověření.'
field:
  address: 'Adresa'
  registrationNumber: 'Registrační číslo'
  contactEmail: 'Kontaktní e-mail'
  phone: 'Telefon'
  website: 'Web'
  note: 'Poznámka pro ověřovatele'
action:
  resubmit: 'Odeslat k ověření'
</i18n>
