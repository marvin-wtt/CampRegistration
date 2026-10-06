<template>
  <m-btn
    :label="t('copyLink.label')"
    :disable="!event"
    icon="link"
    primary
    no-caps
    @click="copyRegistrationLink"
  >
    <q-tooltip class="copy-link-tooltip">
      <div>{{ t('copyLink.tooltip') }}</div>
      <div
        v-if="shareCaveat"
        class="copy-link-tooltip__caveat"
      >
        {{ shareCaveat }}
      </div>
    </q-tooltip>
  </m-btn>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { copyToClipboard, useQuasar } from 'quasar';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import type { EventDetails } from '@camp-registration/common/entities';

/**
 * Copies the public event link. Sharing stays offered outside the
 * registration window, as the event page is still reachable; the caveat rides
 * along in the tooltip.
 */
const { event } = defineProps<{
  event: EventDetails | undefined;
}>();

const { t } = useI18n();
const router = useRouter();
const quasar = useQuasar();

// The event page stays reachable outside the registration window, so the link is
// still worth sending — it just can't be signed up through. While the
// organization is unverified the page 403s for everyone but its managers, which
// is the one case where the link is of no use at all.
const shareCaveat = computed<string | null>(() => {
  if (!event) {
    return null;
  }

  if (event.organizationVerificationStatus !== 'VERIFIED') {
    return t('copyLink.caveat.unverified', {
      organization: event.organizationName,
    });
  }

  switch (event.registrationStatus) {
    case 'upcoming':
      return t('copyLink.caveat.upcoming');
    case 'closed':
      return t('copyLink.caveat.closed');
    default:
      return null;
  }
});

async function copyRegistrationLink() {
  const eventId = event?.id;
  if (!eventId) {
    return;
  }

  const url =
    window.location.origin +
    router.resolve({ name: 'event', params: { eventId } }).href;

  try {
    await copyToClipboard(url);
    // The copy itself succeeded either way — the caveat is context, not a
    // failure, so it rides along as a caption rather than flipping the tone.
    const showShareCaveat = shareCaveat.value != null;

    quasar.notify({
      type: showShareCaveat ? 'warning' : 'positive',
      message: t('copyLink.success'),
      caption: showShareCaveat ? shareCaveat.value : '',
      icon: 'assignment_turned_in',
    });
  } catch {
    quasar.notify({
      type: 'negative',
      message: t('copyLink.fail'),
    });
  }
}
</script>

<style scoped>
.copy-link-tooltip {
  max-width: 260px;
}

.copy-link-tooltip__caveat {
  margin-top: 4px;
  opacity: 0.8;
}
</style>

<i18n lang="yaml" locale="en">
copyLink:
  label: 'Copy link'
  tooltip: 'Copy the public registration form link'
  success: 'Link copied to clipboard'
  fail: 'Failed to copy link to clipboard'
  caveat:
    closed: 'Registration is closed — visitors can view the event but cannot sign up.'
    upcoming: 'Registration has not opened yet — visitors can view the event but cannot sign up yet.'
    unverified: 'Only this event’s managers can open the link while {organization} is unverified.'
</i18n>

<i18n lang="yaml" locale="de">
copyLink:
  label: 'Link kopieren'
  tooltip: 'Link zum öffentlichen Anmeldeformular kopieren'
  success: 'Link in die Zwischenablage kopiert'
  fail: 'Link konnte nicht kopiert werden'
  caveat:
    closed: 'Die Anmeldung ist geschlossen — Besucher sehen die Veranstaltung, können sich aber nicht anmelden.'
    upcoming: 'Die Anmeldung ist noch nicht geöffnet — Besucher sehen die Veranstaltung, können sich aber noch nicht anmelden.'
    unverified: 'Solange {organization} nicht verifiziert ist, können nur die Verantwortlichen dieser Veranstaltung den Link öffnen.'
</i18n>

<i18n lang="yaml" locale="fr">
copyLink:
  label: 'Copier le lien'
  tooltip: "Copier le lien du formulaire d'inscription public"
  success: 'Lien copié dans le presse-papiers'
  fail: 'Échec de la copie du lien'
  caveat:
    closed: "Les inscriptions sont fermées — les visiteurs peuvent voir l'événement mais pas s’inscrire."
    upcoming: "Les inscriptions ne sont pas encore ouvertes — les visiteurs peuvent voir l'événement mais pas encore s’inscrire."
    unverified: 'Tant que {organization} n’est pas vérifiée, seuls les responsables de cet événement peuvent ouvrir le lien.'
</i18n>

<i18n lang="yaml" locale="pl">
copyLink:
  label: 'Kopiuj link'
  tooltip: 'Skopiuj link do publicznego formularza rejestracji'
  success: 'Link skopiowany do schowka'
  fail: 'Nie udało się skopiować linku'
  caveat:
    closed: 'Rejestracja jest zamknięta — odwiedzający zobaczą wydarzenie, ale nie mogą się zapisać.'
    upcoming: 'Rejestracja jeszcze się nie rozpoczęła — odwiedzający zobaczą wydarzenie, ale nie mogą się jeszcze zapisać.'
    unverified: 'Dopóki {organization} nie zostanie zweryfikowana, link mogą otworzyć tylko osoby zarządzające tym wydarzeniem.'
</i18n>

<i18n lang="yaml" locale="cs">
copyLink:
  label: 'Kopírovat odkaz'
  tooltip: 'Zkopírovat odkaz na veřejný registrační formulář'
  success: 'Odkaz zkopírován do schránky'
  fail: 'Odkaz se nepodařilo zkopírovat'
  caveat:
    closed: 'Registrace je uzavřena — návštěvníci akci uvidí, ale nemohou se přihlásit.'
    upcoming: 'Registrace ještě nezačala — návštěvníci akci uvidí, ale zatím se nemohou přihlásit.'
    unverified: 'Dokud není {organization} ověřena, může odkaz otevřít pouze správa této akce.'
</i18n>
