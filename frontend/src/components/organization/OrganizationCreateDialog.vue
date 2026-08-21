<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="organization-create-card">
      <q-form @submit="onSubmit">
        <q-card-section class="q-pb-none">
          <div class="text-h6">{{ t('title') }}</div>
          <div class="text-body2 text-on-surface-variant q-mt-xs">
            {{ t('description') }}
          </div>
        </q-card-section>

        <q-card-section class="q-gutter-y-md">
          <div class="section-label">{{ t('section.identity') }}</div>

          <q-input
            v-model="data.name"
            :label="t('field.name')"
            :hint="t('hint.name')"
            :rules="[required]"
            color="primary"
            hide-bottom-space
            autofocus
            rounded
            outlined
          />

          <div class="row q-col-gutter-sm">
            <q-input
              v-model="data.contactEmail"
              :label="t('field.contactEmail')"
              type="email"
              :rules="[required]"
              color="primary"
              hide-bottom-space
              rounded
              outlined
              class="col-12 col-sm-6"
            />
            <q-input
              v-model="data.phone"
              :label="t('field.phone')"
              color="primary"
              hide-bottom-space
              rounded
              outlined
              class="col-12 col-sm-6"
            />
          </div>

          <q-input
            v-model="data.website"
            :label="t('field.website')"
            color="primary"
            hide-bottom-space
            rounded
            outlined
          />

          <q-separator spaced />
          <div class="section-label">{{ t('section.registration') }}</div>

          <q-input
            v-model="data.addressStreet"
            :label="t('field.addressStreet')"
            :rules="[required]"
            color="primary"
            hide-bottom-space
            rounded
            outlined
          />

          <div class="row q-col-gutter-sm">
            <q-input
              v-model="data.addressZipCode"
              :label="t('field.addressZipCode')"
              :rules="[required]"
              color="primary"
              hide-bottom-space
              rounded
              outlined
              class="col-4"
            />
            <q-input
              v-model="data.addressCity"
              :label="t('field.addressCity')"
              :rules="[required]"
              color="primary"
              hide-bottom-space
              rounded
              outlined
              class="col-8"
            />
          </div>

          <div class="row q-col-gutter-sm">
            <country-select
              v-model="data.country"
              :label="t('field.country')"
              :rules="[required]"
              class="col-12 col-sm-6"
              rounded
            />
            <q-input
              v-model="data.registrationNumber"
              :label="t('field.registrationNumber')"
              :hint="t('hint.registrationNumber')"
              color="primary"
              hide-bottom-space
              rounded
              outlined
              class="col-12 col-sm-6"
            />
          </div>

          <q-input
            v-model="data.verificationNote"
            :label="t('field.verificationNote')"
            type="textarea"
            rows="2"
            color="primary"
            rounded
            outlined
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            :label="t('action.cancel')"
            flat
            rounded
            no-caps
            color="primary"
            :disable="loading"
            @click="onDialogCancel"
          />
          <q-btn
            :label="t('action.create')"
            type="submit"
            color="primary"
            unelevated
            rounded
            no-caps
            :loading
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { ref } from 'vue';
import { useOrganizationsStore } from '@/stores/organizations-store';
import CountrySelect from '@/components/common/inputs/CountrySelect.vue';
import type { OrganizationCreateData } from '@camp-registration/common/entities';

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const { t } = useI18n();
defineEmits([...useDialogPluginComponent.emits]);

const store = useOrganizationsStore();
const loading = ref<boolean>(false);

// The full dataset is collected up front: the organization is submitted for
// moderation the moment it is created, so there is no half-filled state.
const data = ref<OrganizationCreateData>({
  name: '',
  contactEmail: '',
  phone: '',
  website: '',
  country: '',
  addressStreet: '',
  addressZipCode: '',
  addressCity: '',
  registrationNumber: '',
  verificationNote: '',
});

const required = (val?: string | null) => !!val || t('rule.required');

async function onSubmit() {
  loading.value = true;
  try {
    const organization = await store.createData({
      ...data.value,
      phone: data.value.phone || null,
      website: data.value.website || null,
      registrationNumber: data.value.registrationNumber || null,
      verificationNote: data.value.verificationNote || null,
    });

    onDialogOK(organization);
  } finally {
    loading.value = false;
  }
}
</script>

<style lang="scss" scoped>
.organization-create-card {
  width: 640px;
  max-width: 90vw;
}

.section-label {
  color: var(--md3-on-surface-variant);
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
</style>

<i18n lang="yaml" locale="en">
title: 'Create organization'
description: 'Your organization is reviewed before it can publish camps or send newsletters. You can start building a camp straight away.'
section:
  identity: 'Contact'
  registration: 'Registered address'
rule:
  required: 'This field is required'
hint:
  name: 'The registered name of your organization'
  registrationNumber: 'As shown in the official register'
field:
  name: 'Organization name'
  contactEmail: 'Contact email'
  phone: 'Phone (optional)'
  website: 'Website (optional)'
  addressStreet: 'Street and number'
  addressZipCode: 'Postal code'
  addressCity: 'City'
  country: 'Country'
  registrationNumber: 'Registration number (optional)'
  verificationNote: 'Note for the reviewer (optional)'
action:
  create: 'Create'
  cancel: 'Cancel'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Organisation erstellen'
description: 'Deine Organisation wird geprüft, bevor sie Camps veröffentlichen oder Newsletter versenden kann. Ein Camp kannst du sofort anlegen.'
section:
  identity: 'Kontakt'
  registration: 'Eingetragene Adresse'
rule:
  required: 'Dieses Feld ist erforderlich'
hint:
  name: 'Der eingetragene Name deiner Organisation'
  registrationNumber: 'Wie im offiziellen Register angegeben'
field:
  name: 'Name der Organisation'
  contactEmail: 'Kontakt-E-Mail'
  phone: 'Telefon (optional)'
  website: 'Website (optional)'
  addressStreet: 'Straße und Hausnummer'
  addressZipCode: 'Postleitzahl'
  addressCity: 'Stadt'
  country: 'Land'
  registrationNumber: 'Registernummer (optional)'
  verificationNote: 'Hinweis für die Prüfung (optional)'
action:
  create: 'Erstellen'
  cancel: 'Abbrechen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Créer une organisation'
description: 'Ton organisation est vérifiée avant de pouvoir publier des camps ou envoyer des newsletters. Tu peux commencer à préparer un camp immédiatement.'
section:
  identity: 'Contact'
  registration: 'Adresse enregistrée'
rule:
  required: 'Ce champ est requis'
hint:
  name: 'Le nom enregistré de ton organisation'
  registrationNumber: 'Tel qu’indiqué au registre officiel'
field:
  name: "Nom de l'organisation"
  contactEmail: 'E-mail de contact'
  phone: 'Téléphone (optionnel)'
  website: 'Site web (optionnel)'
  addressStreet: 'Rue et numéro'
  addressZipCode: 'Code postal'
  addressCity: 'Ville'
  country: 'Pays'
  registrationNumber: "Numéro d'enregistrement (optionnel)"
  verificationNote: 'Note pour le vérificateur (optionnel)'
action:
  create: 'Créer'
  cancel: 'Annuler'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Utwórz organizację'
description: 'Twoja organizacja zostanie sprawdzona, zanim będzie mogła publikować obozy lub wysyłać newslettery. Obóz możesz zacząć przygotowywać od razu.'
section:
  identity: 'Kontakt'
  registration: 'Adres rejestrowy'
rule:
  required: 'To pole jest wymagane'
hint:
  name: 'Zarejestrowana nazwa Twojej organizacji'
  registrationNumber: 'Zgodnie z oficjalnym rejestrem'
field:
  name: 'Nazwa organizacji'
  contactEmail: 'E-mail kontaktowy'
  phone: 'Telefon (opcjonalnie)'
  website: 'Strona internetowa (opcjonalnie)'
  addressStreet: 'Ulica i numer'
  addressZipCode: 'Kod pocztowy'
  addressCity: 'Miasto'
  country: 'Kraj'
  registrationNumber: 'Numer rejestrowy (opcjonalnie)'
  verificationNote: 'Uwaga dla weryfikatora (opcjonalnie)'
action:
  create: 'Utwórz'
  cancel: 'Anuluj'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Vytvořit organizaci'
description: 'Tvoje organizace bude ověřena, než bude moci zveřejňovat tábory nebo posílat newslettery. Tábor můžeš začít připravovat hned.'
section:
  identity: 'Kontakt'
  registration: 'Registrovaná adresa'
rule:
  required: 'Toto pole je povinné'
hint:
  name: 'Registrovaný název tvé organizace'
  registrationNumber: 'Jak je uvedeno v oficiálním rejstříku'
field:
  name: 'Název organizace'
  contactEmail: 'Kontaktní e-mail'
  phone: 'Telefon (volitelné)'
  website: 'Web (volitelné)'
  addressStreet: 'Ulice a číslo'
  addressZipCode: 'PSČ'
  addressCity: 'Město'
  country: 'Země'
  registrationNumber: 'Registrační číslo (volitelné)'
  verificationNote: 'Poznámka pro ověřovatele (volitelné)'
action:
  create: 'Vytvořit'
  cancel: 'Zrušit'
</i18n>
