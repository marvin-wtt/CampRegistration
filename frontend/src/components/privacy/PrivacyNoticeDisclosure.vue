<template>
  <!--
    Layered presentation: a short statement always visible at the point of
    collection, the full Art. 13 text one click away, and a permanent link for
    afterwards. Deliberately *not* a consent checkbox — the legal basis for a
    camp registration is the contract, and a blanket "I accept the privacy
    policy" tick would be meaningless.
  -->
  <div
    v-if="notice"
    class="privacy-disclosure"
    data-test="privacy-notice-disclosure"
  >
    <div class="privacy-disclosure__inner">
      <q-icon
        name="privacy_tip"
        size="20px"
        class="privacy-disclosure__icon"
      />

      <div class="privacy-disclosure__text">
        <p class="privacy-disclosure__summary">
          {{ t('summary', { organization: notice.controller.name }) }}
        </p>
      </div>

      <m-btn
        text
        primary
        no-caps
        :label="t('showDetails')"
        data-test="privacy-notice-open"
        @click="dialogOpen = true"
      />
    </div>

    <q-dialog v-model="dialogOpen">
      <q-card
        class="privacy-disclosure__card"
        data-test="privacy-notice-dialog"
      >
        <q-card-section class="row items-center no-wrap q-pb-sm">
          <div class="text-h6 col">{{ t('showDetails') }}</div>
          <m-btn
            v-close-popup
            flat
            round
            icon="close"
            :aria-label="t('close')"
          />
        </q-card-section>

        <q-separator />

        <q-card-section class="scroll privacy-disclosure__body">
          <privacy-notice :notice />
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <m-btn
            text
            primary
            no-caps
            icon="open_in_new"
            :label="t('permanentLink')"
            :to="{ name: 'camp.privacy', params: { campId } }"
            target="_blank"
          />
          <m-btn
            v-close-popup
            text
            primary
            no-caps
            :label="t('close')"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import type { PublishedPrivacyNotice } from '@camp-registration/common/privacy';
import PrivacyNotice from '@/components/privacy/PrivacyNotice.vue';
import { usePrivacyNoticeService } from '@/services/PrivacyNoticeService';

const props = defineProps<{
  campId: string;
}>();

const { t } = useI18n();
const { fetchCampNotice } = usePrivacyNoticeService();

const notice = ref<PublishedPrivacyNotice | null>(null);
const dialogOpen = ref<boolean>(false);

async function load() {
  try {
    notice.value = await fetchCampNotice(props.campId);
  } catch {
    // A failed fetch must never block the registration form; the permanent
    // link below still reaches the notice.
    notice.value = null;
  }
}

onMounted(load);
watch(() => props.campId, load);
</script>

<style lang="scss" scoped>
.privacy-disclosure {
  border-top: 1px solid var(--md3-outline-variant);
  padding: 0.75rem 1rem;
  color: var(--md3-on-surface-variant);

  &__inner {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem 0.75rem;
    max-width: 900px;
    margin: 0 auto;
  }

  &__icon {
    flex: 0 0 auto;
  }

  &__text {
    flex: 1 1 20rem;
    font-size: 0.875rem;
  }

  &__summary {
    margin: 0;
    font-size: 0.875rem;
  }

  &__card {
    width: 720px;
    max-width: 90vw;
  }

  &__body {
    max-height: 65vh;
  }
}
</style>

<i18n lang="yaml" locale="en">
summary: '{organization} is responsible for the data you enter here. Before you submit, please read what it is used for and how long it is kept.'
showDetails: 'Privacy information'
permanentLink: 'Open in a new tab'
close: 'Close'
</i18n>

<i18n lang="yaml" locale="de">
summary: '{organization} ist für die hier eingegebenen Daten verantwortlich. Bitte lies vor dem Absenden, wofür sie verwendet und wie lange sie gespeichert werden.'
showDetails: 'Datenschutzinformationen'
permanentLink: 'In neuem Tab öffnen'
close: 'Schließen'
</i18n>

<i18n lang="yaml" locale="fr">
summary: "{organization} est responsable des données que vous saisissez ici. Avant d'envoyer, veuillez lire à quoi elles servent et combien de temps elles sont conservées."
showDetails: 'Informations sur la protection des données'
permanentLink: 'Ouvrir dans un nouvel onglet'
close: 'Fermer'
</i18n>

<i18n lang="yaml" locale="cs">
summary: 'Za údaje, které zde zadáš, odpovídá {organization}. Před odesláním si prosím přečti, k čemu se používají a jak dlouho se uchovávají.'
showDetails: 'Informace o ochraně osobních údajů'
permanentLink: 'Otevřít na nové kartě'
close: 'Zavřít'
</i18n>

<i18n lang="yaml" locale="pl">
summary: 'Za dane, które tu wprowadzasz, odpowiada {organization}. Przed wysłaniem zapoznaj się z tym, do czego są używane i jak długo są przechowywane.'
showDetails: 'Informacje o ochronie danych'
permanentLink: 'Otwórz w nowej karcie'
close: 'Zamknij'
</i18n>
