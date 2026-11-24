<template>
  <div>
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
    <!-- Art. 9(2)(g) is only a basis with the law it rests on; usually one
       citation for every language, so it starts untranslated. -->
    <translated-input
      v-if="needsLegalReference(selected)"
      v-model="legalReference"
      :label="t('privacy.editor.field.legalReference')"
      :hint="t('privacy.editor.field.legalReferenceHint')"
      :locales
      :countries
      add-languages
      :disable="!canEdit"
      default-untranslated
      always
      dense
      outlined
      rounded
      class="q-mt-xs"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  ADVANCED_SPECIAL_CATEGORY_BASIS_KEYS,
  DEFAULT_SPECIAL_CATEGORY_BASIS,
  needsLegalReference,
  type SpecialCategoryBasisKey,
} from '@camp-registration/common/privacy';
import type { Translatable } from '@camp-registration/common/entities';
import TranslatedInput from '@/components/common/inputs/TranslatedInput.vue';
import { usePrivacyLabels } from '@/composables/privacyLabels';

const model = defineModel<SpecialCategoryBasisKey | null | undefined>();
const legalReference = defineModel<Translatable | null | undefined>(
  'legalReference',
);

// Texts are keyed by `countries` where given (an event's), else by `locales`.
defineProps<{
  canEdit: boolean;
  locales?: string[] | undefined;
  countries?: string[] | undefined;
}>();

// The catalogue vocabulary is global: the same words appear in the notice a
// registrant reads.
const { t } = useI18n({ useScope: 'global' });
const { specialBasisLabel, specialBasisCondition } = usePrivacyLabels();

/** An entry saved before the default existed still has to render as something. */
const selected = computed(() => model.value ?? DEFAULT_SPECIAL_CATEGORY_BASIS);

/** Consent first as the plain case, then the conditional alternatives. */
const options = computed(() =>
  [DEFAULT_SPECIAL_CATEGORY_BASIS, ...ADVANCED_SPECIAL_CATEGORY_BASIS_KEYS].map(
    (key) => ({
      value: key,
      label: specialBasisLabel(key),
      condition: specialBasisCondition(key),
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
