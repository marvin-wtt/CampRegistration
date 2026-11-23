<template>
  <div v-if="reason">
    <!-- On xs the full card costs more height than the page can spare, so it
         collapses to one line and the explanation moves into a dialog. -->
    <danger-card
      v-if="quasar.screen.lt.sm"
      strip
      :icon
      class="cursor-pointer"
      role="button"
      tabindex="0"
      @click="detailsOpen = true"
      @keyup.enter="detailsOpen = true"
      @keyup.space.prevent="detailsOpen = true"
    >
      <div class="text-body2 text-weight-medium">
        {{ t(`${subject}.${reason}.short`) }}
      </div>

      <template #side>
        <q-icon
          name="chevron_right"
          class="text-error"
          size="18px"
        />
      </template>
    </danger-card>

    <danger-card
      v-else
      :icon
    >
      <div class="text-subtitle1 text-weight-bold">
        {{ title }}
      </div>
      <div class="text-body2 text-on-surface-variant">
        {{ message }}
      </div>

      <template #side>
        <q-btn
          v-if="target"
          :label="actionLabel"
          outline
          rounded
          no-caps
          color="negative"
          :to="target"
        />
      </template>
    </danger-card>

    <q-dialog v-model="detailsOpen">
      <q-card class="blocked-dialog">
        <q-card-section class="row items-center no-wrap q-gutter-md">
          <danger-icon :name="icon" />
          <div class="col text-subtitle1 text-weight-bold">
            {{ title }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none text-body2 text-grey-7">
          {{ message }}
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            v-close-popup
            :label="t('close')"
            flat
            rounded
            no-caps
            color="primary"
          />
          <q-btn
            v-if="target"
            :label="actionLabel"
            unelevated
            rounded
            no-caps
            color="negative"
            :to="target"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import type { RouteLocationRaw } from 'vue-router';
import DangerCard from '@/components/common/DangerCard.vue';
import DangerIcon from '@/components/common/DangerIcon.vue';
import { useOrganizationPermissions } from '@/composables/organizationPermissions';
import type { OrganizationVerificationStatus } from '@camp-registration/common/entities';

const { organizationId, organizationName, verificationStatus, subject } =
  defineProps<{
    organizationId: string;
    organizationName: string;
    verificationStatus: OrganizationVerificationStatus;
    subject: 'event' | 'newsletter';
  }>();

const { t } = useI18n();
const quasar = useQuasar();

// Managing a event or newsletter does not imply membership in the owning
// organization, so only its members are sent to the verification page.
const { canOrgFor } = useOrganizationPermissions();

const detailsOpen = ref(false);

/** `null` while the organization is verified and nothing is being held back. */
const reason = computed<'draft' | 'pending' | 'rejected' | null>(() => {
  if (verificationStatus === 'DRAFT') {
    return 'draft';
  }
  if (verificationStatus === 'PENDING') {
    return 'pending';
  }
  if (verificationStatus === 'REJECTED') {
    return 'rejected';
  }
  return null;
});

const icon = computed(() => {
  if (reason.value === 'rejected') return 'gpp_bad';
  if (reason.value === 'draft') return 'edit_note';
  return 'gpp_maybe';
});

// A draft waits on someone who can finish the organization's setup. Everyone
// else learns whom to ask instead of waiting for a review that never comes.
const canFinishSetup = computed(() =>
  canOrgFor(organizationId, 'organization.edit'),
);

const title = computed(() => t(`${subject}.${reason.value}.title`));

const message = computed(() => {
  const text = t(`${subject}.${reason.value}.message`, {
    organization: organizationName,
  });
  if (reason.value !== 'draft' || canFinishSetup.value) {
    return text;
  }

  return `${text} ${t('ask_admin', { organization: organizationName })}`;
});

const actionLabel = computed(() =>
  reason.value === 'draft' ? t('finish_action') : t('action'),
);

const target = computed<RouteLocationRaw | undefined>(() =>
  canOrgFor(organizationId, 'organization.view')
    ? {
        name: 'management.organization.dashboard',
        params: { organizationId },
      }
    : undefined,
);
</script>

<style scoped>
.blocked-dialog {
  border-radius: 16px;
  max-width: 400px;
}
</style>

<i18n lang="yaml" locale="en">
event:
  draft:
    title: 'This event cannot go live yet'
    message: "{organization} hasn't been submitted for verification yet, so this event is hidden from the public listing and cannot accept registrations. Its setup needs to be finished first."
    short: 'Hidden — organization setup not finished'
  pending:
    title: 'This event is not reaching anyone yet'
    message: '{organization} is still awaiting verification, so this event is hidden from the public listing and cannot accept registrations — regardless of its registration window.'
    short: 'Hidden until the organization is verified'
  rejected:
    title: 'This event cannot go live'
    message: '{organization} was not verified, so this event stays hidden from the public listing and cannot accept registrations. Correct the organization details and submit them for verification again.'
    short: 'Cannot go live — organization not verified'
newsletter:
  draft:
    title: 'This newsletter cannot send yet'
    message: "{organization} hasn't been submitted for verification yet. Set everything up now — sending and adding subscribers stay disabled until it is verified."
    short: 'Sending disabled — organization setup not finished'
  pending:
    title: 'This newsletter cannot send yet'
    message: '{organization} is awaiting verification. Set everything up now — sending and adding subscribers stay disabled until then.'
    short: 'Sending and new subscribers disabled until verification'
  rejected:
    title: 'This newsletter cannot send'
    message: '{organization} was not verified. Correct its details and submit them again.'
    short: 'Sending and new subscribers disabled — organization not verified'
finish_action: 'Finish setup'
ask_admin: 'Ask an admin of {organization} to finish its setup.'
action: 'Open organization'
close: 'Close'
</i18n>

<i18n lang="yaml" locale="de">
event:
  draft:
    title: 'Diese Veranstaltung kann noch nicht live gehen'
    message: '{organization} wurde noch nicht zur Verifizierung eingereicht, daher ist diese Veranstaltung nicht öffentlich sichtbar und nimmt keine Anmeldungen an. Zuerst muss die Einrichtung abgeschlossen werden.'
    short: 'Verborgen — Einrichtung der Organisation nicht abgeschlossen'
  pending:
    title: 'Diese Veranstaltung erreicht noch niemanden'
    message: '{organization} wartet noch auf die Verifizierung. Diese Veranstaltung ist daher nicht öffentlich sichtbar und nimmt keine Anmeldungen an — unabhängig vom Anmeldezeitraum.'
    short: 'Ausgeblendet bis zur Verifizierung'
  rejected:
    title: 'Diese Veranstaltung kann nicht live gehen'
    message: '{organization} wurde nicht verifiziert. Diese Veranstaltung bleibt daher nicht öffentlich sichtbar und nimmt keine Anmeldungen an. Korrigiere die Angaben der Organisation und reiche sie erneut zur Verifizierung ein.'
    short: 'Nicht live — Organisation nicht verifiziert'
newsletter:
  draft:
    title: 'Dieser Newsletter kann noch nicht versendet werden'
    message: '{organization} wurde noch nicht zur Verifizierung eingereicht. Richte jetzt alles ein — Versand und neue Abonnenten bleiben bis zur Verifizierung deaktiviert.'
    short: 'Versand deaktiviert — Einrichtung der Organisation nicht abgeschlossen'
  pending:
    title: 'Dieser Newsletter kann noch nicht senden'
    message: '{organization} wartet auf die Verifizierung. Du kannst alles vorbereiten — Senden und das Hinzufügen von Abonnenten sind bis dahin deaktiviert.'
    short: 'Senden und neue Abonnenten bis zur Verifizierung deaktiviert'
  rejected:
    title: 'Dieser Newsletter kann nicht senden'
    message: '{organization} wurde nicht verifiziert. Korrigiere die Angaben und reiche sie erneut ein.'
    short: 'Senden und neue Abonnenten deaktiviert — nicht verifiziert'
finish_action: 'Einrichtung abschließen'
ask_admin: 'Bitte einen Admin von {organization}, die Einrichtung abzuschließen.'
action: 'Organisation öffnen'
close: 'Schließen'
</i18n>

<i18n lang="yaml" locale="fr">
event:
  draft:
    title: 'Cet événement ne peut pas encore être mis en ligne'
    message: "{organization} n'a pas encore été soumise à la vérification : cet événement est masqué de la liste publique et ne peut pas accepter d'inscriptions. Sa configuration doit d'abord être terminée."
    short: "Masqué — configuration de l'organisation inachevée"
  pending:
    title: "Cet événement n'atteint encore personne"
    message: "{organization} attend encore sa vérification : cet événement est masqué de la liste publique et ne peut pas accepter d'inscriptions, quelle que soit la période d'inscription."
    short: "Masqué jusqu'à la vérification"
  rejected:
    title: 'Cet événement ne peut pas être mis en ligne'
    message: "{organization} n'a pas été vérifiée : cet événement reste masqué de la liste publique et ne peut pas accepter d'inscriptions. Corrige les informations de l'organisation et soumets-les à nouveau."
    short: 'Non publiable — organisation non vérifiée'
newsletter:
  draft:
    title: 'Cette newsletter ne peut pas encore être envoyée'
    message: "{organization} n'a pas encore été soumise à la vérification. Préparez tout dès maintenant : l'envoi et l'ajout d'abonnés restent désactivés jusqu'à sa vérification."
    short: "Envoi désactivé — configuration de l'organisation inachevée"
  pending:
    title: 'Cette newsletter ne peut pas encore être envoyée'
    message: "{organization} attend sa vérification. Préparez tout dès maintenant : l'envoi et l'ajout d'abonnés restent désactivés d'ici là."
    short: "Envoi et nouveaux abonnés désactivés jusqu'à la vérification"
  rejected:
    title: 'Cette newsletter ne peut pas être envoyée'
    message: "{organization} n'a pas été vérifiée. Corrigez ses informations et soumettez-les à nouveau."
    short: 'Envoi et nouveaux abonnés désactivés — organisation non vérifiée'
finish_action: 'Terminer la configuration'
ask_admin: "Demande à un administrateur de {organization} d'en terminer la configuration."
action: "Ouvrir l'organisation"
close: 'Fermer'
</i18n>

<i18n lang="yaml" locale="pl">
event:
  draft:
    title: 'To wydarzenie nie może jeszcze ruszyć'
    message: '{organization} nie została jeszcze zgłoszona do weryfikacji, więc to wydarzenie jest ukryte na liście publicznej i nie przyjmuje zapisów. Najpierw trzeba dokończyć jej konfigurację.'
    short: 'Ukryte — konfiguracja organizacji niezakończona'
  pending:
    title: 'To wydarzenie nie dociera jeszcze do nikogo'
    message: '{organization} wciąż oczekuje na weryfikację, więc to wydarzenie jest ukryte na liście publicznej i nie przyjmuje zapisów — niezależnie od okresu rejestracji.'
    short: 'Ukryty do czasu weryfikacji'
  rejected:
    title: 'To wydarzenie nie może zostać opublikowane'
    message: '{organization} nie została zweryfikowana, więc to wydarzenie pozostaje ukryte na liście publicznej i nie przyjmuje zapisów. Popraw dane organizacji i zgłoś je ponownie do weryfikacji.'
    short: 'Brak publikacji — organizacja niezweryfikowana'
newsletter:
  draft:
    title: 'Tego newslettera nie można jeszcze wysłać'
    message: '{organization} nie została jeszcze zgłoszona do weryfikacji. Przygotuj wszystko już teraz — wysyłka i dodawanie subskrybentów pozostają wyłączone do czasu weryfikacji.'
    short: 'Wysyłka wyłączona — konfiguracja organizacji niezakończona'
  pending:
    title: 'Tego newslettera nie można jeszcze wysłać'
    message: '{organization} oczekuje na weryfikację. Możesz wszystko przygotować — wysyłka i dodawanie subskrybentów są do tego czasu wyłączone.'
    short: 'Wysyłka i nowi subskrybenci wyłączeni do czasu weryfikacji'
  rejected:
    title: 'Tego newslettera nie można wysłać'
    message: '{organization} nie została zweryfikowana. Popraw jej dane i zgłoś je ponownie.'
    short: 'Wysyłka i nowi subskrybenci wyłączeni — brak weryfikacji'
finish_action: 'Dokończ konfigurację'
ask_admin: 'Poproś administratora {organization} o dokończenie konfiguracji.'
action: 'Otwórz organizację'
close: 'Zamknij'
</i18n>

<i18n lang="yaml" locale="cs">
event:
  draft:
    title: 'Tuto akci zatím nelze zveřejnit'
    message: '{organization} ještě nebyla odeslána k ověření, takže tato akce je skrytá ve veřejném seznamu a nepřijímá registrace. Nejdřív je potřeba dokončit její nastavení.'
    short: 'Skrytá — nastavení organizace není dokončené'
  pending:
    title: 'Tato akce zatím nikoho neoslovuje'
    message: '{organization} stále čeká na ověření, takže tato akce je skrytá ve veřejném seznamu a nepřijímá registrace — bez ohledu na registrační období.'
    short: 'Skrytý do ověření'
  rejected:
    title: 'Tuto akci nelze zveřejnit'
    message: '{organization} nebyla ověřena, takže tato akce zůstává skrytá ve veřejném seznamu a nepřijímá registrace. Uprav údaje organizace a odešli je znovu k ověření.'
    short: 'Nelze zveřejnit — organizace neověřena'
newsletter:
  draft:
    title: 'Tento newsletter zatím nelze odeslat'
    message: '{organization} ještě nebyla odeslána k ověření. Vše si můžeš připravit — odesílání a přidávání odběratelů zůstává do ověření vypnuté.'
    short: 'Odesílání vypnuto — nastavení organizace není dokončené'
  pending:
    title: 'Tento newsletter zatím nelze odeslat'
    message: '{organization} čeká na ověření. Vše si můžete připravit — odesílání a přidávání odběratelů zůstává do té doby vypnuté.'
    short: 'Odesílání a noví odběratelé vypnuti do ověření'
  rejected:
    title: 'Tento newsletter nelze odeslat'
    message: '{organization} nebyla ověřena. Uprav její údaje a odešli je znovu.'
    short: 'Odesílání a noví odběratelé vypnuti — organizace neověřena'
finish_action: 'Dokončit nastavení'
ask_admin: 'Požádej správce {organization}, ať dokončí její nastavení.'
action: 'Otevřít organizaci'
close: 'Zavřít'
</i18n>
