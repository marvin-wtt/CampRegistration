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
          :label="t('action')"
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
            :label="t('action')"
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
    subject: 'camp' | 'newsletter';
  }>();

const { t } = useI18n();
const quasar = useQuasar();

// Managing a camp or newsletter does not imply membership in the owning
// organization, so only its members are sent to the verification page.
const { canOrgFor } = useOrganizationPermissions();

const detailsOpen = ref(false);

/** `null` while the organization is verified and nothing is being held back. */
const reason = computed<'pending' | 'rejected' | null>(() => {
  if (verificationStatus === 'PENDING') {
    return 'pending';
  }
  if (verificationStatus === 'REJECTED') {
    return 'rejected';
  }
  return null;
});

const icon = computed(() =>
  reason.value === 'rejected' ? 'gpp_bad' : 'gpp_maybe',
);

const title = computed(() => t(`${subject}.${reason.value}.title`));

const message = computed(() =>
  t(`${subject}.${reason.value}.message`, { organization: organizationName }),
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
camp:
  pending:
    title: 'This camp is not reaching anyone yet'
    message: '{organization} is still awaiting verification, so this camp is hidden from the public listing and cannot accept registrations — regardless of its registration window.'
    short: 'Hidden until the organization is verified'
  rejected:
    title: 'This camp cannot go live'
    message: '{organization} was not verified, so this camp stays hidden from the public listing and cannot accept registrations. Correct the organization details and submit them for verification again.'
    short: 'Cannot go live — organization not verified'
newsletter:
  pending:
    title: 'This newsletter cannot send yet'
    message: '{organization} is awaiting verification. Set everything up now — only sending is disabled.'
    short: 'Sending disabled until verification'
  rejected:
    title: 'This newsletter cannot send'
    message: '{organization} was not verified. Correct its details and submit them again.'
    short: 'Sending disabled — organization not verified'
action: 'Open organization'
close: 'Close'
</i18n>

<i18n lang="yaml" locale="de">
camp:
  pending:
    title: 'Dieses Camp erreicht noch niemanden'
    message: '{organization} wartet noch auf die Verifizierung. Dieses Camp ist daher nicht öffentlich sichtbar und nimmt keine Anmeldungen an — unabhängig vom Anmeldezeitraum.'
    short: 'Ausgeblendet bis zur Verifizierung'
  rejected:
    title: 'Dieses Camp kann nicht live gehen'
    message: '{organization} wurde nicht verifiziert. Dieses Camp bleibt daher nicht öffentlich sichtbar und nimmt keine Anmeldungen an. Korrigiere die Angaben der Organisation und reiche sie erneut zur Verifizierung ein.'
    short: 'Nicht live — Organisation nicht verifiziert'
newsletter:
  pending:
    title: 'Dieser Newsletter kann noch nicht senden'
    message: '{organization} wartet auf die Verifizierung. Sie können alles vorbereiten — nur das Senden ist deaktiviert.'
    short: 'Senden bis zur Verifizierung deaktiviert'
  rejected:
    title: 'Dieser Newsletter kann nicht senden'
    message: '{organization} wurde nicht verifiziert. Korrigieren Sie die Angaben und reichen Sie sie erneut ein.'
    short: 'Senden deaktiviert — nicht verifiziert'
action: 'Organisation öffnen'
close: 'Schließen'
</i18n>

<i18n lang="yaml" locale="fr">
camp:
  pending:
    title: "Ce camp n'atteint encore personne"
    message: "{organization} attend encore sa vérification : ce camp est masqué de la liste publique et ne peut pas accepter d'inscriptions, quelle que soit la période d'inscription."
    short: "Masqué jusqu'à la vérification"
  rejected:
    title: 'Ce camp ne peut pas être mis en ligne'
    message: "{organization} n'a pas été vérifiée : ce camp reste masqué de la liste publique et ne peut pas accepter d'inscriptions. Corrige les informations de l'organisation et soumets-les à nouveau."
    short: 'Non publiable — organisation non vérifiée'
newsletter:
  pending:
    title: 'Cette newsletter ne peut pas encore être envoyée'
    message: "{organization} attend sa vérification. Préparez tout dès maintenant : seul l'envoi est désactivé."
    short: "Envoi désactivé jusqu'à la vérification"
  rejected:
    title: 'Cette newsletter ne peut pas être envoyée'
    message: "{organization} n'a pas été vérifiée. Corrigez ses informations et soumettez-les à nouveau."
    short: 'Envoi désactivé — organisation non vérifiée'
action: "Ouvrir l'organisation"
close: 'Fermer'
</i18n>

<i18n lang="yaml" locale="pl">
camp:
  pending:
    title: 'Ten obóz nie dociera jeszcze do nikogo'
    message: '{organization} wciąż oczekuje na weryfikację, więc ten obóz jest ukryty na liście publicznej i nie przyjmuje zapisów — niezależnie od okresu rejestracji.'
    short: 'Ukryty do czasu weryfikacji'
  rejected:
    title: 'Ten obóz nie może zostać opublikowany'
    message: '{organization} nie została zweryfikowana, więc ten obóz pozostaje ukryty na liście publicznej i nie przyjmuje zapisów. Popraw dane organizacji i zgłoś je ponownie do weryfikacji.'
    short: 'Brak publikacji — organizacja niezweryfikowana'
newsletter:
  pending:
    title: 'Tego newslettera nie można jeszcze wysłać'
    message: '{organization} oczekuje na weryfikację. Możesz wszystko przygotować — wyłączona jest tylko wysyłka.'
    short: 'Wysyłka wyłączona do czasu weryfikacji'
  rejected:
    title: 'Tego newslettera nie można wysłać'
    message: '{organization} nie została zweryfikowana. Popraw jej dane i zgłoś je ponownie.'
    short: 'Wysyłka wyłączona — brak weryfikacji'
action: 'Otwórz organizację'
close: 'Zamknij'
</i18n>

<i18n lang="yaml" locale="cs">
camp:
  pending:
    title: 'Tento tábor zatím nikoho neoslovuje'
    message: '{organization} stále čeká na ověření, takže tento tábor je skrytý ve veřejném seznamu a nepřijímá registrace — bez ohledu na registrační období.'
    short: 'Skrytý do ověření'
  rejected:
    title: 'Tento tábor nelze zveřejnit'
    message: '{organization} nebyla ověřena, takže tento tábor zůstává skrytý ve veřejném seznamu a nepřijímá registrace. Uprav údaje organizace a odešli je znovu k ověření.'
    short: 'Nelze zveřejnit — organizace neověřena'
newsletter:
  pending:
    title: 'Tento newsletter zatím nelze odeslat'
    message: '{organization} čeká na ověření. Vše si můžete připravit — vypnuté je jen odesílání.'
    short: 'Odesílání vypnuto do ověření'
  rejected:
    title: 'Tento newsletter nelze odeslat'
    message: '{organization} nebyla ověřena. Uprav její údaje a odešli je znovu.'
    short: 'Odesílání vypnuto — organizace neověřena'
action: 'Otevřít organizaci'
close: 'Zavřít'
</i18n>
