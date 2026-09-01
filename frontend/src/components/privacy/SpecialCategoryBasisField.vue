<template>
  <!-- Explicit consent is what a event relies on in practice, so it is stated
       rather than chosen. The four alternatives each need a condition most
       events do not meet, so they live behind a disclosure with those
       conditions spelled out — a flat list of five invites picking whichever
       sounds nicest. -->
  <div class="art9">
    <div class="text-caption">
      {{ t('privacy.editor.field.art9Basis') }}:
      {{ t(`privacy.specialCategoryBasis.${selected}`) }}
    </div>
    <q-expansion-item
      dense
      :label="t('privacy.editor.field.art9Other')"
      header-class="text-caption text-primary q-pl-none"
    >
      <div
        v-for="option in options"
        :key="option.value"
        class="q-mt-xs"
      >
        <q-radio
          :model-value="selected"
          :val="option.value"
          :label="option.label"
          dense
          :disable="!canEdit"
          @update:model-value="(value) => (model = value)"
        />
        <div class="text-caption text-on-surface-variant art9__condition">
          {{ option.condition }}
        </div>
      </div>
    </q-expansion-item>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  ADVANCED_SPECIAL_CATEGORY_BASIS_KEYS,
  DEFAULT_SPECIAL_CATEGORY_BASIS,
  type SpecialCategoryBasisKey,
} from '@camp-registration/common/privacy';

const model = defineModel<SpecialCategoryBasisKey | null | undefined>();

defineProps<{ canEdit: boolean }>();

// The catalogue vocabulary is global: the same words appear in the notice a
// registrant reads.
const { t } = useI18n({ useScope: 'global' });

/** An entry saved before the default existed still has to render as something. */
const selected = computed(() => model.value ?? DEFAULT_SPECIAL_CATEGORY_BASIS);

/** Consent first as the plain case, then the four conditional alternatives. */
const options = computed(() =>
  [DEFAULT_SPECIAL_CATEGORY_BASIS, ...ADVANCED_SPECIAL_CATEGORY_BASIS_KEYS].map(
    (key) => ({
      value: key,
      label: t(`privacy.specialCategoryBasis.${key}`),
      condition: t(`privacy.specialCategoryCondition.${key}`),
    }),
  ),
);
</script>

<style lang="scss" scoped>
// Lines the condition up with its radio's label rather than with the radio.
.art9__condition {
  margin-left: 2rem;
  margin-bottom: 0.35rem;
  max-width: 34rem;
}
</style>
