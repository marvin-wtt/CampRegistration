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

      <h1 class="text-h4 q-mt-none q-mb-lg">
        {{ title }}
      </h1>

      <legal-placeholder v-if="html === null" />

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
import { computed, onMounted, ref, watch } from 'vue';
import type { LegalDocumentType } from '@camp-registration/common/entities';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import LegalPlaceholder from '@/components/legal/LegalPlaceholder.vue';
import { useLegalService } from '@/services/LegalService';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { useErrorExtractor } from '@/composables/serviceHandler';

const props = defineProps<{
  type: LegalDocumentType;
}>();

const { t } = useI18n();
const router = useRouter();
const { fetchLegalDocument } = useLegalService();
const { to } = useObjectTranslation();
const { extractErrorText } = useErrorExtractor();

const loading = ref<boolean>(true);
const error = ref<string | null>(null);
const html = ref<string | null>(null);

const title = computed<string>(() =>
  props.type === 'IMPRINT' ? t('imprint') : t('privacyPolicy'),
);

onMounted(() => {
  void loadDocument(props.type);
});

useMeta(() => {
  return {
    title: title.value,
    titleTemplate: (pageTitle) => `${pageTitle} | ${t('app_name')}`,
  };
});

watch(() => props.type, loadDocument);

async function loadDocument(type: LegalDocumentType) {
  loading.value = true;
  error.value = null;
  html.value = null;

  try {
    const document = await fetchLegalDocument(type);
    // Content is operator-authored HTML from the rich-text editor, rendered
    // directly (locale resolved via `to`).
    html.value = to(document.content) || null;
  } catch (err) {
    error.value = extractErrorText(err);
  } finally {
    loading.value = false;
  }
}

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
  /* The document title above is the page's h1, so the editor's own top level
     (h2) has to read as a section heading under it — the browser's default
     scale sizes it as a title in its own right. An h1 from older content is
     sized the same, rather than as a second page title. */
  :deep(h1),
  :deep(h2),
  :deep(h3) {
    color: var(--md3-on-surface);
    font-weight: 500;
    line-height: 1.4;
  }

  :deep(h1),
  :deep(h2) {
    font-size: 1.5rem;
    margin: 2rem 0 0.5rem;
  }

  :deep(h3) {
    font-size: 1.25rem;
    margin: 1.5rem 0 0.5rem;
  }

  /* The first heading opens the document; the title already provides the gap. */
  :deep(h1:first-child),
  :deep(h2:first-child),
  :deep(h3:first-child) {
    margin-top: 0;
  }

  :deep(a) {
    color: var(--md3-primary);
  }
}
</style>

<i18n lang="yaml" locale="en">
imprint: 'Imprint'
privacyPolicy: 'Privacy Policy'
back: 'Back'
</i18n>

<i18n lang="yaml" locale="de">
imprint: 'Impressum'
privacyPolicy: 'Datenschutzerklärung'
back: 'Zurück'
</i18n>

<i18n lang="yaml" locale="fr">
imprint: 'Mentions légales'
privacyPolicy: 'Politique de confidentialité'
back: 'Retour'
</i18n>

<i18n lang="yaml" locale="pl">
imprint: 'Nota prawna'
privacyPolicy: 'Polityka prywatności'
back: 'Wstecz'
</i18n>

<i18n lang="yaml" locale="cs">
imprint: 'Tiráž'
privacyPolicy: 'Zásady ochrany osobních údajů'
back: 'Zpět'
</i18n>
