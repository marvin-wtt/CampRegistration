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
        v-if="locked"
        class="locked-note rounded-md"
      >
        <template #avatar>
          <q-icon name="lock" />
        </template>
        {{ t('locked') }}
      </q-banner>

      <q-banner
        v-else-if="reverificationRequired"
        class="reverify-note rounded-md"
      >
        <template #avatar>
          <q-icon name="gpp_maybe" />
        </template>
        {{ t('reverify.notice') }}
      </q-banner>

      <q-form @submit="save">
        <div class="row q-col-gutter-md">
          <q-input
            v-model="form.name"
            :label="t('field.name')"
            :disable="locked"
            color="primary"
            rounded
            outlined
            class="col-12"
          />
          <q-input
            v-model="form.contactEmail"
            :label="t('field.contactEmail')"
            type="email"
            :disable="locked"
            color="primary"
            rounded
            outlined
            class="col-12 col-md-6"
          />
          <q-input
            v-model="form.phone"
            :label="t('field.phone')"
            :disable="locked"
            color="primary"
            rounded
            outlined
            class="col-12 col-md-6"
          />
          <q-input
            v-model="form.website"
            :label="t('field.website')"
            :disable="locked"
            color="primary"
            rounded
            outlined
            class="col-12"
          />
          <q-input
            v-model="form.addressStreet"
            :label="t('field.addressStreet')"
            :disable="locked"
            color="primary"
            rounded
            outlined
            class="col-12"
          />
          <q-input
            v-model="form.addressZipCode"
            :label="t('field.addressZipCode')"
            :disable="locked"
            color="primary"
            rounded
            outlined
            class="col-12 col-sm-4"
          />
          <q-input
            v-model="form.addressCity"
            :label="t('field.addressCity')"
            :disable="locked"
            color="primary"
            rounded
            outlined
            class="col-12 col-sm-8"
          />
          <country-select
            v-model="form.country"
            :label="t('field.country')"
            :disable="locked"
            class="col-12"
          />
          <q-input
            v-model="form.registrationNumber"
            :label="t('field.registrationNumber')"
            :disable="locked"
            color="primary"
            rounded
            outlined
            class="col-12"
          />

          <div class="col-12">
            <q-btn
              :label="t('action.save')"
              type="submit"
              color="primary"
              rounded
              unelevated
              no-caps
              :disable="locked"
            />
          </div>
        </div>
      </q-form>

      <q-separator spaced />

      <div>
        <div class="row items-center justify-between q-col-gutter-md">
          <div class="col-12 col-sm">
            <div class="text-subtitle2">{{ t('danger.title') }}</div>
            <div class="text-body2 text-on-surface-variant">
              {{ blocking ? blockingText : t('danger.description') }}
            </div>
            <router-link
              v-if="organization.ownedCamps > 0"
              class="text-primary text-body2"
              :to="{ name: 'management.organization.camps' }"
            >
              {{ t('danger.viewCamps') }}
            </router-link>
          </div>
          <div class="col-12 col-sm-auto">
            <q-btn
              :label="t('action.delete')"
              color="negative"
              outline
              rounded
              no-caps
              :disable="!canOrg('organization.delete') || blocking"
              @click="confirmDelete"
            />
          </div>
        </div>
      </div>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import { useOrganizationDetailsStore } from '@/stores/organization-details-store';
import { useOrganizationPermissions } from '@/composables/organizationPermissions';
import CountrySelect from '@/components/common/inputs/CountrySelect.vue';
import SafeDeleteDialog from '@/components/common/dialogs/SafeDeleteDialog.vue';
import { requiresReverification } from '@camp-registration/common/entities';
import type { OrganizationUpdateData } from '@camp-registration/common/entities';

const { t } = useI18n();
const quasar = useQuasar();
const router = useRouter();
const store = useOrganizationDetailsStore();
const { data: organization, isLoading, error } = storeToRefs(store);
const { canOrg } = useOrganizationPermissions();

const locked = computed(() => !canOrg('organization.edit'));

/**
 * Changing the vetted identity sends the organization back for re-review, which
 * takes any published camp out of the public directory until it is verified
 * again. Warn before that happens rather than after.
 */
const reverificationRequired = computed(
  () =>
    organization.value !== undefined &&
    organization.value.verificationStatus !== 'PENDING' &&
    requiresReverification(organization.value, form.value),
);

/**
 * Deleting is refused while the organization still owns anything — the foreign
 * keys are `Restrict` so participant data can never be cascaded away. Surface
 * that here rather than letting the request fail.
 */
const blocking = computed(
  () =>
    (organization.value?.ownedCamps ?? 0) > 0 ||
    (organization.value?.ownedNewsletters ?? 0) > 0,
);

const blockingText = computed(() =>
  t('danger.blocked', {
    camps: organization.value?.ownedCamps ?? 0,
    newsletters: organization.value?.ownedNewsletters ?? 0,
  }),
);

const form = ref<OrganizationUpdateData>({});

watch(
  organization,
  (value) => {
    if (!value) return;
    form.value = {
      name: value.name,
      contactEmail: value.contactEmail,
      phone: value.phone ?? '',
      website: value.website ?? '',
      addressStreet: value.addressStreet,
      addressZipCode: value.addressZipCode,
      addressCity: value.addressCity,
      country: value.country,
      registrationNumber: value.registrationNumber,
    };
  },
  { immediate: true },
);

async function persist() {
  await store.updateData({
    ...form.value,
    phone: form.value.phone || null,
    website: form.value.website || null,
  });
}

function save() {
  if (!reverificationRequired.value) {
    void persist();
    return;
  }

  quasar
    .dialog({
      title: t('reverify.title'),
      message:
        (organization.value?.ownedCamps ?? 0) > 0
          ? t('reverify.messageWithCamps')
          : t('reverify.message'),
      cancel: { color: 'primary', flat: true, rounded: true, noCaps: true },
      ok: {
        label: t('reverify.confirm'),
        color: 'primary',
        rounded: true,
        noCaps: true,
      },
      persistent: true,
    })
    .onOk(() => {
      void persist();
    });
}

function confirmDelete() {
  quasar
    .dialog({
      component: SafeDeleteDialog,
      componentProps: {
        title: t('danger.confirm.title'),
        message: t('danger.confirm.message'),
        label: t('danger.confirm.label'),
        value: organization.value?.name ?? '',
      },
      persistent: true,
    })
    .onOk(() => {
      void (async () => {
        await store.deleteData();
        await router.push({ name: 'management.organizations' });
      })();
    });
}

onMounted(async () => {
  await store.fetchData();
});
</script>

<style lang="scss" scoped>
.locked-note {
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}

.reverify-note {
  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface-variant);
}
</style>

<i18n lang="yaml" locale="en">
title: 'Settings'
locked: 'You do not have permission to edit this organization.'
reverify:
  notice: 'You changed details that were verified. Saving sends the organization back for review.'
  title: 'Re-verification required'
  message: 'These changes must be reviewed again. The organization returns to pending until an administrator verifies it.'
  messageWithCamps: 'These changes must be reviewed again. The organization returns to pending, and its published camps leave the public directory and stop accepting registrations until it is verified.'
  confirm: 'Save and resubmit'
field:
  name: 'Name'
  contactEmail: 'Contact email'
  phone: 'Phone'
  website: 'Website'
  addressStreet: 'Street and number'
  addressZipCode: 'Postal code'
  addressCity: 'City'
  country: 'Country'
  registrationNumber: 'Registration number'
action:
  save: 'Save'
  delete: 'Delete organization'
danger:
  title: 'Delete this organization'
  description: 'Only possible once it owns no camps or newsletters.'
  blocked: 'Still owns {camps} camp(s) and {newsletters} newsletter(s). Delete them first, or ask an administrator to move them to another organization.'
  viewCamps: 'View camps'
  confirm:
    title: 'Delete organization'
    message: 'This cannot be undone.'
    label: 'Organization name'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Einstellungen'
locked: 'Du hast keine Berechtigung, diese Organisation zu bearbeiten.'
reverify:
  notice: 'Du hast geprüfte Angaben geändert. Beim Speichern wird die Organisation erneut zur Prüfung eingereicht.'
  title: 'Erneute Prüfung erforderlich'
  message: 'Diese Änderungen müssen erneut geprüft werden. Die Organisation wartet wieder auf die Verifizierung.'
  messageWithCamps: 'Diese Änderungen müssen erneut geprüft werden. Die Organisation wartet wieder auf die Verifizierung, und ihre veröffentlichten Camps verschwinden aus dem öffentlichen Verzeichnis und nehmen keine Anmeldungen mehr an.'
  confirm: 'Speichern und einreichen'
field:
  name: 'Name'
  contactEmail: 'Kontakt-E-Mail'
  phone: 'Telefon'
  website: 'Website'
  addressStreet: 'Straße und Hausnummer'
  addressZipCode: 'Postleitzahl'
  addressCity: 'Stadt'
  country: 'Land'
  registrationNumber: 'Registernummer'
action:
  save: 'Speichern'
  delete: 'Organisation löschen'
danger:
  title: 'Diese Organisation löschen'
  description: 'Nur möglich, wenn sie keine Camps oder Newsletter besitzt.'
  blocked: 'Besitzt noch {camps} Camp(s) und {newsletters} Newsletter. Lösche sie zuerst, oder bitte einen Administrator, sie in eine andere Organisation zu verschieben.'
  viewCamps: 'Camps anzeigen'
  confirm:
    title: 'Organisation löschen'
    message: 'Dies kann nicht rückgängig gemacht werden.'
    label: 'Name der Organisation'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Paramètres'
locked: "Tu n'as pas l'autorisation de modifier cette organisation."
reverify:
  notice: "Tu as modifié des informations vérifiées. Enregistrer renvoie l'organisation en vérification."
  title: 'Nouvelle vérification requise'
  message: "Ces modifications doivent être vérifiées à nouveau. L'organisation repasse en attente."
  messageWithCamps: "Ces modifications doivent être vérifiées à nouveau. L'organisation repasse en attente, et ses camps publiés quittent l'annuaire public et cessent d'accepter les inscriptions."
  confirm: 'Enregistrer et soumettre'
field:
  name: 'Nom'
  contactEmail: 'E-mail de contact'
  phone: 'Téléphone'
  website: 'Site web'
  addressStreet: 'Rue et numéro'
  addressZipCode: 'Code postal'
  addressCity: 'Ville'
  country: 'Pays'
  registrationNumber: "Numéro d'enregistrement"
action:
  save: 'Enregistrer'
  delete: "Supprimer l'organisation"
danger:
  title: 'Supprimer cette organisation'
  description: 'Possible uniquement si elle ne possède aucun camp ni newsletter.'
  blocked: "Possède encore {camps} camp(s) et {newsletters} newsletter(s). Supprime-les d'abord, ou demande à un administrateur de les déplacer vers une autre organisation."
  viewCamps: 'Voir les camps'
  confirm:
    title: "Supprimer l'organisation"
    message: 'Cette action est irréversible.'
    label: "Nom de l'organisation"
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Ustawienia'
locked: 'Nie masz uprawnień do edycji tej organizacji.'
reverify:
  notice: 'Zmieniono zweryfikowane dane. Zapisanie ponownie skieruje organizację do weryfikacji.'
  title: 'Wymagana ponowna weryfikacja'
  message: 'Te zmiany muszą zostać ponownie sprawdzone. Organizacja wróci do stanu oczekującego.'
  messageWithCamps: 'Te zmiany muszą zostać ponownie sprawdzone. Organizacja wróci do stanu oczekującego, a jej opublikowane obozy znikną z publicznego katalogu i przestaną przyjmować zapisy.'
  confirm: 'Zapisz i wyślij'
field:
  name: 'Nazwa'
  contactEmail: 'E-mail kontaktowy'
  phone: 'Telefon'
  website: 'Strona internetowa'
  addressStreet: 'Ulica i numer'
  addressZipCode: 'Kod pocztowy'
  addressCity: 'Miasto'
  country: 'Kraj'
  registrationNumber: 'Numer rejestrowy'
action:
  save: 'Zapisz'
  delete: 'Usuń organizację'
danger:
  title: 'Usuń tę organizację'
  description: 'Możliwe tylko, gdy nie posiada obozów ani newsletterów.'
  blocked: 'Nadal posiada {camps} obóz/obozy i {newsletters} newsletter(y). Najpierw je usuń lub poproś administratora o przeniesienie ich do innej organizacji.'
  viewCamps: 'Zobacz obozy'
  confirm:
    title: 'Usuń organizację'
    message: 'Tej operacji nie można cofnąć.'
    label: 'Nazwa organizacji'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Nastavení'
locked: 'Nemáš oprávnění upravovat tuto organizaci.'
reverify:
  notice: 'Změnil jsi ověřené údaje. Uložením se organizace vrátí k ověření.'
  title: 'Vyžadováno nové ověření'
  message: 'Tyto změny musí být znovu zkontrolovány. Organizace se vrátí do stavu čekání.'
  messageWithCamps: 'Tyto změny musí být znovu zkontrolovány. Organizace se vrátí do stavu čekání a její zveřejněné tábory zmizí z veřejného katalogu a přestanou přijímat registrace.'
  confirm: 'Uložit a odeslat'
field:
  name: 'Název'
  contactEmail: 'Kontaktní e-mail'
  phone: 'Telefon'
  website: 'Web'
  addressStreet: 'Ulice a číslo'
  addressZipCode: 'PSČ'
  addressCity: 'Město'
  country: 'Země'
  registrationNumber: 'Registrační číslo'
action:
  save: 'Uložit'
  delete: 'Smazat organizaci'
danger:
  title: 'Smazat tuto organizaci'
  description: 'Možné pouze, pokud nevlastní žádné tábory ani newslettery.'
  blocked: 'Stále vlastní {camps} tábor(y) a {newsletters} newsletter(y). Nejprve je smaž, nebo požádej správce o jejich přesun do jiné organizace.'
  viewCamps: 'Zobrazit tábory'
  confirm:
    title: 'Smazat organizaci'
    message: 'Tuto akci nelze vrátit zpět.'
    label: 'Název organizace'
</i18n>
