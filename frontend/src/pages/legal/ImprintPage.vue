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
import { onMounted, ref } from 'vue';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import LegalPlaceholder from '@/components/legal/LegalPlaceholder.vue';
import { useLegalService } from '@/services/LegalService';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { useErrorExtractor } from '@/composables/serviceHandler';

const { t } = useI18n();
const router = useRouter();
const { fetchLegalDocument } = useLegalService();
const { to } = useObjectTranslation();
const { extractErrorText } = useErrorExtractor();

const loading = ref<boolean>(true);
const error = ref<string | null>(null);
const html = ref<string | null>(null);

onMounted(async () => {
  try {
    const document = await fetchLegalDocument('IMPRINT');
    // Content is operator-authored HTML from the rich-text editor, rendered
    // directly (locale resolved via `to`).
    html.value = to(document.content ?? undefined) || null;
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
title: 'Imprint'
back: 'Back'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Impressum'
back: 'Zurück'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Mentions légales'
back: 'Retour'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Nota prawna'
back: 'Wstecz'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Tiráž'
back: 'Zpět'
</i18n>
