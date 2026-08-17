<template>
  <page-state-handler
    padding
    :loading
    :error
    class="row justify-center"
  >
    <!-- Same shell as the other organization pages: a centred column rather
         than the full page width. -->
    <div class="privacy-shell column col-12 col-sm-10 col-md-8 q-gutter-md">
      <div class="page-title">
        <div class="text-h5 text-weight-medium">{{ t('title') }}</div>
        <div class="text-body2 text-on-surface-variant q-mt-xs">
          {{ t('subtitle') }}
        </div>
        <!-- The camp addendum merges on top of this, so an author needs to know
             up front that they are writing the shared part. -->
        <div class="text-caption text-on-surface-variant q-mt-xs">
          {{ t('baselineNote') }}
        </div>
      </div>

      <!-- The builder is the default because it is the only path that produces
           a notice in every language a camp runs in. Free text stays available
           for anyone whose processing it cannot express, or who already has
           counsel-drafted wording. -->
      <q-card
        flat
        bordered
      >
        <q-card-section>
          <div class="text-subtitle2 text-weight-bold">
            {{ t('mode.title') }}
          </div>
          <q-option-group
            v-model="content.mode"
            :options="modeOptions"
            :disable="!canEdit"
            class="q-mt-sm"
          />
          <div
            v-if="content.mode === 'free_text'"
            class="text-caption text-warning q-mt-sm"
          >
            {{ t('mode.freeTextWarning') }}
          </div>
        </q-card-section>
      </q-card>

      <!-- Free text -->
      <q-card
        v-if="content.mode === 'free_text'"
        flat
        bordered
      >
        <q-card-section>
          <div class="text-subtitle2 text-weight-bold">
            {{ t('freeText.title') }}
          </div>
          <div class="text-body2 text-on-surface-variant q-mt-xs">
            {{ t('freeText.hint') }}
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <locale-tabs v-model="freeTextLocale" />
          <rich-text-editor
            v-model="freeTextForLocale"
            :placeholder="t('freeText.placeholder')"
            class="q-mt-sm"
          />
          <div
            v-if="missingFreeTextLocales.length"
            class="text-caption text-warning q-mt-sm"
          >
            {{
              t('freeText.missingLocales', {
                locales: missingFreeTextLocales
                  .map((l) => l.toUpperCase())
                  .join(', '),
              })
            }}
          </div>
        </q-card-section>
      </q-card>

      <!-- Builder -->
      <q-stepper
        v-else
        v-model="step"
        vertical
        animated
        flat
        bordered
        header-nav
        color="primary"
        keep-alive
        class="privacy-stepper"
      >
        <!-- 1 -->
        <q-step
          :name="1"
          :title="t('step.controller.title')"
          :caption="t('step.controller.caption')"
          icon="badge"
          header-nav
          :done="step > 1"
        >
          <p class="text-body2">{{ t('step.controller.hint') }}</p>

          <!-- Mirrors the controller block of the rendered notice exactly,
               contact details included: they are what a data subject uses to
               exercise their rights, so this step is only a real check if it
               shows them. -->
          <q-card
            flat
            bordered
            class="inset-card"
          >
            <q-card-section class="q-pa-sm">
              <div
                v-for="row in controllerRows"
                :key="row.label"
                class="row items-start controller-row"
              >
                <div class="col-12 col-sm-4 text-body2 text-on-surface-variant">
                  {{ row.label }}
                </div>
                <div class="col-12 col-sm-8 text-body2">
                  <span v-if="row.value">{{ row.value }}</span>
                  <span
                    v-else
                    class="text-on-surface-variant"
                  >
                    {{ t('step.controller.notSet') }}
                  </span>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <m-btn
            :label="t('step.controller.edit')"
            flat
            color="primary"
            class="q-mt-sm"
            :to="{ name: 'management.organization.settings' }"
          />
          <q-stepper-navigation>
            <m-btn
              :label="t('action.next')"
              color="primary"
              @click="step = 2"
            />
          </q-stepper-navigation>
        </q-step>

        <!-- 2 -->
        <q-step
          :name="2"
          :title="t('step.data.title')"
          :caption="sectionCaption('data', t('step.data.caption'))"
          icon="inventory_2"
          header-nav
          :error="hasVisitedBeyond(2) && sectionGaps('data').length > 0"
          :done="step > 2 && sectionGaps('data').length === 0"
        >
          <p class="text-body2">{{ t('step.data.hint') }}</p>

          <div
            v-for="key in dataCategoryKeys"
            :key="key"
            class="q-mb-xs"
          >
            <q-checkbox
              :model-value="hasDataCategory(key)"
              :label="gt(`privacy.dataCategory.${key}`)"
              :disable="!canEdit"
              @update:model-value="(on) => toggleDataCategory(key, on)"
            />
            <special-category-basis-field
              v-if="hasDataCategory(key) && isSpecialCategory(key)"
              :model-value="dataCategory(key)?.specialCategoryBasis"
              :can-edit="canEdit"
              class="q-ml-lg q-mb-sm"
              @update:model-value="(value) => setSpecialBasis(key, value)"
            />

            <!-- Not special in itself, but it can become so depending on what
                 the form offers. -->
            <privacy-category-notes
              v-if="hasDataCategory(key)"
              :category-key="key"
              class="text-caption text-on-surface-variant q-ml-lg q-mb-sm"
            />
          </div>

          <!-- Anything the catalogue is deliberately too coarse for. Set apart
               from the checkbox list above, because these are the entries the
               organization is answerable for wording itself. -->
          <div class="q-mt-lg">
            <div class="text-body2 text-weight-medium">
              {{ t('custom.category.title') }}
            </div>
            <div class="text-caption text-on-surface-variant q-mb-sm">
              {{ t('custom.category.hint') }}
            </div>

            <q-card
              v-for="entry in customCategories"
              :key="entry.key"
              flat
              bordered
              class="inset-card q-mb-sm"
            >
              <q-card-section class="q-pa-sm">
                <div class="row items-center no-wrap q-gutter-sm">
                  <!-- Starts as one field with a translate toggle rather than
                       five stacked locales: most categories are named once and
                       a plain string is a valid Translatable. -->
                  <translated-input
                    :model-value="entry.label"
                    :label="t('field.customCategoryName')"
                    :locales
                    default-untranslated
                    dense
                    outlined
                    hide-bottom-space
                    :disable="!canEdit"
                    class="col"
                    @update:model-value="(v) => setEntryLabel(entry, v)"
                  />
                  <m-btn
                    flat
                    round
                    dense
                    icon="delete"
                    :aria-label="t('action.remove')"
                    :disable="!canEdit"
                    @click="removeCategory(entry.key)"
                  />
                </div>

                <q-checkbox
                  :model-value="entry.special === true"
                  :label="t('field.customCategorySpecial')"
                  dense
                  :disable="!canEdit"
                  class="q-mt-sm"
                  @update:model-value="(v) => setCustomSpecial(entry, v)"
                />
                <div
                  class="text-caption text-on-surface-variant inset-card__hint"
                >
                  {{ t('field.customCategorySpecialHint') }}
                </div>

                <!-- Same treatment as a catalogue category: consent stated,
                     alternatives behind the disclosure with their conditions. -->
                <special-category-basis-field
                  v-if="entry.special"
                  v-model="entry.specialCategoryBasis"
                  :can-edit="canEdit"
                  class="inset-card__basis q-mt-xs"
                />
              </q-card-section>
            </q-card>

            <m-btn
              :label="t('action.addCategory')"
              icon="add"
              outline
              color="primary"
              :disable="!canEdit"
              @click="addCustomCategory"
            />
          </div>

          <q-stepper-navigation>
            <m-btn
              :label="t('action.next')"
              color="primary"
              @click="step = 3"
            />
            <m-btn
              :label="t('action.back')"
              flat
              @click="step = 1"
            />
          </q-stepper-navigation>
        </q-step>

        <!-- 3 -->
        <q-step
          :name="3"
          :title="t('step.purposes.title')"
          :caption="sectionCaption('purposes', t('step.purposes.caption'))"
          icon="checklist"
          header-nav
          :error="hasVisitedBeyond(3) && sectionGaps('purposes').length > 0"
          :done="step > 3 && sectionGaps('purposes').length === 0"
        >
          <p class="text-body2">{{ t('step.purposes.hint') }}</p>
          <div
            v-for="key in purposeKeys"
            :key="key"
            class="q-mb-xs"
          >
            <q-checkbox
              :model-value="hasPurpose(key)"
              :label="gt(`privacy.purpose.${key}`)"
              :disable="!canEdit"
              @update:model-value="(on) => togglePurpose(key, on)"
            />
            <template v-if="hasPurpose(key)">
              <q-select
                :model-value="purpose(key)?.legalBasis"
                :options="legalBasisOptions"
                :label="t('field.legalBasis')"
                emit-value
                map-options
                dense
                outlined
                :disable="!canEdit"
                class="q-ml-lg q-mt-xs"
                @update:model-value="(v) => setLegalBasis(key, v)"
              />
              <translated-input
                v-if="purpose(key)?.legalBasis === 'legitimate_interests'"
                :model-value="purpose(key)?.legitimateInterest"
                :label="t('field.legitimateInterest')"
                :locales
                always
                dense
                outlined
                :disable="!canEdit"
                class="q-ml-lg q-mt-xs"
                @update:model-value="(v) => setLegitimateInterest(key, v)"
              />
              <div
                v-if="purpose(key)?.legalBasis === 'consent'"
                class="text-caption text-on-surface-variant q-ml-lg q-mt-xs"
              >
                {{ gt('privacy.editor.field.consentQuestion') }}
              </div>
            </template>
          </div>

          <div class="q-mt-lg">
            <div class="text-body2 text-weight-medium">
              {{ t('custom.purpose.title') }}
            </div>
            <div class="text-caption text-on-surface-variant q-mb-sm">
              {{ t('custom.purpose.hint') }}
            </div>

            <q-card
              v-for="entry in customPurposes"
              :key="entry.key"
              flat
              bordered
              class="inset-card q-mb-sm"
            >
              <q-card-section class="q-pa-sm column q-gutter-y-sm">
                <div class="row items-center no-wrap q-gutter-sm">
                  <translated-input
                    :model-value="entry.label"
                    :label="t('field.customPurposeName')"
                    :locales
                    default-untranslated
                    dense
                    outlined
                    hide-bottom-space
                    :disable="!canEdit"
                    class="col"
                    @update:model-value="(v) => setEntryLabel(entry, v)"
                  />
                  <m-btn
                    flat
                    round
                    dense
                    icon="delete"
                    :aria-label="t('action.remove')"
                    :disable="!canEdit"
                    @click="removePurpose(entry.key)"
                  />
                </div>
                <q-select
                  v-model="entry.legalBasis"
                  :options="legalBasisOptions"
                  :label="t('field.legalBasis')"
                  emit-value
                  map-options
                  dense
                  outlined
                  :disable="!canEdit"
                />
                <translated-input
                  v-if="entry.legalBasis === 'legitimate_interests'"
                  :model-value="entry.legitimateInterest"
                  :label="t('field.legitimateInterest')"
                  :locales
                  always
                  dense
                  outlined
                  :disable="!canEdit"
                  @update:model-value="
                    (v) => (entry.legitimateInterest = asTranslatable(v))
                  "
                />
                <div
                  v-if="entry.legalBasis === 'consent'"
                  class="text-caption text-on-surface-variant"
                >
                  {{ gt('privacy.editor.field.consentQuestion') }}
                </div>
              </q-card-section>
            </q-card>

            <m-btn
              :label="t('action.addPurpose')"
              icon="add"
              outline
              color="primary"
              :disable="!canEdit"
              @click="addCustomPurpose"
            />
          </div>

          <q-stepper-navigation>
            <m-btn
              :label="t('action.next')"
              color="primary"
              @click="step = 4"
            />
            <m-btn
              :label="t('action.back')"
              flat
              @click="step = 2"
            />
          </q-stepper-navigation>
        </q-step>

        <!-- 4 -->
        <q-step
          :name="4"
          :title="t('step.recipients.title')"
          :caption="sectionCaption('recipients', t('step.recipients.caption'))"
          icon="share"
          header-nav
          :error="hasVisitedBeyond(4) && sectionGaps('recipients').length > 0"
          :done="step > 4 && sectionGaps('recipients').length === 0"
        >
          <p class="text-body2">{{ t('step.recipients.hint') }}</p>

          <div
            v-for="key in recipientKeys"
            :key="key"
            class="q-mb-xs"
          >
            <q-checkbox
              :model-value="hasRecipient(key)"
              :label="gt(`privacy.recipient.${key}`)"
              :disable="!canEdit || isAlwaysRecipient(key)"
              @update:model-value="(on) => toggleRecipient(key, on)"
            />
            <div
              v-if="isAlwaysRecipient(key)"
              class="text-caption text-on-surface-variant recipient-note"
            >
              {{ t('field.recipientAlways') }}
            </div>
            <!-- No name to ask for: the camp team is the author's own, and the
                 platform is this one, whose name we already know. -->
            <q-input
              v-if="hasRecipient(key) && !isAlwaysRecipient(key)"
              :model-value="recipient(key)?.name ?? ''"
              :label="gt('privacy.editor.field.recipientName')"
              :hint="gt('privacy.editor.field.recipientNameHint')"
              dense
              outlined
              :disable="!canEdit"
              class="q-ml-lg q-mt-xs"
              @update:model-value="(v) => setRecipientName(key, String(v))"
            />
          </div>
          <q-stepper-navigation>
            <m-btn
              :label="t('action.next')"
              color="primary"
              @click="step = 5"
            />
            <m-btn
              :label="t('action.back')"
              flat
              @click="step = 3"
            />
          </q-stepper-navigation>
        </q-step>

        <!-- 5 -->
        <q-step
          :name="5"
          :title="t('step.retention.title')"
          :caption="sectionCaption('retention', t('step.retention.caption'))"
          icon="schedule"
          header-nav
          :error="hasVisitedBeyond(5) && sectionGaps('retention').length > 0"
          :done="step > 5 && sectionGaps('retention').length === 0"
        >
          <privacy-retention-step
            v-model="content"
            :can-edit
          />
          <q-stepper-navigation>
            <m-btn
              :label="t('action.next')"
              color="primary"
              @click="step = 6"
            />
            <m-btn
              :label="t('action.back')"
              flat
              @click="step = 4"
            />
          </q-stepper-navigation>
        </q-step>

        <!-- 6 -->
        <q-step
          :name="6"
          :title="t('step.additional.title')"
          :caption="t('step.additional.caption')"
          icon="notes"
          header-nav
        >
          <p class="text-body2">{{ t('step.additional.hint') }}</p>

          <locale-tabs v-model="additionalLocale" />
          <rich-text-editor
            v-model="additionalForLocale"
            :placeholder="t('field.additionalPlaceholder')"
            class="q-mt-sm"
          />

          <q-stepper-navigation>
            <m-btn
              :label="t('action.back')"
              flat
              @click="step = 5"
            />
          </q-stepper-navigation>
        </q-step>
      </q-stepper>

      <!-- Completeness + actions -->
      <privacy-publish-card
        :published-version="publishedVersion"
        :published-at="publishedAt"
        :has-unpublished-changes="hasUnpublishedChanges"
        :can-edit="canEdit"
        :publish-disabled="!completeness.complete"
        :unpublished-detail="t('status.unpublishedDetail')"
        :publishing
        @publish="publish"
        @preview="previewOpen = true"
      >
        <div class="text-subtitle1">
          {{ t('completeness.title') }}
        </div>
        <div
          v-if="completeness.complete"
          class="row items-center q-gutter-sm text-positive q-mt-sm"
        >
          <q-icon name="check_circle" />
          <span>{{ t('completeness.ok') }}</span>
        </div>
        <ul
          v-else
          class="q-mt-sm"
        >
          <li
            v-for="gap in completeness.gaps"
            :key="gap"
            class="text-warning"
          >
            {{ gt(`privacy.gap.${gap}`) }}
          </li>
        </ul>

        <template
          v-if="content.mode === 'builder'"
          #note
        >
          <q-banner
            dense
            class="privacy-page__disclaimer"
          >
            <template #avatar>
              <q-icon name="gavel" />
            </template>
            {{ t('disclaimer') }}
          </q-banner>
        </template>
      </privacy-publish-card>
    </div>

    <privacy-preview-dialog
      v-model="previewOpen"
      :notice="previewNotice"
    />
  </page-state-handler>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import {
  LEGAL_BASIS_KEYS,
  PRIVACY_DATA_CATEGORY_KEYS,
  PRIVACY_PURPOSE_KEYS,
  PRIVACY_PURPOSE_PRESETS,
  PRIVACY_RECIPIENT_KEYS,
  DEFAULT_SPECIAL_CATEGORY_BASIS,
  ALWAYS_RECIPIENT_KEYS,
  composePrivacyNotice,
  nextCustomKey,
  emptyPrivacyNoticeContent,
  gapsInSection,
  isCustomKey,
  isAlwaysRecipient,
  isSpecialCategory,
  privacyNoticeCompleteness,
  supervisoryAuthorityFor,
  type LegalBasisKey,
  type PrivacyDataCategoryEntry,
  type PrivacyDataCategoryKey,
  type PrivacyDataCategoryRef,
  type PrivacyNoticeContent,
  type PrivacyNoticeSection,
  type PrivacyPurposeEntry,
  type PrivacyPurposeKey,
  type PrivacyPurposeRef,
  type PrivacyRecipientKey,
  type PublishedPrivacyNotice,
  type SpecialCategoryBasisKey,
} from '@camp-registration/common/privacy';
import type { Translatable } from '@camp-registration/common/entities';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import RichTextEditor from '@/components/common/inputs/RichTextEditor.vue';
import TranslatedInput from '@/components/common/inputs/TranslatedInput.vue';
import LocaleTabs from '@/components/common/localization/LocaleTabs.vue';
import PrivacyCategoryNotes from '@/components/privacy/PrivacyCategoryNotes.vue';
import PrivacyPreviewDialog from '@/components/privacy/PrivacyPreviewDialog.vue';
import PrivacyPublishCard from '@/components/privacy/PrivacyPublishCard.vue';
import SpecialCategoryBasisField from '@/components/privacy/SpecialCategoryBasisField.vue';
import PrivacyRetentionStep from '@/components/organization/privacy/PrivacyRetentionStep.vue';
import { usePrivacyNoticeService } from '@/services/PrivacyNoticeService';
import { useOrganizationDetailsStore } from '@/stores/organization-details-store';
import { useOrganizationPermissions } from '@/composables/organizationPermissions';
import {
  useErrorExtractor,
  useServiceNotifications,
} from '@/composables/serviceHandler';
import { countryName } from '@/utils/countries';
import { APP_LOCALES as locales } from '@/i18n/locales';

const { t } = useI18n();
const { t: gt, locale: uiLocale } = useI18n({ useScope: 'global' });
const route = useRoute();
const organizationStore = useOrganizationDetailsStore();
const { data: organization } = storeToRefs(organizationStore);
const { canAccessOrg } = useOrganizationPermissions();
const { extractErrorText } = useErrorExtractor();
const { showErrorNotification } = useServiceNotifications();
const { fetchOrganizationNotice, publishOrganizationNotice } =
  usePrivacyNoticeService();

const step = ref(1);
// Steps only show an error once the author has had a chance to fill them in —
// a stepper that is red before it is opened is noise, not validation.
const furthestStep = ref(1);
const loading = ref(true);
const publishing = ref(false);
const error = ref<string | null>(null);
const publishedVersion = ref<number | null>(null);
const additionalLocale = ref('en');
const freeTextLocale = ref('en');
const previewOpen = ref(false);

// A ref rather than reactive(): the step components take it with v-model.
const content = ref<PrivacyNoticeContent>(emptyPrivacyNoticeContent());
// What registrants are currently reading. There is no draft, so this is the
// only thing an edit can be compared against.
const publishedSnapshot = ref(JSON.stringify(content.value));
const publishedAt = ref<string | null>(null);

const hasUnpublishedChanges = computed(
  () => JSON.stringify(content.value) !== publishedSnapshot.value,
);

const dataCategoryKeys = PRIVACY_DATA_CATEGORY_KEYS;
const purposeKeys = PRIVACY_PURPOSE_KEYS;
const recipientKeys = PRIVACY_RECIPIENT_KEYS;

const organizationId = computed<string>(
  () => route.params.organizationId as string,
);
const canEdit = computed<boolean>(() => canAccessOrg('organization.edit'));

const completeness = computed(() => privacyNoticeCompleteness(content.value));

onMounted(async () => {
  try {
    const notice = await fetchOrganizationNotice(organizationId.value);
    // Replace rather than merge: `content` is a ref now, and Object.assign on
    // the ref itself silently wrote past `.value` and dropped the fetch.
    content.value = { ...emptyPrivacyNoticeContent(), ...notice.content };
    publishedAt.value = notice.publishedAt;
    publishedVersion.value = notice.publishedVersion;
    // Baseline what was actually published, *before* normalising: a notice
    // published before these keys became implicit really is missing them, and
    // baselining afterwards would report it as up to date while the recipient
    // the editor shows is absent from what registrants read.
    publishedSnapshot.value = JSON.stringify(content.value);
    ALWAYS_RECIPIENT_KEYS.forEach(addRecipient);
  } catch (err) {
    error.value = extractErrorText(err);
  } finally {
    loading.value = false;
  }
});

watch(step, (value) => {
  furthestStep.value = Math.max(furthestStep.value, value);
});

function hasVisitedBeyond(target: number): boolean {
  return furthestStep.value > target;
}

function sectionGaps(section: PrivacyNoticeSection) {
  return gapsInSection(completeness.value.gaps, section);
}

/** Which step edits a section, so a caption can stay quiet until it is opened. */
const SECTION_STEPS: Record<PrivacyNoticeSection, number> = {
  data: 2,
  purposes: 3,
  recipients: 4,
  retention: 5,
  free_text: 0,
};

function sectionCaption(section: PrivacyNoticeSection, fallback: string) {
  const gaps = sectionGaps(section);

  return gaps.length > 0 && hasVisitedBeyond(SECTION_STEPS[section])
    ? gaps.map((gap) => gt(`privacy.gap.${gap}`)).join(' · ')
    : fallback;
}

const modeOptions = computed(() => [
  { value: 'builder', label: t('mode.builder') },
  { value: 'free_text', label: t('mode.freeText') },
]);

const countryLabel = computed(() =>
  organization.value
    ? countryName(organization.value.country, uiLocale.value)
    : '',
);

/**
 * The controller identity exactly as the notice renders it. Phone, website and
 * the registration number are nullable on `Organization`, so an empty one is
 * shown as "not set" rather than silently dropped — the point of this step is
 * noticing what is missing.
 */
const controllerRows = computed(() => {
  const org = organization.value;
  if (!org) {
    return [];
  }

  return [
    { label: t('step.controller.field.name'), value: org.name },
    { label: t('step.controller.field.address'), value: org.addressStreet },
    {
      label: t('step.controller.field.city'),
      value: `${org.addressZipCode} ${org.addressCity}`,
    },
    { label: t('step.controller.field.country'), value: countryLabel.value },
    {
      label: t('step.controller.field.registrationNumber'),
      value: org.registrationNumber ?? '',
    },
    { label: t('step.controller.field.email'), value: org.contactEmail },
    { label: t('step.controller.field.phone'), value: org.phone ?? '' },
  ];
});

/**
 * The draft as a registrant would read it. Composed against no camp addendum:
 * this is the organization's own notice, and a camp only ever adds to it.
 */
const previewNotice = computed<PublishedPrivacyNotice | null>(() => {
  const org = organization.value;
  if (!org) {
    return null;
  }

  return {
    controller: {
      name: org.name,
      contactEmail: org.contactEmail,
      phone: org.phone,
      website: org.website,
      addressStreet: org.addressStreet,
      addressZipCode: org.addressZipCode,
      addressCity: org.addressCity,
      country: org.country,
      registrationNumber: org.registrationNumber,
    },
    supervisoryAuthority: supervisoryAuthorityFor(org.country),
    notice: composePrivacyNotice({ ...content.value }),
    organizationVersion: publishedVersion.value,
    campVersion: null,
  };
});

const legalBasisOptions = computed(() =>
  LEGAL_BASIS_KEYS.map((key) => ({
    value: key,
    label: gt(`privacy.legalBasis.${key}`),
  })),
);
function asTranslatable(value: unknown): Translatable | null {
  return (value ?? null) as Translatable | null;
}

/* Data categories */

const customCategories = computed(() =>
  content.value.dataCategories.filter((entry) => isCustomKey(entry.key)),
);

function dataCategory(key: PrivacyDataCategoryRef) {
  return content.value.dataCategories.find((entry) => entry.key === key);
}
function hasDataCategory(key: PrivacyDataCategoryRef) {
  return dataCategory(key) !== undefined;
}
function addDataCategory(key: PrivacyDataCategoryKey) {
  if (hasDataCategory(key)) {
    return;
  }

  // Pre-select the Art. 9 basis nearly every camp actually relies on, rather
  // than opening with an empty required field.
  content.value.dataCategories.push(
    isSpecialCategory(key)
      ? { key, specialCategoryBasis: DEFAULT_SPECIAL_CATEGORY_BASIS }
      : { key },
  );
}
function toggleDataCategory(key: PrivacyDataCategoryKey, on: boolean) {
  if (on) {
    addDataCategory(key);
  } else {
    removeCategory(key);
  }
}
function removeCategory(key: PrivacyDataCategoryRef) {
  content.value.dataCategories = content.value.dataCategories.filter(
    (entry) => entry.key !== key,
  );
}
function setSpecialBasis(
  key: PrivacyDataCategoryRef,
  value: SpecialCategoryBasisKey | null | undefined,
) {
  const entry = dataCategory(key);
  if (entry) {
    entry.specialCategoryBasis = value ?? null;
  }
}
function addCustomCategory() {
  content.value.dataCategories.push({
    key: nextCustomKey(content.value.dataCategories),
    label: null,
    special: false,
  });
}
function setCustomSpecial(entry: PrivacyDataCategoryEntry, value: boolean) {
  entry.special = value;
  entry.specialCategoryBasis = value ? DEFAULT_SPECIAL_CATEGORY_BASIS : null;
}
function setEntryLabel(
  entry: PrivacyDataCategoryEntry | PrivacyPurposeEntry,
  value: unknown,
) {
  entry.label = asTranslatable(value);
}

/* Purposes */

const customPurposes = computed(() =>
  content.value.purposes.filter((entry) => isCustomKey(entry.key)),
);

function purpose(key: PrivacyPurposeRef) {
  return content.value.purposes.find((entry) => entry.key === key);
}
function hasPurpose(key: PrivacyPurposeRef) {
  return purpose(key) !== undefined;
}
/**
 * Ticking a purpose pulls in its preset categories and recipients — the point
 * of the catalogue is that the common camp is a handful of checkboxes. They
 * stay editable, and unticking never removes them again: they may have been
 * confirmed for a reason the preset does not know.
 */
function togglePurpose(key: PrivacyPurposeKey, on: boolean) {
  if (!on) {
    removePurpose(key);
    return;
  }

  const preset = PRIVACY_PURPOSE_PRESETS[key];
  content.value.purposes.push({ key, legalBasis: preset.legalBasis });
  preset.dataCategories.forEach(addDataCategory);
  preset.recipients.forEach(addRecipient);
}
function removePurpose(key: PrivacyPurposeRef) {
  content.value.purposes = content.value.purposes.filter(
    (entry) => entry.key !== key,
  );
}
function setLegalBasis(key: PrivacyPurposeRef, value: LegalBasisKey) {
  const entry = purpose(key);
  if (entry) {
    entry.legalBasis = value;
  }
}
function setLegitimateInterest(key: PrivacyPurposeRef, value: unknown) {
  const entry = purpose(key);
  if (entry) {
    entry.legitimateInterest = asTranslatable(value);
  }
}
function addCustomPurpose() {
  content.value.purposes.push({
    key: nextCustomKey(content.value.purposes),
    legalBasis: 'contract',
    label: null,
  });
}

/* Recipients */

function recipient(key: PrivacyRecipientKey) {
  return content.value.recipients.find((entry) => entry.key === key);
}
function hasRecipient(key: PrivacyRecipientKey) {
  return recipient(key) !== undefined;
}
function addRecipient(key: PrivacyRecipientKey) {
  if (!hasRecipient(key)) {
    content.value.recipients.push({ key });
  }
}
function toggleRecipient(key: PrivacyRecipientKey, on: boolean) {
  if (on) {
    addRecipient(key);
  } else {
    content.value.recipients = content.value.recipients.filter(
      (entry) => entry.key !== key,
    );
  }
}
function setRecipientName(key: PrivacyRecipientKey, value: string) {
  const entry = recipient(key);
  if (entry) {
    entry.name = value || null;
  }
}

/* Retention */

/* Free text and the builder's own free-text section */

// The rich-text editor edits one locale at a time; the stored value stays a
// per-locale record so a notice can be read in every language a camp runs in.
function localeText(value: Translatable | null, loc: string): string {
  if (value === null) {
    return '';
  }

  return typeof value === 'string' ? value : (value[loc] ?? '');
}

function withLocaleText(
  value: Translatable | null,
  loc: string,
  html: string,
): Translatable | null {
  const current =
    value === null || typeof value === 'string' ? {} : { ...value };

  if (html) {
    current[loc] = html;
  } else {
    delete current[loc];
  }

  return Object.keys(current).length > 0 ? current : null;
}

const additionalForLocale = computed({
  get: () => localeText(content.value.additional, additionalLocale.value),
  set: (html: string) => {
    content.value.additional = withLocaleText(
      content.value.additional,
      additionalLocale.value,
      html,
    );
  },
});

const freeTextForLocale = computed({
  get: () => localeText(content.value.freeText, freeTextLocale.value),
  set: (html: string) => {
    content.value.freeText = withLocaleText(
      content.value.freeText,
      freeTextLocale.value,
      html,
    );
  },
});

// Art. 12 wants the notice in a language the reader understands, and nothing
// translates free text for the organization — so name what is still missing.
const missingFreeTextLocales = computed(() =>
  locales.filter(
    (loc) => localeText(content.value.freeText, loc).trim() === '',
  ),
);

async function publish() {
  publishing.value = true;
  try {
    const notice = await publishOrganizationNotice(organizationId.value, {
      ...content.value,
    });
    publishedVersion.value = notice.publishedVersion;
    publishedAt.value = notice.publishedAt;
    // From what came back, not from what was sent: the server sanitizes the
    // free-text fields, so the two are not always the same document.
    content.value = { ...emptyPrivacyNoticeContent(), ...notice.content };
    publishedSnapshot.value = JSON.stringify(content.value);
  } catch (err) {
    // Notify rather than set `error`: that swaps the whole page for an error
    // state, and since the draft lives only in this browser, it would throw away
    // everything the author just wrote.
    showErrorNotification('publish', {
      message: t('notify.publishFailed'),
      caption: extractErrorText(err),
    });
  } finally {
    publishing.value = false;
  }
}
</script>

<style lang="scss" scoped>
// Indents that line a control's helper text and revealed fields up with its
// label rather than with its checkbox or switch.
$indent-checkbox: 2.25rem;

// Form controls are unreadable stretched across a wide page.
$field-max: 32rem;
$field-max-narrow: 28rem;

// The grid columns are proportional, so on a very wide monitor 8/12 is still
// far past a readable measure — and the fields inside cap at 32rem anyway.
.privacy-shell {
  max-width: 70rem;
}

.privacy-page__disclaimer {
  background-color: var(--md3-surface-container-high);
  color: var(--md3-on-surface-variant);
  border-radius: 12px;
}

// A card set into the page rather than sitting on it: used wherever a block is
// part of the surrounding step instead of a section of its own.
.inset-card {
  background-color: var(--md3-surface-container-low);
  border-radius: 12px;

  &__hint,
  &__basis {
    margin-left: $indent-checkbox;
  }

  &__basis {
    max-width: $field-max-narrow;
  }
}

// Even rows: a Quasar gutter would fight the section's own padding, and it is
// meant for wrapped flex children rather than stacked label/value pairs.
.controller-row {
  padding: 0.2rem 0;
}

.recipient-note {
  margin-left: $indent-checkbox;
  margin-bottom: 0.35rem;
}

// Capping here beats remembering a class on every field in six steps.
.privacy-stepper {
  :deep(.q-field) {
    max-width: $field-max;
  }
}
</style>

<i18n lang="yaml" locale="en">
disclaimer: 'These templates help you describe your processing, but they are not legal advice. Your organisation remains the controller and is responsible for the notice being correct.'
title: 'Privacy information'
subtitle: 'What happens to the data collected when someone registers.'
baselineNote: 'This is the baseline for every camp your organisation runs. Individual camps can add to it and adjust it where they differ, but not replace it.'
mode:
  title: 'How do you want to write this?'
  builder: 'Guided — pick from prepared wording (translated into all languages for you)'
  freeText: 'Free text — write the whole notice yourself'
  freeTextWarning: 'You write the whole notice yourself, in every language your camps run in. Nothing is translated or filled in for you, and your text is published exactly as you write it.'
freeText:
  title: 'Your privacy notice'
  hint: 'This replaces the guided sections entirely. The rights, complaint and supervisory authority sections are still added for you.'
  placeholder: 'Write your privacy notice…'
  missingLocales: 'Not written yet in: {locales}'
step:
  controller:
    title: 'Who you are'
    caption: 'Taken from your organisation'
    hint: 'This is taken from your organisation profile and shown to every registrant.'
    edit: 'Edit organisation'
    notSet: 'Not set'
    field:
      name: 'Name'
      address: 'Street and number'
      city: 'Postal code and city'
      country: 'Country'
      registrationNumber: 'Registration number'
      email: 'Contact email'
      phone: 'Phone'
  data:
    title: 'What you collect'
    caption: 'Categories of personal data'
    hint: 'Some are already ticked because of the purposes you chose — adjust anything that does not fit.'
  purposes:
    title: 'Why you collect it'
    caption: 'Purposes and legal basis'
    hint: 'Ticking a purpose also proposes the data and recipients it usually involves. Adjust anything that does not fit.'
  recipients:
    title: 'Who else receives it'
    caption: 'Recipients'
    hint: 'Some are already ticked because of the purposes you chose — adjust anything that does not fit.'
  retention:
    title: 'How long you keep it'
    caption: 'Retention, transfers, DPO'
  additional:
    title: 'Anything else'
    caption: 'Optional free text'
    hint: 'Only for processing the options above cannot describe. Text you write here is not translated for you.'
custom:
  category:
    title: 'Something else?'
    hint: 'Add a category the list above does not cover. Keep it at the level of a category, not a single form field.'
  purpose:
    title: 'Something else?'
    hint: 'Add a purpose the list above does not cover.'
field:
  customCategoryName: 'Name of the category'
  customCategorySpecial: 'Sensitive (Art. 9 GDPR)'
  customCategorySpecialHint: 'Health, disability, religion, ethnicity, politics, trade-union membership, sex life or biometric data.'
  customPurposeName: 'Name of the purpose'
  legalBasis: 'Legal basis'
  legitimateInterest: 'Describe your legitimate interest'
  recipientAlways: 'Always a recipient.'
  additionalPlaceholder: 'Additional privacy information…'
status:
  unpublishedDetail: 'Nothing is shown to registrants yet, and your organisation cannot be verified until you publish.'
completeness:
  title: 'Completeness'
  ok: 'All required information is present.'
action:
  next: 'Continue'
  back: 'Back'
  addCategory: 'Add another category'
  addPurpose: 'Add another purpose'
  remove: 'Remove'
notify:
  publishFailed: 'Publishing failed'
</i18n>

<i18n lang="yaml" locale="de">
disclaimer: 'Diese Textbausteine helfen dir, die Verarbeitung zu beschreiben, sind aber keine Rechtsberatung. Die Organisation bleibt verantwortliche Stelle und haftet für die Richtigkeit der Angaben.'
title: 'Datenschutzinformationen'
subtitle: 'Was mit den Daten geschieht, die bei einer Anmeldung erhoben werden.'
baselineNote: 'Diese Angaben gelten für alle Freizeiten der Organisation. Einzelne Freizeiten können sie ergänzen und dort anpassen, wo sie abweichen – ersetzen können sie sie nicht.'
mode:
  title: 'Wie sollen die Informationen entstehen?'
  builder: 'Geführt – vorformulierte Textbausteine auswählen, automatisch in alle Sprachen übersetzt'
  freeText: 'Freitext – alles selbst formulieren'
  freeTextWarning: 'Du verfasst die gesamten Informationen selbst – in jeder Sprache, in der die Freizeiten stattfinden. Nichts wird übersetzt oder ergänzt, und der Text wird genau so veröffentlicht, wie du ihn schreibst.'
freeText:
  title: 'Datenschutzinformationen'
  hint: 'Ersetzt die geführten Abschnitte vollständig. Betroffenenrechte, Beschwerderecht und Aufsichtsbehörde werden weiterhin automatisch ergänzt.'
  placeholder: 'Datenschutzinformationen verfassen…'
  missingLocales: 'Noch nicht verfasst in: {locales}'
step:
  controller:
    title: 'Verantwortliche Stelle'
    caption: 'Aus der Organisation übernommen'
    hint: 'Diese Angaben stammen aus dem Profil der Organisation und werden jeder anmeldenden Person angezeigt.'
    edit: 'Organisation bearbeiten'
    notSet: 'Nicht hinterlegt'
    field:
      name: 'Name'
      address: 'Straße und Hausnummer'
      city: 'PLZ und Ort'
      country: 'Land'
      registrationNumber: 'Registernummer'
      email: 'Kontakt-E-Mail'
      phone: 'Telefon'
  data:
    title: 'Welche Daten erhoben werden'
    caption: 'Kategorien personenbezogener Daten'
    hint: 'Einiges ist bereits angehakt, weil es zu den gewählten Zwecken gehört – passe an, was nicht zutrifft.'
  purposes:
    title: 'Wozu die Daten erhoben werden'
    caption: 'Zwecke und Rechtsgrundlage'
    hint: 'Mit einem Zweck werden auch die üblicherweise zugehörigen Daten und Empfänger vorgeschlagen. Korrigiere, was nicht zutrifft.'
  recipients:
    title: 'Wer die Daten außerdem erhält'
    caption: 'Empfänger'
    hint: 'Einiges ist bereits angehakt, weil es zu den gewählten Zwecken gehört – passe an, was nicht zutrifft.'
  retention:
    title: 'Wie lange die Daten gespeichert werden'
    caption: 'Speicherdauer, Übermittlung, Datenschutzbeauftragte'
  additional:
    title: 'Sonstiges'
    caption: 'Optionaler Freitext'
    hint: 'Nur für Verarbeitungen, die sich mit den Optionen oben nicht beschreiben lassen. Hier eingegebener Text wird nicht automatisch übersetzt.'
custom:
  category:
    title: 'Etwas anderes?'
    hint: 'Ergänze eine Kategorie, die in der Liste oben fehlt. Beschreibe dabei eine Kategorie, nicht ein einzelnes Formularfeld.'
  purpose:
    title: 'Etwas anderes?'
    hint: 'Ergänze einen Zweck, der in der Liste oben fehlt.'
field:
  customCategoryName: 'Bezeichnung der Kategorie'
  customCategorySpecial: 'Besondere Kategorie (Art. 9 DSGVO)'
  customCategorySpecialHint: 'Gesundheit, Behinderung, Religion, ethnische Herkunft, politische Meinung, Gewerkschaftszugehörigkeit, Sexualleben oder biometrische Daten.'
  customPurposeName: 'Bezeichnung des Zwecks'
  legalBasis: 'Rechtsgrundlage'
  legitimateInterest: 'Das berechtigte Interesse beschreiben'
  recipientAlways: 'Immer Empfänger.'
  additionalPlaceholder: 'Weitere Datenschutzinformationen…'
status:
  unpublishedDetail: 'Anmeldende sehen noch nichts, und die Organisation kann bis zur Veröffentlichung nicht verifiziert werden.'
completeness:
  title: 'Vollständigkeit'
  ok: 'Alle erforderlichen Angaben liegen vor.'
action:
  next: 'Weiter'
  back: 'Zurück'
  addCategory: 'Weitere Kategorie hinzufügen'
  addPurpose: 'Weiteren Zweck hinzufügen'
  remove: 'Entfernen'
notify:
  publishFailed: 'Veröffentlichen fehlgeschlagen'
</i18n>

<i18n lang="yaml" locale="fr">
disclaimer: "Ces modèles vous aident à décrire vos traitements, mais ne constituent pas un conseil juridique. Votre organisation reste responsable de traitement et de l'exactitude de ces informations."
title: 'Informations sur la protection des données'
subtitle: "Ce qu'il advient des données recueillies lors d'une inscription."
baselineNote: "Ces informations valent pour tous les séjours de l'organisation. Chaque séjour peut les compléter et les ajuster là où il diffère, mais pas les remplacer."
mode:
  title: 'Comment souhaitez-vous rédiger ces informations ?'
  builder: 'Guidé – choisir des formulations préétablies, traduites automatiquement dans toutes les langues'
  freeText: 'Texte libre – tout rédiger vous-même'
  freeTextWarning: "Vous rédigez l'intégralité des informations vous-même, dans chaque langue de vos séjours. Rien n'est traduit ni complété pour vous, et votre texte est publié tel que vous l'écrivez."
freeText:
  title: 'Vos informations sur la protection des données'
  hint: 'Cela remplace entièrement les sections guidées. Les droits, le droit de réclamation et l’autorité de contrôle restent ajoutés automatiquement.'
  placeholder: 'Rédigez vos informations…'
  missingLocales: 'Pas encore rédigé en : {locales}'
step:
  controller:
    title: 'Qui vous êtes'
    caption: 'Repris de votre organisation'
    hint: "Ces informations proviennent du profil de votre organisation et sont affichées à chaque personne qui s'inscrit."
    edit: "Modifier l'organisation"
    notSet: 'Non renseigné'
    field:
      name: 'Nom'
      address: 'Rue et numéro'
      city: 'Code postal et ville'
      country: 'Pays'
      registrationNumber: "Numéro d'enregistrement"
      email: 'E-mail de contact'
      phone: 'Téléphone'
  data:
    title: 'Ce que vous collectez'
    caption: 'Catégories de données personnelles'
    hint: 'Certaines cases sont déjà cochées en raison des finalités retenues — ajustez ce qui ne convient pas.'
  purposes:
    title: 'Pourquoi vous les collectez'
    caption: 'Finalités et base légale'
    hint: 'Cocher une finalité propose aussi les données et destinataires qui y sont habituellement associés. Ajustez ce qui ne convient pas.'
  recipients:
    title: 'Qui les reçoit également'
    caption: 'Destinataires'
    hint: 'Certaines cases sont déjà cochées en raison des finalités retenues — ajustez ce qui ne convient pas.'
  retention:
    title: 'Combien de temps vous les conservez'
    caption: 'Conservation, transferts, DPO'
  additional:
    title: 'Autres informations'
    caption: 'Texte libre facultatif'
    hint: "Uniquement pour les traitements que les options ci-dessus ne peuvent décrire. Le texte saisi ici n'est pas traduit automatiquement."
custom:
  category:
    title: 'Autre chose ?'
    hint: "Ajoutez une catégorie que la liste ci-dessus ne couvre pas. Restez au niveau d'une catégorie, pas d'un champ de formulaire."
  purpose:
    title: 'Autre chose ?'
    hint: 'Ajoutez une finalité que la liste ci-dessus ne couvre pas.'
field:
  customCategoryName: 'Nom de la catégorie'
  customCategorySpecial: 'Donnée sensible (art. 9 RGPD)'
  customCategorySpecialHint: 'Santé, handicap, religion, origine ethnique, opinions politiques, appartenance syndicale, vie sexuelle ou données biométriques.'
  customPurposeName: 'Nom de la finalité'
  legalBasis: 'Base légale'
  legitimateInterest: 'Décrivez votre intérêt légitime'
  recipientAlways: 'Toujours destinataire.'
  additionalPlaceholder: 'Informations complémentaires…'
status:
  unpublishedDetail: "Rien n'est encore montré et votre organisation ne peut pas être vérifiée tant que vous n'avez pas publié."
completeness:
  title: 'Exhaustivité'
  ok: 'Toutes les informations requises sont présentes.'
action:
  next: 'Continuer'
  back: 'Retour'
  addCategory: 'Ajouter une catégorie'
  addPurpose: 'Ajouter une finalité'
  remove: 'Supprimer'
notify:
  publishFailed: 'Échec de la publication'
</i18n>

<i18n lang="yaml" locale="cs">
disclaimer: 'Tyto šablony ti pomohou popsat zpracování, nejsou však právní radou. Vaše organizace zůstává správcem a odpovídá za správnost informací.'
title: 'Informace o ochraně osobních údajů'
subtitle: 'Co se děje s údaji, které se získávají při přihlášení.'
baselineNote: 'Tyto údaje platí pro všechny tábory organizace. Jednotlivé tábory je mohou doplnit a upravit tam, kde se liší, ale nemohou je nahradit.'
mode:
  title: 'Jak to chcete sepsat?'
  builder: 'S průvodcem – vybrat z připravených formulací, automaticky přeložených do všech jazyků'
  freeText: 'Volný text – sepsat vše sami'
  freeTextWarning: 'Veškeré informace sepisuješ ty – v každém jazyce, ve kterém pořádáte tábory. Nic se nepřekládá ani nedoplňuje a text se zveřejní přesně tak, jak ho napíšeš.'
freeText:
  title: 'Vaše informace o ochraně osobních údajů'
  hint: 'Zcela nahrazuje sekce průvodce. Práva, právo podat stížnost a dozorový úřad se i nadále doplňují automaticky.'
  placeholder: 'Sepiš informace o ochraně osobních údajů…'
  missingLocales: 'Zatím nesepsáno v: {locales}'
step:
  controller:
    title: 'Kdo jste'
    caption: 'Převzato z vaší organizace'
    hint: 'Tyto údaje pocházejí z profilu vaší organizace a zobrazí se každému, kdo se přihlašuje.'
    edit: 'Upravit organizaci'
    notSet: 'Nevyplněno'
    field:
      name: 'Název'
      address: 'Ulice a číslo'
      city: 'PSČ a město'
      country: 'Země'
      registrationNumber: 'Registrační číslo'
      email: 'Kontaktní e-mail'
      phone: 'Telefon'
  data:
    title: 'Jaké údaje sbíráte'
    caption: 'Kategorie osobních údajů'
    hint: 'Něco je už zaškrtnuté, protože to patří ke zvoleným účelům – uprav, co nesedí.'
  purposes:
    title: 'Proč je sbíráte'
    caption: 'Účely a právní základ'
    hint: 'Zaškrtnutím účelu se navrhnou i údaje a příjemci, kteří k němu obvykle patří. Uprav, co nesedí.'
  recipients:
    title: 'Kdo je dále dostává'
    caption: 'Příjemci'
    hint: 'Něco je už zaškrtnuté, protože to patří ke zvoleným účelům – uprav, co nesedí.'
  retention:
    title: 'Jak dlouho je uchováváte'
    caption: 'Uchování, předávání, pověřenec'
  additional:
    title: 'Cokoli dalšího'
    caption: 'Volitelný volný text'
    hint: 'Jen pro zpracování, které volbami výše popsat nelze. Zde zadaný text se automaticky nepřekládá.'
custom:
  category:
    title: 'Něco dalšího?'
    hint: 'Přidej kategorii, kterou seznam výše nepokrývá. Zůstaň na úrovni kategorie, ne jednotlivého pole formuláře.'
  purpose:
    title: 'Něco dalšího?'
    hint: 'Přidej účel, který seznam výše nepokrývá.'
field:
  customCategoryName: 'Název kategorie'
  customCategorySpecial: 'Citlivý údaj (čl. 9 GDPR)'
  customCategorySpecialHint: 'Zdraví, postižení, náboženství, etnický původ, politické názory, členství v odborech, sexuální život nebo biometrické údaje.'
  customPurposeName: 'Název účelu'
  legalBasis: 'Právní základ'
  legitimateInterest: 'Popiš váš oprávněný zájem'
  recipientAlways: 'Vždy příjemce.'
  additionalPlaceholder: 'Další informace o ochraně osobních údajů…'
status:
  unpublishedDetail: 'Přihlašující zatím nic nevidí a organizaci nelze do zveřejnění ověřit.'
completeness:
  title: 'Úplnost'
  ok: 'Všechny povinné údaje jsou vyplněny.'
action:
  next: 'Pokračovat'
  back: 'Zpět'
  addCategory: 'Přidat další kategorii'
  addPurpose: 'Přidat další účel'
  remove: 'Odebrat'
notify:
  publishFailed: 'Publikování se nezdařilo'
</i18n>

<i18n lang="yaml" locale="pl">
disclaimer: 'Te szablony pomagają opisać przetwarzanie, ale nie stanowią porady prawnej. Twoja organizacja pozostaje administratorem i odpowiada za poprawność informacji.'
title: 'Informacje o ochronie danych'
subtitle: 'Co dzieje się z danymi zbieranymi podczas zgłoszenia.'
baselineNote: 'Te informacje dotyczą wszystkich obozów organizacji. Poszczególne obozy mogą je uzupełnić i dostosować tam, gdzie się różnią, ale nie mogą ich zastąpić.'
mode:
  title: 'Jak chcecie to napisać?'
  builder: 'Kreator – wybór z przygotowanych sformułowań, tłumaczonych automatycznie na wszystkie języki'
  freeText: 'Tekst własny – napisanie całości samodzielnie'
  freeTextWarning: 'Całość informacji piszesz samodzielnie – w każdym języku Waszych obozów. Nic nie jest tłumaczone ani uzupełniane, a tekst zostaje opublikowany dokładnie tak, jak go napiszesz.'
freeText:
  title: 'Wasze informacje o ochronie danych'
  hint: 'Zastępuje to w całości sekcje kreatora. Prawa, prawo do skargi i organ nadzorczy są nadal dodawane automatycznie.'
  placeholder: 'Napisz informacje o ochronie danych…'
  missingLocales: 'Jeszcze nie napisano w: {locales}'
step:
  controller:
    title: 'Kim jesteście'
    caption: 'Pobrane z Waszej organizacji'
    hint: 'Te dane pochodzą z profilu Waszej organizacji i są pokazywane każdej osobie zgłaszającej się.'
    edit: 'Edytuj organizację'
    notSet: 'Nie podano'
    field:
      name: 'Nazwa'
      address: 'Ulica i numer'
      city: 'Kod pocztowy i miasto'
      country: 'Kraj'
      registrationNumber: 'Numer rejestrowy'
      email: 'E-mail kontaktowy'
      phone: 'Telefon'
  data:
    title: 'Jakie dane zbieracie'
    caption: 'Kategorie danych osobowych'
    hint: 'Część jest już zaznaczona, bo wynika z wybranych celów – dostosuj to, co nie pasuje.'
  purposes:
    title: 'W jakim celu je zbieracie'
    caption: 'Cele i podstawa prawna'
    hint: 'Zaznaczenie celu proponuje także dane i odbiorców zwykle z nim związanych. Dostosuj to, co nie pasuje.'
  recipients:
    title: 'Kto jeszcze je otrzymuje'
    caption: 'Odbiorcy'
    hint: 'Część jest już zaznaczona, bo wynika z wybranych celów – dostosuj to, co nie pasuje.'
  retention:
    title: 'Jak długo je przechowujecie'
    caption: 'Przechowywanie, przekazywanie, IOD'
  additional:
    title: 'Coś jeszcze'
    caption: 'Opcjonalny tekst'
    hint: 'Tylko dla przetwarzania, którego nie da się opisać powyższymi opcjami. Wpisany tu tekst nie jest tłumaczony automatycznie.'
custom:
  category:
    title: 'Coś jeszcze?'
    hint: 'Dodaj kategorię, której nie obejmuje powyższa lista. Pozostań na poziomie kategorii, nie pojedynczego pola formularza.'
  purpose:
    title: 'Coś jeszcze?'
    hint: 'Dodaj cel, którego nie obejmuje powyższa lista.'
field:
  customCategoryName: 'Nazwa kategorii'
  customCategorySpecial: 'Dane wrażliwe (art. 9 RODO)'
  customCategorySpecialHint: 'Zdrowie, niepełnosprawność, religia, pochodzenie etniczne, poglądy polityczne, przynależność związkowa, życie seksualne lub dane biometryczne.'
  customPurposeName: 'Nazwa celu'
  legalBasis: 'Podstawa prawna'
  legitimateInterest: 'Opisz Wasz prawnie uzasadniony interes'
  recipientAlways: 'Zawsze odbiorca.'
  additionalPlaceholder: 'Dodatkowe informacje o ochronie danych…'
status:
  unpublishedDetail: 'Zgłaszający jeszcze nic nie widzą, a organizacji nie można zweryfikować do czasu publikacji.'
completeness:
  title: 'Kompletność'
  ok: 'Wszystkie wymagane informacje są uzupełnione.'
action:
  next: 'Dalej'
  back: 'Wstecz'
  addCategory: 'Dodaj kolejną kategorię'
  addPurpose: 'Dodaj kolejny cel'
  remove: 'Usuń'
notify:
  publishFailed: 'Publikacja nie powiodła się'
</i18n>
