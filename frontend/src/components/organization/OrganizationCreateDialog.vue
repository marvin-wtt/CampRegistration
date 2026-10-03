<template>
  <responsive-dialog
    ref="dialogRef"
    :snap-points="['full']"
    persistent
    @hide="onDialogHide"
  >
    <dialog-card
      :title="t('title')"
      :width="560"
      icon="apartment"
      no-form
      @cancel="onDialogCancel"
    >
      <q-stepper
        v-model="step"
        class="bg-transparent"
        vertical
        color="primary"
        animated
        flat
        header-nav
      >
        <!-- Who the organization is and how to reach it -->
        <edit-step
          v-model="step"
          :name="0"
          :title="t('section.identity')"
          icon="badge"
        >
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
          <q-input
            v-model="data.contactEmail"
            :label="t('field.contactEmail')"
            type="email"
            :rules="[required]"
            color="primary"
            hide-bottom-space
            rounded
            outlined
          />
          <div class="row q-col-gutter-sm">
            <q-input
              v-model="data.phone"
              :label="t('field.phone')"
              color="primary"
              hide-bottom-space
              rounded
              outlined
              class="col-12 col-sm-6"
            />
            <q-input
              v-model="data.website"
              :label="t('field.website')"
              color="primary"
              hide-bottom-space
              rounded
              outlined
              class="col-12 col-sm-6"
            />
          </div>
        </edit-step>

        <!-- The legal identity the review checks -->
        <edit-step
          v-model="step"
          :name="1"
          :title="t('section.registration')"
          icon="location_city"
        >
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
          <country-select
            v-model="data.country"
            :label="t('field.country')"
            :rules="[required]"
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
          />
          <q-input
            v-model="data.vatNumber"
            :label="t('field.vatNumber')"
            :hint="t('hint.vatNumber')"
            color="primary"
            hide-bottom-space
            rounded
            outlined
          />
        </edit-step>

        <!-- What happens next, and what founding it agrees to -->
        <edit-step
          v-model="step"
          :name="2"
          :title="t('section.review')"
          icon="fact_check"
          :last-label="t('action.create')"
          last
          @next-step="onSubmit"
        >
          <!-- In the step about the review rather than the header, which has
               no room for it on a phone. -->
          <div class="privacy-note rounded-md">
            <q-icon
              name="verified_user"
              size="20px"
            />
            <span class="text-body2">{{ t('description') }}</span>
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

          <!-- The review cannot pass without a published privacy notice, and
               that notice can only be written once the organization exists —
               so the requirement is stated here rather than discovered on a
               rejection. -->
          <div class="privacy-note rounded-md">
            <q-icon
              name="privacy_tip"
              size="20px"
            />
            <span class="text-body2">{{ t('privacyNote') }}</span>
          </div>

          <!-- Founding the organization agrees to the default model, so its
               prices are shown here and agreed to explicitly. -->
          <div class="price-terms rounded-md">
            <div class="text-overline text-on-surface-variant">
              {{ t('prices.title') }}
            </div>
            <q-skeleton
              v-if="!priceModel && !priceModelError"
              type="text"
              width="60%"
            />
            <div
              v-else-if="!priceModel"
              class="text-body2 text-error"
            >
              {{ priceModelError }}
            </div>
            <template v-else>
              <div class="text-subtitle2">{{ to(priceModel.name) }}</div>
              <div class="price-terms__rates q-mt-xs">
                <div
                  v-for="rate in rates"
                  :key="rate.key"
                >
                  <div class="text-caption text-on-surface-variant">
                    {{ t(`prices.rate.${rate.key}`) }}
                  </div>
                  <div class="text-body1">{{ rate.value }}</div>
                </div>
              </div>
              <div class="text-caption text-on-surface-variant q-mt-sm">
                {{ t('prices.billing') }}
              </div>
            </template>

            <q-separator class="q-my-sm" />

            <q-field
              :model-value="acceptsPrices"
              :rules="[(value: boolean) => value || t('prices.required')]"
              class="price-terms__accept"
              borderless
              dense
              hide-bottom-space
            >
              <q-checkbox
                v-model="acceptsPrices"
                :disable="!priceModel"
                :label="t('prices.accept')"
                class="text-body2"
                color="primary"
                dense
              />
            </q-field>
          </div>
        </edit-step>
      </q-stepper>
    </dialog-card>
  </responsive-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed, ref } from 'vue';
import { useOrganizationsStore } from '@/stores/organizations-store';
import CountrySelect from '@/components/common/inputs/CountrySelect.vue';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import DialogCard from '@/components/common/dialogs/DialogCard.vue';
import EditStep from '@/components/event/settings/create/EventEditStep.vue';
import type {
  OrganizationCreateData,
  PriceModel,
} from '@camp-registration/common/entities';
import { isAPIServiceError, useAPIService } from '@/services/APIService';
import { useErrorExtractor } from '@/composables/serviceHandler';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { formatMoney } from '@/utils/money';

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const { t, locale } = useI18n();
const { to } = useObjectTranslation();
const api = useAPIService();
const { extractErrorText } = useErrorExtractor();
defineEmits([...useDialogPluginComponent.emits]);

const store = useOrganizationsStore();
const loading = ref<boolean>(false);
const step = ref<number>(0);

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
  vatNumber: '',
  verificationNote: '',
});

const required = (val?: string | null) => !!val || t('rule.required');

const priceModel = ref<PriceModel | null>(null);
const priceModelError = ref<string | null>(null);
const acceptsPrices = ref(false);

async function loadPriceModel() {
  priceModelError.value = null;
  acceptsPrices.value = false;
  try {
    priceModel.value = await api.fetchDefaultPriceModel();
  } catch (err: unknown) {
    priceModelError.value = extractErrorText(err);
  }
}

void loadPriceModel();

/** The default model's rates, laid out like on the billing page. */
const rates = computed(() => {
  const model = priceModel.value;
  if (!model) {
    return [];
  }

  return [
    {
      key: 'pricePerRegistration',
      value: formatMoney(
        model.pricePerRegistration,
        model.currency,
        locale.value,
      ),
    },
    {
      key: 'baseFee',
      value: formatMoney(model.baseFee, model.currency, locale.value),
    },
    {
      key: 'taxRate',
      value: `${Number(model.taxRate).toLocaleString(locale.value)} %`,
    },
  ];
});

async function onSubmit() {
  if (!priceModel.value || !acceptsPrices.value) {
    step.value = 2;
    return;
  }
  loading.value = true;
  try {
    const organization = await store.createData({
      ...data.value,
      acceptedPriceModelId: priceModel.value.id,
      phone: data.value.phone || null,
      website: data.value.website || null,
      registrationNumber: data.value.registrationNumber || null,
      vatNumber: data.value.vatNumber || null,
      verificationNote: data.value.verificationNote || null,
    });

    onDialogOK(organization);
  } catch (err: unknown) {
    // The last step advanced on submit; reopen it to show what's wrong.
    step.value = 2;
    // The default changed while the dialog was open: show the new prices,
    // to be agreed to again. The notification already explained why.
    if (
      isAPIServiceError(err) &&
      err.response?.data.errorCode === 'PRICE_MODEL_CHANGED'
    ) {
      void loadPriceModel();
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style lang="scss" scoped>
.price-terms__rates {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 32px;
}

// The field only carries the validation message; drop its control padding so
// the checkbox lines up with the text above.
.price-terms__accept :deep(.q-field__control) {
  min-height: 0;
  padding: 0;
}

.price-terms {
  padding: 12px 14px;
  background: var(--md3-surface-container-high);
}

.privacy-note {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}
</style>

<i18n lang="yaml" locale="en">
prices:
  required: 'Please agree to the prices to create the organization.'
  title: 'Prices'
  billing: 'Billed per event after it ends, for its accepted registrations.'
  rate:
    pricePerRegistration: 'Per registration'
    baseFee: 'Base fee per event'
    taxRate: 'Tax'
  accept: 'I agree to these prices on behalf of the organization.'
title: 'Create organization'
description: 'Your organization is reviewed before it can publish events or send newsletters. You can start building an event straight away.'
privacyNote: 'Verification also requires a published privacy notice. You can write it under Privacy as soon as the organization exists.'
section:
  review: 'Review and terms'
  identity: 'Contact'
  registration: 'Registered address'
rule:
  required: 'This field is required'
hint:
  name: 'The registered name of your organization'
  registrationNumber: 'As shown in the official register'
  vatNumber: 'Printed on invoices'
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
  vatNumber: 'VAT number (optional)'
  verificationNote: 'Note for the reviewer (optional)'
action:
  create: 'Create'
  cancel: 'Cancel'
</i18n>

<i18n lang="yaml" locale="de">
prices:
  required: 'Bitte stimme den Preisen zu, um die Organisation anzulegen.'
  title: 'Preise'
  billing: 'Abgerechnet pro Veranstaltung nach ihrem Ende, für die angenommenen Anmeldungen.'
  rate:
    pricePerRegistration: 'Pro Anmeldung'
    baseFee: 'Grundgebühr pro Veranstaltung'
    taxRate: 'Steuer'
  accept: 'Ich stimme diesen Preisen im Namen der Organisation zu.'
title: 'Organisation erstellen'
description: 'Deine Organisation wird geprüft, bevor sie Veranstaltungen veröffentlichen oder Newsletter versenden kann. Eine Veranstaltung kannst du sofort anlegen.'
privacyNote: 'Für die Verifizierung wird außerdem eine veröffentlichte Datenschutzerklärung benötigt. Du kannst sie unter Datenschutz verfassen, sobald die Organisation angelegt ist.'
section:
  review: 'Prüfung und Bedingungen'
  identity: 'Kontakt'
  registration: 'Eingetragene Adresse'
rule:
  required: 'Dieses Feld ist erforderlich'
hint:
  name: 'Der eingetragene Name deiner Organisation'
  registrationNumber: 'Wie im offiziellen Register angegeben'
  vatNumber: 'Wird auf Rechnungen angegeben'
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
  vatNumber: 'USt-IdNr. (optional)'
  verificationNote: 'Hinweis für die Prüfung (optional)'
action:
  create: 'Erstellen'
  cancel: 'Abbrechen'
</i18n>

<i18n lang="yaml" locale="fr">
prices:
  required: "Merci d'accepter les tarifs pour créer l'organisation."
  title: 'Tarifs'
  billing: 'Facturé par événement après sa fin, pour ses inscriptions acceptées.'
  rate:
    pricePerRegistration: 'Par inscription'
    baseFee: 'Frais de base par événement'
    taxRate: 'Taxe'
  accept: "J'accepte ces tarifs au nom de l'organisation."
title: 'Créer une organisation'
description: 'Ton organisation est vérifiée avant de pouvoir publier des événements ou envoyer des newsletters. Tu peux commencer à préparer un événement immédiatement.'
privacyNote: 'La vérification exige également une politique de confidentialité publiée. Tu peux la rédiger sous Confidentialité dès que l’organisation existe.'
section:
  review: 'Vérification et conditions'
  identity: 'Contact'
  registration: 'Adresse enregistrée'
rule:
  required: 'Ce champ est requis'
hint:
  name: 'Le nom enregistré de ton organisation'
  registrationNumber: 'Tel qu’indiqué au registre officiel'
  vatNumber: 'Figure sur les factures'
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
  vatNumber: 'Numéro de TVA (facultatif)'
  verificationNote: 'Note pour le vérificateur (optionnel)'
action:
  create: 'Créer'
  cancel: 'Annuler'
</i18n>

<i18n lang="yaml" locale="pl">
prices:
  required: 'Zaakceptuj ceny, aby utworzyć organizację.'
  title: 'Ceny'
  billing: 'Rozliczane za każde wydarzenie po jego zakończeniu, za zaakceptowane zgłoszenia.'
  rate:
    pricePerRegistration: 'Za zgłoszenie'
    baseFee: 'Opłata podstawowa za wydarzenie'
    taxRate: 'Podatek'
  accept: 'Akceptuję te ceny w imieniu organizacji.'
title: 'Utwórz organizację'
description: 'Twoja organizacja zostanie sprawdzona, zanim będzie mogła publikować wydarzenia lub wysyłać newslettery. Wydarzenie możesz zacząć przygotowywać od razu.'
privacyNote: 'Weryfikacja wymaga też opublikowanej informacji o ochronie danych. Możesz ją przygotować w sekcji Prywatność, gdy tylko organizacja powstanie.'
section:
  review: 'Weryfikacja i warunki'
  identity: 'Kontakt'
  registration: 'Adres rejestrowy'
rule:
  required: 'To pole jest wymagane'
hint:
  name: 'Zarejestrowana nazwa Twojej organizacji'
  registrationNumber: 'Zgodnie z oficjalnym rejestrem'
  vatNumber: 'Podawany na fakturach'
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
  vatNumber: 'Numer VAT (opcjonalnie)'
  verificationNote: 'Uwaga dla weryfikatora (opcjonalnie)'
action:
  create: 'Utwórz'
  cancel: 'Anuluj'
</i18n>

<i18n lang="yaml" locale="cs">
prices:
  required: 'Pro vytvoření organizace prosím souhlas s cenami.'
  title: 'Ceny'
  billing: 'Účtuje se za každou akci po jejím skončení, podle přijatých přihlášek.'
  rate:
    pricePerRegistration: 'Za přihlášku'
    baseFee: 'Základní poplatek za akci'
    taxRate: 'Daň'
  accept: 'Souhlasím s těmito cenami jménem organizace.'
title: 'Vytvořit organizaci'
description: 'Tvoje organizace bude ověřena, než bude moci zveřejňovat akce nebo posílat newslettery. Akci můžeš začít připravovat hned.'
privacyNote: 'Ověření také vyžaduje zveřejněné zásady ochrany osobních údajů. Můžeš je sepsat v sekci Soukromí, jakmile organizace vznikne.'
section:
  review: 'Ověření a podmínky'
  identity: 'Kontakt'
  registration: 'Registrovaná adresa'
rule:
  required: 'Toto pole je povinné'
hint:
  name: 'Registrovaný název tvé organizace'
  registrationNumber: 'Jak je uvedeno v oficiálním rejstříku'
  vatNumber: 'Uvádí se na fakturách'
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
  vatNumber: 'DIČ (volitelné)'
  verificationNote: 'Poznámka pro ověřovatele (volitelné)'
action:
  create: 'Vytvořit'
  cancel: 'Zrušit'
</i18n>
