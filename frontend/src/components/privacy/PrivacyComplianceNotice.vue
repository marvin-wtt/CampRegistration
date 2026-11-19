<template>
  <!-- Public registration is refused while the form asks for data its privacy
       notice does not cover (`eventPrivacyCompliant`). This tells the managers
       why, while it still matters: registration open or about to open. -->
  <danger-card
    v-if="problems.length > 0"
    icon="gpp_maybe"
    data-test="privacy-compliance-notice"
  >
    <div class="text-subtitle1 text-weight-bold">{{ t('title') }}</div>
    <div
      v-for="problem in problems"
      :key="problem"
      class="text-body2 text-on-surface-variant"
    >
      {{ problem }}
    </div>

    <template
      v-if="canEdit"
      #actions
    >
      <q-btn
        :label="t('action.form')"
        outline
        rounded
        no-caps
        color="negative"
        :to="{ name: 'management.event.settings.form' }"
      />
      <q-btn
        :label="t('action.privacy')"
        flat
        rounded
        no-caps
        color="negative"
        :to="{ name: 'management.event.settings.privacy' }"
      />
    </template>
  </danger-card>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { EventDetails } from '@camp-registration/common/entities';
import { formPrivacyIssues } from '@camp-registration/common/form';
import type { PublishedPrivacyNotice } from '@camp-registration/common/privacy';
import DangerCard from '@/components/common/DangerCard.vue';
import { usePrivacyNoticeService } from '@/services/PrivacyNoticeService';
import { usePermissions } from '@/composables/permissions';

const { event } = defineProps<{ event: EventDetails }>();

const { t } = useI18n();
const { t: gt } = useI18n({ useScope: 'global' });
const { can } = usePermissions();
const { fetchEventNotice } = usePrivacyNoticeService();

const canEdit = computed(() => can('event.edit'));

// Undefined while loading or when the lookup failed: then nothing is claimed.
const notice = ref<PublishedPrivacyNotice | undefined>();

watch(
  () => event.id,
  async (id) => {
    notice.value = undefined;
    try {
      notice.value = await fetchEventNotice(id);
    } catch {
      // A hint, not a gate: the server still refuses what it must.
    }
  },
  { immediate: true },
);

function categoryNames(keys: string[]): string {
  return keys.map((key) => gt(`privacy.dataCategory.${key}`)).join(', ');
}

/** What blocks registrations, as sentences; empty when nothing does. */
const problems = computed<string[]>(() => {
  // A closed registration loses nobody; the form editor still shows them.
  if (event.registrationStatus === 'closed' || !notice.value) {
    return [];
  }

  const issues = formPrivacyIssues(event.form, notice.value.notice);
  return [
    ...(issues.undeclared.length
      ? [
          t('undeclared', {
            categories: categoryNames(issues.undeclared),
          }),
        ]
      : []),
    ...(issues.uncovered.length
      ? [t('uncovered', { categories: categoryNames(issues.uncovered) })]
      : []),
  ];
});
</script>

<i18n lang="yaml" locale="en">
title: 'Registrations are refused'
undeclared: 'The form asks for {categories}, which the privacy notice does not list.'
uncovered: 'The form asks for {categories} without a consent question for it.'
action:
  form: 'Open the form'
  privacy: 'Privacy settings'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Anmeldungen werden abgelehnt'
undeclared: 'Das Formular fragt nach {categories}, die Datenschutzinformationen nennen das aber nicht.'
uncovered: 'Das Formular fragt nach {categories}, ohne dafür eine Einwilligung einzuholen.'
action:
  form: 'Formular öffnen'
  privacy: 'Datenschutz-Einstellungen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Les inscriptions sont refusées'
undeclared: 'Le formulaire demande {categories}, que les informations sur la protection des données ne mentionnent pas.'
uncovered: 'Le formulaire demande {categories} sans question de consentement correspondante.'
action:
  form: 'Ouvrir le formulaire'
  privacy: 'Paramètres de confidentialité'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Zgłoszenia są odrzucane'
undeclared: 'Formularz pyta o {categories}, czego informacje o ochronie danych nie wymieniają.'
uncovered: 'Formularz pyta o {categories} bez pytania o zgodę.'
action:
  form: 'Otwórz formularz'
  privacy: 'Ustawienia prywatności'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Přihlášky jsou odmítány'
undeclared: 'Formulář se ptá na {categories}, což informace o ochraně osobních údajů neuvádějí.'
uncovered: 'Formulář se ptá na {categories} bez otázky na souhlas.'
action:
  form: 'Otevřít formulář'
  privacy: 'Nastavení ochrany údajů'
</i18n>
