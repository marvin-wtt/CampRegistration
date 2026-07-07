<template>
  <page-state-handler
    :loading
    :error
    padding
    class="row justify-center"
  >
    <div class="col-12 col-md-11 col-lg-10 column q-gutter-y-lg">
      <div>
        <div class="text-h5 text-weight-medium">{{ t('title') }}</div>
        <div class="text-body2 text-grey-6 q-mt-xs">{{ t('subtitle') }}</div>
      </div>

      <legal-document-editor
        type="IMPRINT"
        icon="badge"
        :title="t('imprint.title')"
        :content="imprintContent"
      />

      <legal-document-editor
        type="PRIVACY_POLICY"
        icon="shield"
        :title="t('privacyPolicy.title')"
        :content="privacyPolicyContent"
      />
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import LegalDocumentEditor from '@/components/administration/legal/LegalDocumentEditor.vue';
import { useLegalService } from '@/services/LegalService';
import { useErrorExtractor } from '@/composables/serviceHandler';
import type { LegalDocument } from '@camp-registration/common/entities';

const { t } = useI18n();
const { fetchLegalDocuments } = useLegalService();
const { extractErrorText } = useErrorExtractor();

const documents = ref<LegalDocument[]>([]);
const loading = ref<boolean>(true);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    documents.value = await fetchLegalDocuments();
  } catch (err) {
    error.value = extractErrorText(err);
  } finally {
    loading.value = false;
  }
});

const imprintContent = computed(() => {
  return (
    documents.value.find((document) => document.type === 'IMPRINT')?.content ??
    null
  );
});

const privacyPolicyContent = computed(() => {
  return (
    documents.value.find((document) => document.type === 'PRIVACY_POLICY')
      ?.content ?? null
  );
});
</script>

<i18n lang="yaml" locale="en">
title: 'Legal Content'
subtitle: 'Manage the Imprint and Privacy Policy shown to visitors.'
imprint:
  title: 'Imprint'
privacyPolicy:
  title: 'Privacy Policy'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Rechtliche Inhalte'
subtitle: 'Verwalte Impressum und Datenschutzerklärung für Besucher.'
imprint:
  title: 'Impressum'
privacyPolicy:
  title: 'Datenschutzerklärung'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Contenu légal'
subtitle: 'Gérer les mentions légales et la politique de confidentialité affichées aux visiteurs.'
imprint:
  title: 'Mentions légales'
privacyPolicy:
  title: 'Politique de confidentialité'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Treści prawne'
subtitle: 'Zarządzaj notą prawną i polityką prywatności widoczną dla odwiedzających.'
imprint:
  title: 'Nota prawna'
privacyPolicy:
  title: 'Polityka prywatności'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Právní obsah'
subtitle: 'Spravujte tiráž a zásady ochrany osobních údajů zobrazované návštěvníkům.'
imprint:
  title: 'Tiráž'
privacyPolicy:
  title: 'Zásady ochrany osobních údajů'
</i18n>
