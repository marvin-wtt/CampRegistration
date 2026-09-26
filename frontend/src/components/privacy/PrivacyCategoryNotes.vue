<template>
  <!-- Guidance that follows from the category alone, kept in one place: an
       organization and one of its events must never be told different things
       about the same key, and the second author is the one who would silently
       miss a note added for the first. -->
  <div v-if="showAdvisory || showConsent">
    <div v-if="showAdvisory">
      {{ t('privacy.editor.field.art9Advisory') }}
    </div>
    <div
      v-if="showConsent"
      :class="{ 'q-mt-xs': showAdvisory }"
    >
      {{ t('privacy.editor.field.consentQuestion') }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  isAdvisorySpecialCategory,
  requiresConsentQuestion,
  type PrivacyDataCategoryRef,
} from '@camp-registration/common/privacy';

const props = defineProps<{
  categoryKey: PrivacyDataCategoryRef;
}>();

// The catalogue vocabulary is global: the same words appear in both editors.
const { t } = useI18n({ useScope: 'global' });

// Both notes are shown regardless of who declared the category. Whether a form
// offers halal or kosher, and whether it asks for consent, is answered by the
// event that built it — an organization ticking `dietary` for all its events
// cannot have answered it on their behalf.
const showAdvisory = computed(() =>
  isAdvisorySpecialCategory(props.categoryKey),
);
const showConsent = computed(() => requiresConsentQuestion(props.categoryKey));
</script>
