<template>
  <page-state-handler
    padding
    :error
    :loading="isLoading"
    class="row justify-center"
  >
    <div
      v-if="organization"
      class="settings-shell column col-12 col-sm-10 col-md-8 q-gutter-md"
    >
      <div class="page-title">
        <div class="text-h5 text-weight-medium">{{ t('title') }}</div>
        <div class="text-body2 text-on-surface-variant q-mt-xs">
          {{ t('subtitle') }}
        </div>
      </div>

      <q-card
        v-if="locked"
        flat
        class="notice notice--muted row items-center no-wrap q-gutter-sm"
      >
        <q-icon
          name="lock"
          size="20px"
        />
        <div class="col text-body2">{{ t('locked') }}</div>
      </q-card>

      <q-form
        class="column q-gutter-md"
        @submit="save"
        @reset="reset"
      >
        <q-card
          flat
          bordered
          class="rounded-lg"
        >
          <q-card-section class="q-pb-none">
            <div class="row items-center no-wrap q-gutter-sm">
              <q-icon
                name="apartment"
                color="primary"
                size="20px"
              />
              <div class="text-subtitle2 text-weight-bold">
                {{ t('section.identity.title') }}
              </div>
            </div>
            <div class="text-body2 text-on-surface-variant q-mt-xs">
              {{ t('section.identity.hint') }}
            </div>
          </q-card-section>

          <q-card-section>
            <!-- Warning sits inside the section that causes it, so it is clear
                 which fields sent the organization back for review. -->
            <q-card
              v-if="reverificationRequired"
              flat
              class="notice notice--warning row items-center no-wrap q-gutter-sm q-mb-md"
            >
              <q-icon
                name="gpp_maybe"
                size="20px"
              />
              <div class="col text-body2">{{ t('reverify.notice') }}</div>
            </q-card>

            <div class="row q-col-gutter-md">
              <q-input
                v-model="form.name"
                :label="t('field.name')"
                :rules="[required]"
                :disable="locked"
                hide-bottom-space
                color="primary"
                rounded
                outlined
                class="col-12 col-md-7"
              >
                <template #prepend>
                  <q-icon name="apartment" />
                </template>
              </q-input>
              <q-input
                v-model="form.registrationNumber"
                :label="t('field.registrationNumber')"
                :hint="t('field.registrationNumberHint')"
                :disable="locked"
                color="primary"
                clearable
                rounded
                outlined
                class="col-12 col-md-5"
              >
                <template #prepend>
                  <q-icon name="tag" />
                </template>
              </q-input>
              <q-input
                v-model="form.addressStreet"
                :label="t('field.addressStreet')"
                :rules="[required]"
                :disable="locked"
                hide-bottom-space
                color="primary"
                rounded
                outlined
                class="col-12"
              >
                <template #prepend>
                  <q-icon name="home" />
                </template>
              </q-input>
              <q-input
                v-model="form.addressZipCode"
                :label="t('field.addressZipCode')"
                :rules="[required]"
                :disable="locked"
                hide-bottom-space
                color="primary"
                rounded
                outlined
                class="col-12 col-sm-4"
              />
              <q-input
                v-model="form.addressCity"
                :label="t('field.addressCity')"
                :rules="[required]"
                :disable="locked"
                hide-bottom-space
                color="primary"
                rounded
                outlined
                class="col-12 col-sm-8"
              />
              <country-select
                v-model="form.country"
                :label="t('field.country')"
                :rules="[required]"
                :disable="locked"
                class="col-12"
                rounded
              />
            </div>
          </q-card-section>
        </q-card>

        <q-card
          flat
          bordered
          class="rounded-lg"
        >
          <q-card-section class="q-pb-none">
            <div class="row items-center no-wrap q-gutter-sm">
              <q-icon
                name="contact_mail"
                color="primary"
                size="20px"
              />
              <div class="text-subtitle2 text-weight-bold">
                {{ t('section.contact.title') }}
              </div>
            </div>
            <div class="text-body2 text-on-surface-variant q-mt-xs">
              {{ t('section.contact.hint') }}
            </div>
          </q-card-section>

          <q-card-section>
            <div class="row q-col-gutter-md">
              <q-input
                v-model="form.contactEmail"
                :label="t('field.contactEmail')"
                :rules="[required]"
                type="email"
                :disable="locked"
                hide-bottom-space
                color="primary"
                rounded
                outlined
                class="col-12 col-md-6"
              >
                <template #prepend>
                  <q-icon name="mail" />
                </template>
              </q-input>
              <q-input
                v-model="form.phone"
                :label="t('field.phone')"
                type="tel"
                :disable="locked"
                hide-bottom-space
                color="primary"
                rounded
                outlined
                class="col-12 col-md-6"
              >
                <template #prepend>
                  <q-icon name="call" />
                </template>
              </q-input>
              <q-input
                v-model="form.website"
                :label="t('field.website')"
                type="url"
                :disable="locked"
                hide-bottom-space
                color="primary"
                rounded
                outlined
                class="col-12"
              >
                <template #prepend>
                  <q-icon name="language" />
                </template>
              </q-input>
              <q-input
                v-model="form.verificationNote"
                :label="t('field.verificationNote')"
                :hint="t('field.verificationNoteHint')"
                type="textarea"
                autogrow
                maxlength="5000"
                :disable="locked"
                color="primary"
                rounded
                outlined
                class="col-12"
              >
                <template #prepend>
                  <q-icon name="rate_review" />
                </template>
              </q-input>
            </div>
          </q-card-section>
        </q-card>

        <div
          v-if="!locked"
          class="row items-center q-gutter-sm"
        >
          <m-btn
            :label="
              reverificationRequired
                ? t('action.saveResubmit')
                : t('action.save')
            "
            type="submit"
            color="primary"
            :disable="!isModified"
          />
          <m-btn
            :label="t('action.reset')"
            type="reset"
            flat
            color="primary"
            :disable="!isModified"
          />
        </div>
      </q-form>

      <danger-card
        v-if="canOrg('organization.delete')"
        icon="delete_forever"
      >
        <div class="text-subtitle2 text-weight-bold">
          {{ t('danger.title') }}
        </div>
        <div class="text-body2 text-on-surface-variant q-mt-xs">
          {{ blocking ? blockingText : t('danger.description') }}
        </div>
        <div
          v-if="blocking"
          class="row q-gutter-x-md q-mt-xs"
        >
          <router-link
            v-if="
              organization.ownedEvents > 0 && canOrg('organization.events.view')
            "
            class="text-primary text-body2"
            :to="{ name: 'management.organization.events' }"
          >
            {{ t('danger.viewEvents') }}
          </router-link>
          <router-link
            v-if="
              organization.ownedNewsletters > 0 &&
              canOrg('organization.newsletters.view')
            "
            class="text-primary text-body2"
            :to="{ name: 'management.organization.newsletters' }"
          >
            {{ t('danger.viewNewsletters') }}
          </router-link>
        </div>

        <template #actions>
          <m-btn
            :label="t('action.delete')"
            icon="delete_forever"
            tonal
            error
            :disable="blocking"
            @click="confirmDelete"
          />
        </template>
      </danger-card>
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
import DangerCard from '@/components/common/DangerCard.vue';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import { requiresReverification } from '@camp-registration/common/entities';
import type {
  OrganizationDetails,
  OrganizationUpdateData,
} from '@camp-registration/common/entities';

const { t } = useI18n();
const quasar = useQuasar();
const router = useRouter();
const store = useOrganizationDetailsStore();
const { data: organization, isLoading, error } = storeToRefs(store);
const { canOrg } = useOrganizationPermissions();

const locked = computed(() => !canOrg('organization.edit'));

/**
 * Changing the vetted identity sends the organization back for re-review, which
 * takes any published event out of the public directory until it is verified
 * again. Warn before that happens rather than after.
 */
const reverificationRequired = computed(
  () =>
    organization.value !== undefined &&
    organization.value.verificationStatus !== 'PENDING' &&
    requiresReverification(organization.value, payload(form.value)),
);

/**
 * Deleting is refused while the organization still owns anything — the foreign
 * keys are `Restrict` so participant data can never be cascaded away. Surface
 * that here rather than letting the request fail.
 */
const blocking = computed(
  () =>
    (organization.value?.ownedEvents ?? 0) > 0 ||
    (organization.value?.ownedNewsletters ?? 0) > 0,
);

const blockingText = computed(() =>
  t('danger.blocked', {
    events: organization.value?.ownedEvents ?? 0,
    newsletters: organization.value?.ownedNewsletters ?? 0,
  }),
);

function snapshot(value: OrganizationDetails): OrganizationUpdateData {
  return {
    name: value.name,
    contactEmail: value.contactEmail,
    phone: value.phone ?? '',
    website: value.website ?? '',
    addressStreet: value.addressStreet,
    addressZipCode: value.addressZipCode,
    addressCity: value.addressCity,
    country: value.country,
    registrationNumber: value.registrationNumber,
    verificationNote: value.verificationNote ?? '',
  };
}

const form = ref<OrganizationUpdateData>({});
const saved = ref<OrganizationUpdateData>({});

watch(
  organization,
  (value) => {
    if (!value) {
      return;
    }
    saved.value = snapshot(value);
    form.value = { ...saved.value };
  },
  { immediate: true },
);

// Both objects come from `snapshot`, so their key order matches.
const isModified = computed(
  () => JSON.stringify(form.value) !== JSON.stringify(saved.value),
);

function reset() {
  form.value = { ...saved.value };
}

function required(value?: string | null): true | string {
  return !!value?.trim() || t('rule.required');
}

/**
 * The inputs hold `''` for a field the entity stores as `null`. Coerce in one
 * place so the re-verification check compares against the same shape the server
 * receives — otherwise an organization without a registration number reports a
 * change on every load.
 */
function payload(data: OrganizationUpdateData): OrganizationUpdateData {
  return {
    ...data,
    phone: data.phone || null,
    website: data.website || null,
    registrationNumber: data.registrationNumber || null,
    verificationNote: data.verificationNote || null,
  };
}

async function persist() {
  await store.updateData(payload(form.value));

  // An identity edit demotes a rejected organization back to PENDING on its
  // own; anything else leaves it rejected, and only an explicit request moves
  // it. Saying so here is the difference between waiting forever and asking.
  if (organization.value?.verificationStatus === 'REJECTED') {
    quasar.notify({
      type: 'info',
      message: t('rejected.notice'),
      timeout: 8000,
      multiLine: true,
      actions: [
        {
          label: t('rejected.action'),
          color: 'white',
          noCaps: true,
          handler: () => {
            void router.push({ name: 'management.organization.dashboard' });
          },
        },
      ],
    });
  }
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
        (organization.value?.ownedEvents ?? 0) > 0
          ? t('reverify.messageWithEvents')
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
.settings-shell {
  max-width: 60rem;
}

.notice {
  border-radius: 12px;
  padding: 12px 16px;
  flex-wrap: nowrap;
}

.notice--muted {
  border-left: 4px solid var(--md3-outline);
  background: var(--md3-surface-container-low);
  color: var(--md3-on-surface-variant);
}

.notice--warning {
  border-left: 4px solid var(--md3-warning);
  background: color-mix(in srgb, var(--md3-warning) 8%, var(--md3-surface));

  .q-icon {
    color: var(--md3-warning);
  }
}
</style>

<i18n lang="yaml" locale="en">
title: 'Settings'
subtitle: 'The details administrators verify and the ways people reach this organization.'
locked: 'You do not have permission to edit this organization.'
rejected:
  notice: 'Saved. This organization is still rejected — the change alone does not request a new review.'
  action: 'Overview'
rule:
  required: 'Required'
section:
  identity:
    title: 'Legal identity'
    hint: 'These details are what administrators verify. Changing them sends the organization back for review.'
  contact:
    title: 'Contact'
    hint: 'Shown to participants. You can change these at any time without a new review.'
reverify:
  notice: 'You changed details that were verified. Saving sends the organization back for review.'
  title: 'Re-verification required'
  message: 'These changes must be reviewed again. The organization returns to pending until an administrator verifies it.'
  messageWithEvents: 'These changes must be reviewed again. The organization returns to pending, and its published events leave the public directory and stop accepting registrations until it is verified.'
  confirm: 'Save and resubmit'
field:
  name: 'Name'
  contactEmail: 'Contact email'
  phone: 'Phone'
  website: 'Website'
  verificationNote: 'Note for the reviewer'
  verificationNoteHint: 'Explain anything a reviewer needs to know. Editing it does not request a new review.'
  addressStreet: 'Street and number'
  addressZipCode: 'Postal code'
  addressCity: 'City'
  country: 'Country'
  registrationNumber: 'Registration number'
  registrationNumberHint: 'Optional, e.g. the register of associations'
action:
  save: 'Save'
  saveResubmit: 'Save and resubmit'
  reset: 'Discard changes'
  delete: 'Delete organization'
danger:
  title: 'Delete this organization'
  description: 'Only possible once it owns no events or newsletters.'
  blocked: 'Still owns {events} event(s) and {newsletters} newsletter(s). Delete them first, or ask an administrator to move them to another organization.'
  viewEvents: 'View events'
  viewNewsletters: 'View newsletters'
  confirm:
    title: 'Delete organization'
    message: 'This cannot be undone.'
    label: 'Organization name'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Einstellungen'
subtitle: 'Die Angaben, die Administratoren prüfen, und die Wege, über die diese Organisation erreichbar ist.'
locked: 'Du hast keine Berechtigung, diese Organisation zu bearbeiten.'
rejected:
  notice: 'Gespeichert. Diese Organisation ist weiterhin abgelehnt – die Änderung allein fordert keine neue Prüfung an.'
  action: 'Übersicht'
rule:
  required: 'Pflichtfeld'
section:
  identity:
    title: 'Rechtliche Identität'
    hint: 'Diese Angaben werden von Administratoren geprüft. Änderungen führen zu einer erneuten Prüfung.'
  contact:
    title: 'Kontakt'
    hint: 'Für Teilnehmende sichtbar. Diese Angaben kannst du jederzeit ohne neue Prüfung ändern.'
reverify:
  notice: 'Du hast geprüfte Angaben geändert. Beim Speichern wird die Organisation erneut zur Prüfung eingereicht.'
  title: 'Erneute Prüfung erforderlich'
  message: 'Diese Änderungen müssen erneut geprüft werden. Die Organisation wartet wieder auf die Verifizierung.'
  messageWithEvents: 'Diese Änderungen müssen erneut geprüft werden. Die Organisation wartet wieder auf die Verifizierung, und ihre veröffentlichten Veranstaltungen verschwinden aus dem öffentlichen Verzeichnis und nehmen keine Anmeldungen mehr an.'
  confirm: 'Speichern und einreichen'
field:
  name: 'Name'
  contactEmail: 'Kontakt-E-Mail'
  phone: 'Telefon'
  website: 'Website'
  verificationNote: 'Hinweis für die Prüfung'
  verificationNoteHint: 'Erkläre alles, was die Prüfung wissen muss. Eine Änderung fordert noch keine neue Prüfung an.'
  addressStreet: 'Straße und Hausnummer'
  addressZipCode: 'Postleitzahl'
  addressCity: 'Stadt'
  country: 'Land'
  registrationNumber: 'Registernummer'
  registrationNumberHint: 'Optional, z. B. die Vereinsregisternummer'
action:
  save: 'Speichern'
  saveResubmit: 'Speichern und einreichen'
  reset: 'Änderungen verwerfen'
  delete: 'Organisation löschen'
danger:
  title: 'Diese Organisation löschen'
  description: 'Nur möglich, wenn sie keine Veranstaltungen oder Newsletter besitzt.'
  blocked: 'Besitzt noch {events} Veranstaltung(s) und {newsletters} Newsletter. Lösche sie zuerst, oder bitte einen Administrator, sie in eine andere Organisation zu verschieben.'
  viewEvents: 'Veranstaltungen anzeigen'
  viewNewsletters: 'Newsletter anzeigen'
  confirm:
    title: 'Organisation löschen'
    message: 'Dies kann nicht rückgängig gemacht werden.'
    label: 'Name der Organisation'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Paramètres'
subtitle: 'Les informations vérifiées par les administrateurs et les moyens de contacter cette organisation.'
locked: "Tu n'as pas l'autorisation de modifier cette organisation."
rejected:
  notice: 'Enregistré. Cette organisation reste refusée : la modification seule ne demande pas de nouvelle vérification.'
  action: 'Aperçu'
rule:
  required: 'Obligatoire'
section:
  identity:
    title: 'Identité légale'
    hint: "Ces informations sont celles que les administrateurs vérifient. Les modifier renvoie l'organisation en vérification."
  contact:
    title: 'Contact'
    hint: 'Visible par les participants. Tu peux les modifier à tout moment sans nouvelle vérification.'
reverify:
  notice: "Tu as modifié des informations vérifiées. Enregistrer renvoie l'organisation en vérification."
  title: 'Nouvelle vérification requise'
  message: "Ces modifications doivent être vérifiées à nouveau. L'organisation repasse en attente."
  messageWithEvents: "Ces modifications doivent être vérifiées à nouveau. L'organisation repasse en attente, et ses événements publiés quittent l'annuaire public et cessent d'accepter les inscriptions."
  confirm: 'Enregistrer et soumettre'
field:
  name: 'Nom'
  contactEmail: 'E-mail de contact'
  phone: 'Téléphone'
  website: 'Site web'
  verificationNote: 'Note pour le vérificateur'
  verificationNoteHint: 'Explique ce que le vérificateur doit savoir. La modifier ne demande pas une nouvelle vérification.'
  addressStreet: 'Rue et numéro'
  addressZipCode: 'Code postal'
  addressCity: 'Ville'
  country: 'Pays'
  registrationNumber: "Numéro d'enregistrement"
  registrationNumberHint: 'Facultatif, par ex. le registre des associations'
action:
  save: 'Enregistrer'
  saveResubmit: 'Enregistrer et soumettre'
  reset: 'Annuler les modifications'
  delete: "Supprimer l'organisation"
danger:
  title: 'Supprimer cette organisation'
  description: 'Possible uniquement si elle ne possède aucun événement ni newsletter.'
  blocked: "Possède encore {events} événement(s) et {newsletters} newsletter(s). Supprime-les d'abord, ou demande à un administrateur de les déplacer vers une autre organisation."
  viewEvents: 'Voir les événements'
  viewNewsletters: 'Voir les newsletters'
  confirm:
    title: "Supprimer l'organisation"
    message: 'Cette action est irréversible.'
    label: "Nom de l'organisation"
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Ustawienia'
subtitle: 'Dane weryfikowane przez administratorów oraz sposoby kontaktu z tą organizacją.'
locked: 'Nie masz uprawnień do edycji tej organizacji.'
rejected:
  notice: 'Zapisano. Ta organizacja nadal jest odrzucona — sama zmiana nie zgłasza prośby o ponowną weryfikację.'
  action: 'Przegląd'
rule:
  required: 'Pole wymagane'
section:
  identity:
    title: 'Dane rejestrowe'
    hint: 'Te dane sprawdzają administratorzy. Ich zmiana kieruje organizację do ponownej weryfikacji.'
  contact:
    title: 'Kontakt'
    hint: 'Widoczne dla uczestników. Możesz je zmienić w każdej chwili bez ponownej weryfikacji.'
reverify:
  notice: 'Zmieniono zweryfikowane dane. Zapisanie ponownie skieruje organizację do weryfikacji.'
  title: 'Wymagana ponowna weryfikacja'
  message: 'Te zmiany muszą zostać ponownie sprawdzone. Organizacja wróci do stanu oczekującego.'
  messageWithEvents: 'Te zmiany muszą zostać ponownie sprawdzone. Organizacja wróci do stanu oczekującego, a jej opublikowane wydarzenia znikną z publicznego katalogu i przestaną przyjmować zapisy.'
  confirm: 'Zapisz i wyślij'
field:
  name: 'Nazwa'
  contactEmail: 'E-mail kontaktowy'
  phone: 'Telefon'
  website: 'Strona internetowa'
  verificationNote: 'Uwaga dla weryfikatora'
  verificationNoteHint: 'Wyjaśnij wszystko, co weryfikator powinien wiedzieć. Zmiana nie zgłasza jeszcze prośby o ponowną weryfikację.'
  addressStreet: 'Ulica i numer'
  addressZipCode: 'Kod pocztowy'
  addressCity: 'Miasto'
  country: 'Kraj'
  registrationNumber: 'Numer rejestrowy'
  registrationNumberHint: 'Opcjonalnie, np. numer w rejestrze stowarzyszeń'
action:
  save: 'Zapisz'
  saveResubmit: 'Zapisz i wyślij'
  reset: 'Odrzuć zmiany'
  delete: 'Usuń organizację'
danger:
  title: 'Usuń tę organizację'
  description: 'Możliwe tylko, gdy nie posiada wydarzeń ani newsletterów.'
  blocked: 'Nadal posiada {events} wydarzenie/wydarzenia i {newsletters} newsletter(y). Najpierw je usuń lub poproś administratora o przeniesienie ich do innej organizacji.'
  viewEvents: 'Zobacz wydarzenia'
  viewNewsletters: 'Zobacz newslettery'
  confirm:
    title: 'Usuń organizację'
    message: 'Tej operacji nie można cofnąć.'
    label: 'Nazwa organizacji'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Nastavení'
subtitle: 'Údaje, které ověřují správci, a způsoby, jak tuto organizaci kontaktovat.'
locked: 'Nemáš oprávnění upravovat tuto organizaci.'
rejected:
  notice: 'Uloženo. Tato organizace je stále zamítnutá — samotná změna o nové ověření nežádá.'
  action: 'Přehled'
rule:
  required: 'Povinné'
section:
  identity:
    title: 'Právní údaje'
    hint: 'Tyto údaje ověřují správci. Jejich změna vrátí organizaci k novému ověření.'
  contact:
    title: 'Kontakt'
    hint: 'Viditelné pro účastníky. Můžeš je kdykoli změnit bez nového ověření.'
reverify:
  notice: 'Změnil jsi ověřené údaje. Uložením se organizace vrátí k ověření.'
  title: 'Vyžadováno nové ověření'
  message: 'Tyto změny musí být znovu zkontrolovány. Organizace se vrátí do stavu čekání.'
  messageWithEvents: 'Tyto změny musí být znovu zkontrolovány. Organizace se vrátí do stavu čekání a její zveřejněné akce zmizí z veřejného katalogu a přestanou přijímat registrace.'
  confirm: 'Uložit a odeslat'
field:
  name: 'Název'
  contactEmail: 'Kontaktní e-mail'
  phone: 'Telefon'
  website: 'Web'
  verificationNote: 'Poznámka pro ověřovatele'
  verificationNoteHint: 'Vysvětli vše, co ověřovatel potřebuje vědět. Úprava sama o sobě o nové ověření nežádá.'
  addressStreet: 'Ulice a číslo'
  addressZipCode: 'PSČ'
  addressCity: 'Město'
  country: 'Země'
  registrationNumber: 'Registrační číslo'
  registrationNumberHint: 'Nepovinné, např. číslo ve spolkovém rejstříku'
action:
  save: 'Uložit'
  saveResubmit: 'Uložit a odeslat'
  reset: 'Zahodit změny'
  delete: 'Smazat organizaci'
danger:
  title: 'Smazat tuto organizaci'
  description: 'Možné pouze, pokud nevlastní žádné akce ani newslettery.'
  blocked: 'Stále vlastní {events} akcí a {newsletters} newsletter(y). Nejprve je smaž, nebo požádej správce o jejich přesun do jiné organizace.'
  viewEvents: 'Zobrazit akce'
  viewNewsletters: 'Zobrazit newslettery'
  confirm:
    title: 'Smazat organizaci'
    message: 'Tuto akci nelze vrátit zpět.'
    label: 'Název organizace'
</i18n>
