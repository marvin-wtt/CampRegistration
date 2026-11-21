<template>
  <!-- Explicit consent is what an event relies on in practice, so it comes
       first and is preselected. Each alternative shows its condition in the
       menu, so nobody picks one because it merely sounds nicer. -->
  <q-select
    :model-value="selected"
    :options
    :label="t('privacy.editor.field.art9Basis')"
    :disable="!canEdit"
    emit-value
    map-options
    outlined
    rounded
    dense
    options-dense
    popup-content-class="art9__menu"
    @update:model-value="(value: SpecialCategoryBasisKey) => (model = value)"
  >
    <template #option="{ itemProps, opt, selected: active }">
      <q-item
        v-bind="itemProps"
        class="art9__option"
      >
        <q-item-section>
          <q-item-label>{{ opt.label }}</q-item-label>
          <q-item-label
            caption
            class="art9__condition"
          >
            {{ opt.condition }}
          </q-item-label>
        </q-item-section>
        <q-item-section
          v-if="active"
          side
        >
          <q-icon
            name="check"
            color="primary"
          />
        </q-item-section>
      </q-item>
    </template>
  </q-select>
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

<style lang="scss">
// The menu is teleported, so these rules can't be scoped.
.art9__menu {
  max-width: min(34rem, calc(100vw - 2rem));

  .art9__option {
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
  }

  .art9__condition {
    white-space: normal;
  }
}
</style>
