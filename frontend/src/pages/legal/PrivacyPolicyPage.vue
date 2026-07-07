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

      <div class="text-h4 q-mb-lg">
        {{ t('title') }}
      </div>

      <q-banner
        v-if="html === null"
        rounded
        class="bg-surface-container-low text-on-surface-variant"
      >
        <template #avatar>
          <q-icon name="info" />
        </template>
        {{ t('placeholder') }}
      </q-banner>

      <!-- eslint-disable-next-line vue/no-v-html -- operator-authored content, not user input -->
      <div
        v-else
        class="legal-content"
        v-html="html"
      />
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { useMeta } from 'quasar';
import { useRouter } from 'vue-router';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import { onMounted, ref } from 'vue';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import { useLegalService } from '@/services/LegalService';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { useErrorExtractor } from '@/composables/serviceHandler';
import { createMarkdownConverter } from '@/utils/markdown';

const { t } = useI18n();
const router = useRouter();
const { fetchLegalDocument } = useLegalService();
const { to } = useObjectTranslation();
const { extractErrorText } = useErrorExtractor();
const converter = createMarkdownConverter();

const loading = ref<boolean>(true);
const error = ref<string | null>(null);
const html = ref<string | null>(null);

onMounted(async () => {
  try {
    const document = await fetchLegalDocument('PRIVACY_POLICY');
    const content = to(document.content ?? undefined);
    html.value = content ? converter.render(content) : null;
  } catch (err) {
    error.value = extractErrorText(err);
  } finally {
    loading.value = false;
  }
});

useMeta(() => {
  return {
    title: t('title'),
    titleTemplate: (title) => `${title} | ${t('app_name')}`,
  };
});

function goBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    void router.push('/');
  }
}
</script>

<style lang="scss" scoped>
.legal-content {
  :deep(h1),
  :deep(h2),
  :deep(h3) {
    color: var(--md3-on-surface);
  }

  :deep(a) {
    color: var(--md3-primary);
  }
}
</style>

<i18n lang="yaml" locale="en">
title: 'Privacy Policy'
back: 'Back'
placeholder: 'The privacy policy content has not been added yet. Replace this placeholder with information about how participant data is collected, stored, and processed.'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Datenschutzerklärung'
back: 'Zurück'
placeholder: 'Der Inhalt der Datenschutzerklärung wurde noch nicht hinzugefügt. Ersetze diesen Platzhalter durch Angaben dazu, wie Teilnehmerdaten erhoben, gespeichert und verarbeitet werden.'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Politique de confidentialité'
back: 'Retour'
placeholder: 'Le contenu de la politique de confidentialité n’a pas encore été ajouté. Remplacez cet espace réservé par des informations sur la manière dont les données des participants sont collectées, stockées et traitées.'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Polityka prywatności'
back: 'Wstecz'
placeholder: 'Treść polityki prywatności nie została jeszcze dodana. Zastąp ten symbol zastępczy informacjami o tym, w jaki sposób dane uczestników są gromadzone, przechowywane i przetwarzane.'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Zásady ochrany osobních údajů'
back: 'Zpět'
placeholder: 'Obsah zásad ochrany osobních údajů zatím nebyl přidán. Nahraďte tento zástupný text informacemi o tom, jak jsou údaje účastníků shromažďovány, ukládány a zpracovávány.'
</i18n>
