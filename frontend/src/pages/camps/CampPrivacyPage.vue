<template>
  <page-state-handler
    :loading
    :error
    class="row justify-center q-pa-md"
  >
    <div class="col-12 col-md-8 col-lg-6 q-py-lg">
      <m-btn
        flat
        round
        icon="arrow_back"
        :aria-label="t('back')"
        class="q-mb-md"
        @click="goBack"
      />

      <h1 class="text-h4 q-mt-none q-mb-sm">
        {{ t('title') }}
      </h1>

      <p class="text-body2 q-mb-lg privacy-page__intro">
        {{ t('intro') }}
        <router-link :to="{ name: 'privacy-policy' }">
          {{ t('platformPolicy') }}
        </router-link>
      </p>

      <privacy-notice
        v-if="notice"
        :notice
      />
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMeta } from 'quasar';
import { useRouter } from 'vue-router';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import type { PublishedPrivacyNotice } from '@camp-registration/common/privacy';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import PrivacyNotice from '@/components/privacy/PrivacyNotice.vue';
import { usePrivacyNoticeService } from '@/services/PrivacyNoticeService';
import { useErrorExtractor } from '@/composables/serviceHandler';

const props = defineProps<{
  campId: string;
}>();

const { t } = useI18n();
const router = useRouter();
const { fetchCampNotice } = usePrivacyNoticeService();
const { extractErrorText } = useErrorExtractor();

const loading = ref<boolean>(true);
const error = ref<string | null>(null);
const notice = ref<PublishedPrivacyNotice | null>(null);

useMeta(() => ({
  title: t('title'),
  titleTemplate: (pageTitle: string) => `${pageTitle} | ${t('app_name')}`,
}));

onMounted(async () => {
  try {
    notice.value = await fetchCampNotice(props.campId);
  } catch (err) {
    error.value = extractErrorText(err);
  } finally {
    loading.value = false;
  }
});

function goBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    void router.push({ name: 'camp', params: { campId: props.campId } });
  }
}
</script>

<style lang="scss" scoped>
.privacy-page__intro {
  color: var(--md3-on-surface-variant);

  a {
    color: var(--md3-primary);
  }
}
</style>

<i18n lang="yaml" locale="en">
title: 'Privacy information'
intro: 'This describes what the organisation running this event does with the data you enter. It comes in addition to the privacy policy of this platform:'
platformPolicy: 'platform privacy policy'
back: 'Back'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Datenschutzinformationen'
intro: 'Hier steht, was die Organisation dieser Veranstaltung mit den von dir eingegebenen Daten macht. Sie gelten zusätzlich zur Datenschutzerklärung dieser Plattform:'
platformPolicy: 'Datenschutzerklärung der Plattform'
back: 'Zurück'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Informations sur la protection des données'
intro: "Vous trouverez ici ce que l'organisation de cet événement fait des données que vous saisissez. Elles s'ajoutent à la politique de confidentialité de cette plateforme :"
platformPolicy: 'politique de confidentialité de la plateforme'
back: 'Retour'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Informace o ochraně osobních údajů'
intro: 'Zde je popsáno, co organizace pořádající tuto akci dělá s údaji, které zadáš. Platí nad rámec zásad ochrany osobních údajů této platformy:'
platformPolicy: 'zásady ochrany osobních údajů platformy'
back: 'Zpět'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Informacje o ochronie danych'
intro: 'Poniżej opisano, co organizacja prowadząca to wydarzenie robi z wprowadzonymi przez Ciebie danymi. Obowiązują one dodatkowo obok polityki prywatności tej platformy:'
platformPolicy: 'polityka prywatności platformy'
back: 'Wstecz'
</i18n>
