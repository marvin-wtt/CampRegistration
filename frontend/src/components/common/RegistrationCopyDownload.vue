<template>
  <div class="column items-center q-gutter-y-sm text-center">
    <p class="text-body2 text-on-surface-variant q-mb-none">
      {{ t('hint') }}
    </p>

    <m-btn
      :label="t('label')"
      icon="download"
      primary
      :loading="state === 'working'"
      data-test="registration-download-copy"
      @click="download"
    />

    <q-banner
      v-if="state === 'error'"
      dense
      rounded
      class="bg-error-container text-on-error-container text-body2"
      data-test="registration-download-error"
    >
      {{ t('error') }}
    </q-banner>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import type { CampDetails } from '@camp-registration/common/entities';
import { useAPIService } from '@/services/APIService';

const { t } = useI18n();
const api = useAPIService();

interface Props {
  campDetails: CampDetails;
  data: Record<string, unknown>;
  locale: string;
}

const props = defineProps<Props>();

const state = ref<'idle' | 'working' | 'error'>('idle');

// The copy is produced in this tab from the data that was just submitted, so a
// registration — which may hold health data — never travels back out over email
// or through an unauthenticated download link. survey-pdf is heavy, so it is
// only pulled in when someone actually asks for the file.
async function download() {
  state.value = 'working';
  try {
    const { downloadRegistrationPdf } =
      await import('@/lib/surveyJs/registrationPdf');

    await downloadRegistrationPdf({
      camp: props.campDetails,
      data: props.data,
      locale: props.locale,
      fileUrl: (slot) =>
        api.getCampFileSlotUrl(props.campDetails.id, slot, props.locale),
    });
    state.value = 'idle';
  } catch {
    state.value = 'error';
  }
}
</script>

<i18n lang="yaml" locale="en">
label: 'Download PDF'
hint: 'Save a copy of your registration — this is the only place to download it.'
error: 'The PDF could not be created. Please try again.'
</i18n>

<i18n lang="yaml" locale="de">
label: 'PDF herunterladen'
hint: 'Sichere dir eine Kopie deiner Anmeldung — nur hier kannst du sie herunterladen.'
error: 'Das PDF konnte nicht erstellt werden. Bitte versuche es erneut.'
</i18n>

<i18n lang="yaml" locale="fr">
label: 'Télécharger le PDF'
hint: "Garde une copie de ton inscription — c'est le seul endroit où tu peux la télécharger."
error: "Le PDF n'a pas pu être créé. Réessaie."
</i18n>

<i18n lang="yaml" locale="pl">
label: 'Pobierz PDF'
hint: 'Zachowaj kopię swojego zgłoszenia — tylko tutaj możesz ją pobrać.'
error: 'Nie udało się utworzyć pliku PDF. Spróbuj ponownie.'
</i18n>

<i18n lang="yaml" locale="cs">
label: 'Stáhnout PDF'
hint: 'Ulož si kopii své registrace — stáhnout ji můžeš jen tady.'
error: 'PDF se nepodařilo vytvořit. Zkus to prosím znovu.'
</i18n>
