<template>
  <q-card
    ref="card"
    flat
    bordered
    class="custom-entry q-mb-sm"
  >
    <q-card-section class="q-pa-sm column q-gutter-y-sm">
      <div class="row items-center no-wrap q-gutter-sm">
        <translated-input
          :model-value="entry.label"
          :label="t(`name.${kind}`)"
          :locales
          :countries
          default-untranslated
          dense
          outlined
          rounded
          hide-bottom-space
          :disable="!canEdit"
          class="col"
          @update:model-value="(v) => update({ label: asTranslatable(v) })"
        />
        <slot name="actions" />
        <m-btn
          flat
          round
          dense
          icon="delete"
          :aria-label="t('remove')"
          :disable="!canEdit"
          @click="emit('remove')"
        />
      </div>

      <template v-if="purpose">
        <q-select
          :model-value="purpose.legalBasis"
          :options="legalBasisOptions"
          :label="t('legalBasis')"
          emit-value
          map-options
          dense
          outlined
          rounded
          :disable="!canEdit"
          @update:model-value="(v) => update({ legalBasis: v })"
        />
        <div
          v-if="legalBasisCaution(purpose.legalBasis)"
          class="text-caption text-warning"
        >
          {{ legalBasisCaution(purpose.legalBasis) }}
        </div>
        <translated-input
          v-if="purpose.legalBasis === 'legitimate_interests'"
          :model-value="purpose.legitimateInterest"
          :label="t('legitimateInterest')"
          :locales
          :countries
          always
          dense
          outlined
          rounded
          :disable="!canEdit"
          @update:model-value="
            (v) => update({ legitimateInterest: asTranslatable(v) })
          "
        />
        <div
          v-if="purpose.legalBasis === 'consent'"
          class="text-caption text-on-surface-variant"
        >
          {{
            gt('privacy.editor.field.consentQuestion', {
              citation: cite('freelyGiven'),
            })
          }}
        </div>
      </template>

      <template v-else-if="category">
        <div>
          <q-checkbox
            :model-value="category.special === true"
            :label="withCitation(t('special'), 'specialCategories')"
            dense
            :disable="!canEdit"
            @update:model-value="setSpecial"
          />
          <div class="text-caption text-on-surface-variant custom-entry__inset">
            {{ t('specialHint') }}
          </div>
        </div>
        <special-category-basis-field
          v-if="category.special"
          :model-value="category.specialCategoryBasis"
          :legal-reference="category.legalReference"
          :can-edit="canEdit"
          :locales
          :countries
          class="custom-entry__inset custom-entry__basis"
          @update:model-value="
            (v) => update({ specialCategoryBasis: v ?? null })
          "
          @update:legal-reference="(v) => update({ legalReference: v ?? null })"
        />
      </template>
    </q-card-section>
  </q-card>
</template>

<script
  lang="ts"
  setup
  generic="
    T extends
      PrivacyPurposeEntry | PrivacyDataCategoryEntry | PrivacyRecipientEntry
  "
>
import { computed, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import {
  DEFAULT_SPECIAL_CATEGORY_BASIS,
  type PrivacyDataCategoryEntry,
  type PrivacyPurposeEntry,
  type PrivacyRecipientEntry,
} from '@camp-registration/common/privacy';
import type { Translatable } from '@camp-registration/common/entities';
import TranslatedInput from '@/components/common/inputs/TranslatedInput.vue';
import SpecialCategoryBasisField from '@/components/privacy/SpecialCategoryBasisField.vue';
import { usePrivacyLabels } from '@/composables/privacyLabels';

/**
 * An entry the author named themselves, on either privacy page. Emits a new
 * entry rather than editing the one passed in.
 */
const props = defineProps<{
  entry: T;
  kind: 'purpose' | 'category' | 'recipient';
  /** Texts are keyed by `countries` where given (an event's), else `locales`. */
  locales?: string[] | undefined;
  countries?: string[] | undefined;
  canEdit: boolean;
}>();

const emit = defineEmits<{
  'update:entry': [entry: T];
  remove: [];
}>();

const { t } = useI18n();
const { t: gt } = useI18n({ useScope: 'global' });
const { legalBasisOptions, legalBasisCaution, cite, withCitation } =
  usePrivacyLabels();

const purpose = computed(() =>
  props.kind === 'purpose' ? (props.entry as PrivacyPurposeEntry) : null,
);
const category = computed(() =>
  props.kind === 'category' ? (props.entry as PrivacyDataCategoryEntry) : null,
);

const card = useTemplateRef<{ $el: HTMLElement }>('card');

/**
 * Brings a just-added entry into view: it lands in the section's list, away
 * from the button that added it, so the page scrolls there, puts the cursor
 * in its name.
 */
function reveal() {
  const element = card.value?.$el;
  if (!element) {
    return;
  }

  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;
  element.scrollIntoView({
    behavior: reducedMotion ? 'auto' : 'smooth',
    block: 'center',
  });
  element
    .querySelector<HTMLElement>('input, textarea')
    ?.focus({ preventScroll: true });
}

defineExpose({ reveal });

function asTranslatable(value: unknown): Translatable | null {
  return (value ?? null) as Translatable | null;
}

/** Any field of the three entry shapes; the key is never changed here. */
type EntryPatch = Partial<
  Omit<PrivacyPurposeEntry, 'key'> &
    Omit<PrivacyDataCategoryEntry, 'key'> &
    Omit<PrivacyRecipientEntry, 'key'>
>;

function update(patch: EntryPatch) {
  emit('update:entry', { ...props.entry, ...patch } as T);
}

function setSpecial(special: boolean) {
  update({
    special,
    specialCategoryBasis: special ? DEFAULT_SPECIAL_CATEGORY_BASIS : null,
  });
}
</script>

<style lang="scss" scoped>
.custom-entry {
  background-color: var(--md3-surface-container-low);
  border-radius: 12px;

  // Lines hints and the basis up with the checkbox label.
  &__inset {
    margin-left: 2.25rem;
  }

  &__basis {
    max-width: 28rem;
  }
}
</style>

<i18n lang="yaml" locale="en">
name:
  purpose: 'Name of the purpose'
  category: 'Name of the category'
  recipient: 'Recipient'
legalBasis: 'Legal basis'
legitimateInterest: 'Describe your legitimate interest'
special: 'Sensitive'
specialHint: 'Health, disability, religion, ethnicity, politics, trade-union membership, sex life or biometric data.'
remove: 'Remove'
</i18n>

<i18n lang="yaml" locale="de">
name:
  purpose: 'Bezeichnung des Zwecks'
  category: 'Bezeichnung der Kategorie'
  recipient: 'Empfänger'
legalBasis: 'Rechtsgrundlage'
legitimateInterest: 'Das berechtigte Interesse beschreiben'
special: 'Besondere Kategorie'
specialHint: 'Gesundheit, Behinderung, Religion, ethnische Herkunft, politische Meinung, Gewerkschaftszugehörigkeit, Sexualleben oder biometrische Daten.'
remove: 'Entfernen'
</i18n>

<i18n lang="yaml" locale="fr">
name:
  purpose: 'Nom de la finalité'
  category: 'Nom de la catégorie'
  recipient: 'Destinataire'
legalBasis: 'Base légale'
legitimateInterest: 'Décrivez votre intérêt légitime'
special: 'Donnée sensible'
specialHint: 'Santé, handicap, religion, origine ethnique, opinions politiques, appartenance syndicale, vie sexuelle ou données biométriques.'
remove: 'Supprimer'
</i18n>

<i18n lang="yaml" locale="cs">
name:
  purpose: 'Název účelu'
  category: 'Název kategorie'
  recipient: 'Příjemce'
legalBasis: 'Právní základ'
legitimateInterest: 'Popiš váš oprávněný zájem'
special: 'Citlivý údaj'
specialHint: 'Zdraví, postižení, náboženství, etnický původ, politické názory, členství v odborech, sexuální život nebo biometrické údaje.'
remove: 'Odebrat'
</i18n>

<i18n lang="yaml" locale="pl">
name:
  purpose: 'Nazwa celu'
  category: 'Nazwa kategorii'
  recipient: 'Odbiorca'
legalBasis: 'Podstawa prawna'
legitimateInterest: 'Opisz Wasz prawnie uzasadniony interes'
special: 'Dane wrażliwe'
specialHint: 'Zdrowie, niepełnosprawność, religia, pochodzenie etniczne, poglądy polityczne, przynależność związkowa, życie seksualne lub dane biometryczne.'
remove: 'Usuń'
</i18n>
