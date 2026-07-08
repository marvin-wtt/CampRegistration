<template>
  <page-state-handler
    :loading
    :error
    :prevent-leave="imprintModified || privacyPolicyModified"
    style="height: 1px"
  >
    <div class="absolute fit row no-wrap justify-center q-pa-md">
      <div class="column no-wrap col-sm-11 col-md-10 col-lg-9 col-12">
        <!-- Header -->
        <div class="q-mb-lg">
          <div class="text-h5 text-weight-medium">{{ t('title') }}</div>
          <div class="text-body2 text-grey-6 q-mt-xs">{{ t('subtitle') }}</div>
        </div>

        <!-- A tabbed document switcher (rather than stacking both editors)
             makes it obvious there is more than one legal document to edit. -->
        <div class="column no-wrap col legal-tabs">
          <q-tabs
            v-model="tab"
            align="left"
            no-caps
            active-color="primary"
            indicator-color="primary"
            class="q-mb-none text-on-surface-variant"
          >
            <q-tab
              name="IMPRINT"
              icon="badge"
              :label="t('imprint.title')"
              :alert="imprintModified ? 'warning' : false"
              alert-icon="circle"
            />
            <q-tab
              name="PRIVACY_POLICY"
              icon="shield"
              :label="t('privacyPolicy.title')"
              :alert="privacyPolicyModified ? 'warning' : false"
              alert-icon="circle"
            />
          </q-tabs>
          <q-separator />

          <q-tab-panels
            v-model="tab"
            animated
            class="col bg-transparent legal-panels"
          >
            <q-tab-panel
              name="IMPRINT"
              class="q-pa-none q-pt-lg"
              style="overflow-y: auto"
            >
              <legal-document-editor
                ref="imprintEditorRef"
                type="IMPRINT"
                :content="imprintContent"
                class="full-height"
              />
            </q-tab-panel>

            <q-tab-panel
              name="PRIVACY_POLICY"
              class="q-pa-none q-pt-lg"
              style="overflow-y: auto"
            >
              <legal-document-editor
                ref="privacyPolicyEditorRef"
                type="PRIVACY_POLICY"
                :content="privacyPolicyContent"
                class="full-height"
              />
            </q-tab-panel>
          </q-tab-panels>
        </div>
      </div>
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
const tab = ref<'IMPRINT' | 'PRIVACY_POLICY'>('IMPRINT');

const imprintEditorRef = ref<InstanceType<typeof LegalDocumentEditor> | null>(
  null,
);
const privacyPolicyEditorRef = ref<InstanceType<
  typeof LegalDocumentEditor
> | null>(null);

const imprintModified = computed(
  () => imprintEditorRef.value?.isModified ?? false,
);
const privacyPolicyModified = computed(
  () => privacyPolicyEditorRef.value?.isModified ?? false,
);

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

<style scoped>
.legal-tabs {
  min-height: 0;
}

.legal-panels {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

/* Quasar wraps each q-tab-panel in its own internal .q-panel div (the
   transition/swipe container) — that's the actual flex child of
   .legal-panels, not .q-tab-panel itself. Without pinning its min-height,
   it falls back to its content's intrinsic height (since Quasar leaves its
   overflow as the visible default) and refuses to shrink, so the panel
   pushes past the viewport instead of scrolling internally. */
.legal-panels :deep(.q-panel) {
  flex: 1;
  min-height: 0;
}
</style>

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
