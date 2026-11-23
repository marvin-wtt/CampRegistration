<template>
  <page-state-handler
    padding
    :loading
    :error
    class="row justify-center"
  >
    <div
      class="privacy-shell column no-wrap col-12 col-sm-10 col-md-8 q-gutter-md"
    >
      <page-header
        :title="t('title')"
        :subtitle="t('subtitle')"
      />

      <!-- Without it the page reads as a broken editor: every control greyed
           out and nothing saying why. -->
      <q-banner
        v-if="!canEdit"
        dense
        rounded
        class="bg-surface-container-high text-on-surface"
      >
        <template #avatar>
          <q-icon name="visibility" />
        </template>
        {{ t('readOnly') }}
      </q-banner>

      <!-- What the organization already says: one line and a link to the full
           text. Its entries appear in the sections below, marked as inherited,
           so they are not listed twice. -->
      <privacy-section
        icon="corporate_fare"
        :title="t('baseline.title')"
        :summary="t('baseline.hint')"
      >
        <template
          v-if="organizationPublishedVersion !== null"
          #aside
        >
          <q-chip
            dense
            square
            icon="check_circle"
            class="baseline-version"
          >
            {{
              t('baseline.version', {
                version: organizationPublishedVersion,
                date: organizationPublishedAt
                  ? d(organizationPublishedAt, 'short')
                  : '',
              })
            }}
          </q-chip>
        </template>

        <!-- Nothing published is the one state an event cannot work around,
             so it is stated before anything else on the page. -->
        <template
          v-if="!organizationContent || organizationFreeText"
          #default
        >
          <q-banner
            v-if="!organizationContent"
            dense
            rounded
            class="baseline-banner"
          >
            <template #avatar>
              <q-icon
                name="warning"
                class="text-warning"
              />
            </template>
            <div class="text-body2">{{ t('baseline.missing.title') }}</div>
            <div class="text-caption text-on-surface-variant">
              {{ t('baseline.missing.detail') }}
            </div>
          </q-banner>
          <div
            v-else
            class="text-body2 text-on-surface-variant"
          >
            {{ t('baseline.freeText') }}
          </div>
        </template>

        <template #actions>
          <m-btn
            v-if="organizationContent"
            :label="t('baseline.open')"
            icon="description"
            flat
            no-caps
            color="primary"
            @click="baselineOpen = true"
          />
          <m-btn
            v-if="canEditOrganization"
            :label="t('baseline.edit')"
            icon="open_in_new"
            flat
            no-caps
            color="primary"
            :to="{
              name: 'management.organization.privacy',
              params: { organizationId },
            }"
          />
        </template>
      </privacy-section>

      <!-- A free-text organization notice has no structure for entries to
           join, so only the event's own text reaches registrants. -->
      <q-banner
        v-if="organizationFreeText && hasStructuredEntries(content)"
        dense
        rounded
        class="baseline-banner"
      >
        <template #avatar>
          <q-icon
            name="warning"
            class="text-warning"
          />
        </template>
        <div class="text-body2">
          {{ t('addendum.freeTextEntries.title') }}
        </div>
        <div class="text-caption text-on-surface-variant">
          {{ t('addendum.freeTextEntries.detail') }}
        </div>
      </q-banner>

      <template v-if="!organizationFreeText">
        <!-- Purposes. Excluding one also drops the retention exception scoped
             to it. -->
        <privacy-section
          icon="checklist"
          :title="t('addendum.purposes')"
          :summary="
            sectionSummary(inheritedPurposes.length, ownPurposeKeys.length)
          "
          :more-count="canEdit ? morePurposeKeys.length : 0"
        >
          <privacy-entry-list
            v-if="inheritedPurposes.length || ownPurposeKeys.length"
          >
            <privacy-entry-row
              v-for="entry in inheritedPurposes"
              :key="entry.key"
              inherited
              :label="purposeLabel(entry)"
              :caption="lockedReason('purposes', entry.key, entry.allEvents)"
              :excluded="isExcluded('purposes', entry.key)"
            >
              <template #actions>
                <inherited-entry-toggle
                  :model-value="entryState('purposes', entry.key, false)"
                  :exclude-disabled="excludeBlocked('purposes', entry.key)"
                  :disable="!canEdit"
                  @update:model-value="
                    (state) =>
                      setExcluded('purposes', entry.key, state === 'exclude')
                  "
                />
              </template>
            </privacy-entry-row>
            <privacy-entry-row
              v-for="key in ownPurposeKeys"
              :key="key"
              :label="gt(`privacy.purpose.${key}`)"
              selected
              :disable="!canEdit"
              @update:selected="(on) => toggleEventPurpose(key, on)"
            >
              <q-select
                :model-value="eventPurpose(key)?.legalBasis"
                :options="legalBasisOptions"
                :label="t('field.legalBasis')"
                emit-value
                map-options
                dense
                outlined
                rounded
                :disable="!canEdit"
                @update:model-value="(v) => setEventLegalBasis(key, v)"
              />
              <div
                v-if="legalBasisCaution(eventPurpose(key)?.legalBasis)"
                class="text-caption text-warning q-mt-xs"
                data-test="privacy-basis-caution"
              >
                {{ legalBasisCaution(eventPurpose(key)?.legalBasis) }}
              </div>
              <div
                v-if="eventPurpose(key)?.legalBasis === 'consent'"
                class="text-caption text-on-surface-variant q-mt-xs"
              >
                {{
                  gt('privacy.editor.field.consentQuestion', {
                    citation: cite('freelyGiven'),
                  })
                }}
              </div>
            </privacy-entry-row>
          </privacy-entry-list>

          <template #more>
            <privacy-entry-list>
              <privacy-entry-row
                v-for="key in morePurposeKeys"
                :key="key"
                :label="gt(`privacy.purpose.${key}`)"
                :selected="false"
                :disable="!canEdit"
                @update:selected="(on) => toggleEventPurpose(key, on)"
              />
            </privacy-entry-list>
          </template>
        </privacy-section>

        <!-- Data categories. The form's own tags decide what must be here. -->
        <privacy-section
          icon="inventory_2"
          :title="t('addendum.dataCategories')"
          :summary="
            sectionSummary(
              inheritedCategoryCount,
              ownCategoryKeys.length - inheritedCategoryKeys.length,
            )
          "
          :more-count="canEdit ? moreCategoryKeys.length : 0"
        >
          <!-- The registration gate refuses this. -->
          <q-banner
            v-if="excludedFormCategories.length"
            dense
            rounded
            class="baseline-banner q-mb-md"
          >
            <template #avatar>
              <q-icon
                name="warning"
                class="text-warning"
              />
            </template>
            <div class="text-body2">
              {{
                t('addendum.excludedInForm', {
                  categories: categoryNames(excludedFormCategories),
                })
              }}
            </div>
          </q-banner>

          <!-- A suggestion the manager confirms, never an automatic claim
               about what the form collects — unless it blocks registrations. -->
          <q-banner
            v-if="suggestedCategories.length"
            dense
            rounded
            class="suggestion-banner q-mb-md"
          >
            <template #avatar>
              <q-icon
                :name="suggestionBlocks ? 'warning' : 'lightbulb'"
                :class="{ 'text-warning': suggestionBlocks }"
              />
            </template>
            <div class="text-body2">
              {{
                t(
                  suggestionBlocks
                    ? 'addendum.suggestedBlocking'
                    : 'addendum.suggested',
                  { categories: categoryNames(suggestedCategories) },
                )
              }}
            </div>
            <template #action>
              <m-btn
                :label="t('addendum.applySuggested')"
                flat
                no-caps
                color="primary"
                :disable="!canEdit"
                @click="applySuggested"
              />
            </template>
          </q-banner>

          <privacy-entry-list
            v-if="ownCategoryKeys.length || inheritedCustomCategories.length"
          >
            <template
              v-for="key in ownCategoryKeys"
              :key="key"
            >
              <privacy-entry-row
                v-if="inheritsCategory(key)"
                inherited
                :label="gt(`privacy.dataCategory.${key}`)"
                :caption="
                  lockedReason(
                    'dataCategories',
                    key,
                    inheritedCategory(key)?.allEvents,
                  )
                "
                :special="isSpecialCategory(key)"
                :excluded="categoryState(key) === 'exclude'"
              >
                <template #actions>
                  <inherited-entry-toggle
                    :model-value="categoryState(key)"
                    :can-override="isSpecialCategory(key)"
                    :exclude-disabled="excludeBlocked('dataCategories', key)"
                    :disable="!canEdit"
                    @update:model-value="
                      (state) => setCategoryState(key, state)
                    "
                  />
                </template>
                <template
                  v-if="
                    categoryState(key) !== 'exclude' &&
                    (isSpecialCategory(key) || hasCategoryNotes(key))
                  "
                  #default
                >
                  <!-- The organization's answer until the event restates the
                       entry with its own. -->
                  <div
                    v-if="
                      inheritedCategoryBasis(key) &&
                      categoryState(key) === 'inherit'
                    "
                    class="text-caption text-on-surface-variant"
                  >
                    {{ gt('privacy.editor.field.art9Basis') }}:
                    {{ specialBasisLabel(inheritedCategoryBasis(key)) }}
                  </div>
                  <special-category-basis-field
                    v-else-if="hasDataCategory(key) && isSpecialCategory(key)"
                    :model-value="dataCategory(key)?.specialCategoryBasis"
                    :legal-reference="dataCategory(key)?.legalReference"
                    :can-edit="canEdit"
                    :locales="additionalLocales"
                    @update:model-value="(value) => setSpecialBasis(key, value)"
                    @update:legal-reference="
                      (value) => setLegalReference(key, value)
                    "
                  />
                  <!-- Both notes ask about this event's own form, so they show
                       for inherited entries too. -->
                  <privacy-category-notes
                    :category-key="key"
                    class="text-caption text-on-surface-variant q-mt-xs"
                  />
                </template>
              </privacy-entry-row>

              <privacy-entry-row
                v-else
                :label="gt(`privacy.dataCategory.${key}`)"
                selected
                :special="isSpecialCategory(key)"
                :disable="!canEdit"
                @update:selected="(on) => toggleDataCategory(key, on)"
              >
                <template
                  v-if="isSpecialCategory(key) || hasCategoryNotes(key)"
                  #default
                >
                  <special-category-basis-field
                    v-if="isSpecialCategory(key)"
                    :model-value="dataCategory(key)?.specialCategoryBasis"
                    :legal-reference="dataCategory(key)?.legalReference"
                    :can-edit="canEdit"
                    :locales="additionalLocales"
                    @update:model-value="(value) => setSpecialBasis(key, value)"
                    @update:legal-reference="
                      (value) => setLegalReference(key, value)
                    "
                  />
                  <privacy-category-notes
                    :category-key="key"
                    class="text-caption text-on-surface-variant q-mt-xs"
                  />
                </template>
              </privacy-entry-row>
            </template>

            <privacy-entry-row
              v-for="entry in inheritedCustomCategories"
              :key="entry.key"
              inherited
              :label="categoryLabel(entry)"
              :caption="
                lockedReason('dataCategories', entry.key, entry.allEvents)
              "
              :special="entry.special === true"
              :excluded="categoryState(entry.key) === 'exclude'"
            >
              <template #actions>
                <inherited-entry-toggle
                  :model-value="categoryState(entry.key)"
                  :exclude-disabled="
                    excludeBlocked('dataCategories', entry.key)
                  "
                  :disable="!canEdit"
                  @update:model-value="
                    (state) => setCategoryState(entry.key, state)
                  "
                />
              </template>
            </privacy-entry-row>
          </privacy-entry-list>

          <template #more>
            <privacy-entry-list>
              <privacy-entry-row
                v-for="key in moreCategoryKeys"
                :key="key"
                :label="gt(`privacy.dataCategory.${key}`)"
                :selected="false"
                :special="isSpecialCategory(key)"
                :disable="!canEdit"
                @update:selected="(on) => toggleDataCategory(key, on)"
              />
            </privacy-entry-list>
          </template>
        </privacy-section>

        <!-- Recipients. -->
        <privacy-section
          icon="share"
          :title="t('addendum.recipients')"
          :summary="
            sectionSummary(
              inheritedRecipientCount,
              ownRecipientKeys.length - inheritedRecipientKeys.length,
            )
          "
          :more-count="canEdit ? moreRecipientKeys.length : 0"
        >
          <privacy-entry-list
            v-if="ownRecipientKeys.length || inheritedCustomRecipients.length"
          >
            <template
              v-for="key in ownRecipientKeys"
              :key="key"
            >
              <privacy-entry-row
                v-if="inheritsRecipient(key)"
                inherited
                :label="gt(`privacy.recipient.${key}`)"
                :caption="
                  lockedReason(
                    'recipients',
                    key,
                    inheritedRecipient(key)?.allEvents,
                  ) ??
                  (recipientState(key) === 'inherit'
                    ? inheritedRecipientName(key)
                    : null)
                "
                :excluded="recipientState(key) === 'exclude'"
              >
                <template #actions>
                  <inherited-entry-toggle
                    :model-value="recipientState(key)"
                    :can-override="!isAlwaysRecipient(key)"
                    :exclude-disabled="excludeBlocked('recipients', key)"
                    :disable="!canEdit"
                    @update:model-value="
                      (state) => setRecipientState(key, state)
                    "
                  />
                </template>
                <template
                  v-if="recipientState(key) === 'override'"
                  #default
                >
                  <q-input
                    :model-value="recipient(key)?.name ?? ''"
                    :label="gt('privacy.editor.field.recipientName')"
                    :hint="gt('privacy.editor.field.recipientNameHint')"
                    dense
                    outlined
                    rounded
                    :disable="!canEdit"
                    @update:model-value="
                      (value) => setRecipientName(key, String(value))
                    "
                  />
                </template>
              </privacy-entry-row>

              <privacy-entry-row
                v-else
                :label="gt(`privacy.recipient.${key}`)"
                selected
                :disable="!canEdit"
                @update:selected="(on) => toggleRecipient(key, on)"
              >
                <q-input
                  :model-value="recipient(key)?.name ?? ''"
                  :label="gt('privacy.editor.field.recipientName')"
                  :hint="gt('privacy.editor.field.recipientNameHint')"
                  dense
                  outlined
                  rounded
                  :disable="!canEdit"
                  @update:model-value="
                    (value) => setRecipientName(key, String(value))
                  "
                />
              </privacy-entry-row>
            </template>

            <privacy-entry-row
              v-for="entry in inheritedCustomRecipients"
              :key="entry.key"
              inherited
              :label="recipientLabel(entry)"
              :caption="lockedReason('recipients', entry.key, entry.allEvents)"
              :excluded="recipientState(entry.key) === 'exclude'"
            >
              <template #actions>
                <inherited-entry-toggle
                  :model-value="recipientState(entry.key)"
                  :exclude-disabled="excludeBlocked('recipients', entry.key)"
                  :disable="!canEdit"
                  @update:model-value="
                    (state) => setRecipientState(entry.key, state)
                  "
                />
              </template>
            </privacy-entry-row>
          </privacy-entry-list>

          <template #more>
            <privacy-entry-list>
              <privacy-entry-row
                v-for="key in moreRecipientKeys"
                :key="key"
                :label="gt(`privacy.recipient.${key}`)"
                :selected="false"
                :disable="!canEdit"
                @update:selected="(on) => toggleRecipient(key, on)"
              />
            </privacy-entry-list>
          </template>
        </privacy-section>

        <!-- Transfers outside the EEA, only when the organization declares
             any: an event can drop countries, not add its own here. -->
        <privacy-section
          v-if="inheritedTransferCountries.length"
          icon="public"
          :title="t('addendum.transfers')"
          :summary="sectionSummary(inheritedTransferCountries.length, 0)"
        >
          <privacy-entry-list>
            <privacy-entry-row
              v-for="country in inheritedTransferCountries"
              :key="country"
              inherited
              :label="countryLabel(country)"
              :caption="lockedReason('transferCountries', country, false)"
              :excluded="isExcluded('transferCountries', country)"
            >
              <template #actions>
                <inherited-entry-toggle
                  :model-value="entryState('transferCountries', country, false)"
                  :exclude-disabled="
                    excludeBlocked('transferCountries', country)
                  "
                  :disable="!canEdit"
                  @update:model-value="
                    (state) =>
                      setExcluded(
                        'transferCountries',
                        country,
                        state === 'exclude',
                      )
                  "
                />
              </template>
            </privacy-entry-row>
          </privacy-entry-list>
        </privacy-section>
      </template>

      <privacy-section
        icon="notes"
        :title="t('addendum.additional')"
        :summary="t('addendum.additionalHint')"
      >
        <locale-tabs
          v-model="additionalLocale"
          :locales="additionalLocales"
          :filled="filledAdditionalLocales"
        />
        <rich-text-editor
          v-model="additionalForLocale"
          :placeholder="t('field.additionalPlaceholder')"
          class="q-mt-sm"
        />
      </privacy-section>

      <privacy-publish-card
        :published-version="publishedVersion"
        :published-at="publishedAt"
        :has-unpublished-changes="hasUnpublishedChanges"
        :can-edit="canEdit"
        :publish-disabled="publishDisabled"
        :unpublished-detail="t('status.unpublishedDetail')"
        :empty-status="{
          title: t('status.none.title'),
          detail: t('status.none.detail'),
        }"
        :publishing
        @publish="publish"
        @preview="previewOpen = true"
      >
        <div
          v-if="!organizationContent"
          class="text-body2 text-warning"
        >
          {{ t('status.blocked') }}
        </div>
        <!-- An addendum that says nothing is a first version the server
             refuses, but a withdrawal of everything the event published so far —
             two different things to say about the same empty screen. Only once
             something has been changed: on an untouched event the status line
             already says it. -->
        <div
          v-else-if="isEmptyAddendum(publishable) && hasUnpublishedChanges"
          class="text-body2 text-on-surface-variant"
        >
          {{
            publishedVersion === null ? t('status.empty') : t('status.withdraw')
          }}
        </div>

        <!-- The same check the server runs before it accepts the addendum.
             Shown here so the author reads what is missing next to the fields
             that fix it, rather than as a rejected save. -->
        <template
          v-if="gaps.length"
          #note
        >
          <div class="text-body2 text-warning">
            {{ t('status.incomplete') }}
          </div>
          <ul class="privacy-gaps text-body2 text-on-surface-variant">
            <li
              v-for="gap in gaps"
              :key="gap"
            >
              {{ gt(`privacy.gap.${gap}`) }}
            </li>
          </ul>
        </template>
      </privacy-publish-card>
    </div>

    <!-- The organization's notice on its own, and the same notice with this
         event's additions folded in: the pair is the only way to see what the
         event actually changes. -->
    <privacy-preview-dialog
      v-model="baselineOpen"
      :notice="baselineNotice"
      :title="t('baseline.open')"
      :hint="t('baseline.previewHint')"
    />
    <privacy-preview-dialog
      v-model="previewOpen"
      :notice="previewNotice"
    />
  </page-state-handler>
</template>

<script lang="ts" setup>
import PageHeader from '@/components/common/PageHeader.vue';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import {
  noticeFramework,
  presetLegalBasis,
  DEFAULT_SPECIAL_CATEGORY_BASIS,
  PRIVACY_DATA_CATEGORY_KEYS,
  PRIVACY_PURPOSE_KEYS,
  PRIVACY_PURPOSE_PRESETS,
  PRIVACY_RECIPIENT_KEYS,
  addendumGaps,
  composePrivacyNotice,
  hasStructuredEntries,
  isEmptyAddendum,
  isAdvisorySpecialCategory,
  isAlwaysRecipient,
  isCustomKey,
  isSpecialCategory,
  normalizeExclusions,
  publishableAddendum,
  refusedExclusions,
  requiresConsentQuestion,
  type LegalBasisKey,
  type PrivacyPurposeKey,
  type PrivacyDataCategoryRef,
  type PrivacyNoticeExclusions,
  type PrivacyDataCategoryKey,
  type PrivacyNoticeAddendum,
  type PrivacyNoticeContent,
  type PrivacyRecipientKey,
  type PrivacyRecipientRef,
  type PublishedPrivacyNotice,
  type SpecialCategoryBasisKey,
} from '@camp-registration/common/privacy';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import RichTextEditor from '@/components/common/inputs/RichTextEditor.vue';
import LocaleTabs from '@/components/common/localization/LocaleTabs.vue';
import InheritedEntryToggle, {
  type InheritedEntryState,
} from '@/components/privacy/InheritedEntryToggle.vue';
import PrivacyCategoryNotes from '@/components/privacy/PrivacyCategoryNotes.vue';
import PrivacyEntryList from '@/components/privacy/PrivacyEntryList.vue';
import PrivacyEntryRow from '@/components/privacy/PrivacyEntryRow.vue';
import PrivacySection from '@/components/privacy/PrivacySection.vue';
import PrivacyPreviewDialog from '@/components/privacy/PrivacyPreviewDialog.vue';
import PrivacyPublishCard from '@/components/privacy/PrivacyPublishCard.vue';
import SpecialCategoryBasisField from '@/components/privacy/SpecialCategoryBasisField.vue';
import { usePrivacyNoticeService } from '@/services/PrivacyNoticeService';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { usePermissions } from '@/composables/permissions';
import { useOrganizationPermissions } from '@/composables/organizationPermissions';
import {
  providePrivacyFramework,
  usePrivacyLabels,
} from '@/composables/privacyLabels';
import { useErrorExtractor } from '@/composables/errorText';
import { useNotifier } from '@/composables/notifier';
import { usePrivacyEntryEditor } from '@/composables/privacyEntryEditor';
import { localeText, useLocaleTextModel } from '@/composables/localeText';
import {
  eventDataTagPrivacyCategory,
  extractEventDataTypes,
  extractPrivacyTags,
} from '@camp-registration/common/form';
import { APP_LOCALES, eventTextLocales } from '@/i18n/locales';

const { t, d } = useI18n();
const { t: gt } = useI18n({ useScope: 'global' });
const eventDetailsStore = useEventDetailsStore();
const { data: event } = storeToRefs(eventDetailsStore);
const { can } = usePermissions();
const { canOrgFor } = useOrganizationPermissions();
// An addendum is written under its organization's law, and cites it.
const eventNoticeLaw = () => organizationContent.value;
providePrivacyFramework(eventNoticeLaw);
const {
  legalBasisOptions,
  categoryLabel,
  purposeLabel,
  recipientLabel,
  countryLabel,
  cite,
  specialBasisLabel,
  legalBasisCaution,
} = usePrivacyLabels(eventNoticeLaw);
const { extractErrorText } = useErrorExtractor();
const notifier = useNotifier();
const { fetchEventAddendum, publishEventAddendum, fetchEventNotice } =
  usePrivacyNoticeService();

const loading = ref(true);
const publishing = ref(false);
const error = ref<string | null>(null);
const additionalLocale = ref('en');
const baselineOpen = ref(false);
const previewOpen = ref(false);

/** The organization's published notice — what this event is adding to. */
const organizationContent = ref<PrivacyNoticeContent | null>(null);
// The locales the event is offered in: every translated text needs each.
const requiredLocales = ref<string[]>([]);
const organizationPublishedVersion = ref<number | null>(null);
const organizationPublishedAt = ref<string | null>(null);
const publishedVersion = ref<number | null>(null);
const publishedAt = ref<string | null>(null);
/** Controller identity and supervisory authority, for the preview only. */
const published = ref<PublishedPrivacyNotice | null>(null);

const content = ref<PrivacyNoticeAddendum>(emptyAddendum());
// What registrants are currently reading. There is no draft, so this is the
// only thing an edit can be compared against.
const publishedSnapshot = ref(JSON.stringify(content.value));

const {
  dataCategory,
  hasDataCategory,
  toggleDataCategory,
  setSpecialBasis,
  setLegalReference,
  recipient,
  hasRecipient,
  toggleRecipient,
  setRecipientName,
} = usePrivacyEntryEditor(content);

const eventId = computed(() => event.value?.id);
const organizationId = computed(() => event.value?.organizationId);
const canEdit = computed(() => can('event.edit'));
const canEditOrganization = computed(
  () =>
    organizationId.value !== undefined &&
    canOrgFor(organizationId.value, 'organization.edit'),
);

const organizationFreeText = computed(
  () => organizationContent.value?.mode === 'free_text',
);

// What publishing sends and the preview shows: under a free-text organization
// notice, entries from before the switch are dropped rather than refused.
const publishable = computed(() =>
  publishableAddendum(organizationContent.value, content.value),
);

// Leftover entries count as a change: only publishing removes them.
const hasUnpublishedChanges = computed(
  () =>
    JSON.stringify(content.value) !== publishedSnapshot.value ||
    (organizationFreeText.value && hasStructuredEntries(content.value)),
);

/**
 * An addendum that says nothing has nothing to publish — the server refuses one
 * rather than minting a first version that reads like no version at all. Once
 * something is published, though, saying nothing withdraws it, which is the
 * only way back to the organization's notice on its own.
 */
const publishDisabled = computed(
  () =>
    !organizationContent.value ||
    (isEmptyAddendum(publishable.value) && publishedVersion.value === null) ||
    gaps.value.length > 0,
);

/**
 * What this event adds that the composed notice cannot stand behind — the same
 * list the server refuses the addendum with. An empty addendum is a withdrawal
 * rather than a statement, so there is nothing to check.
 */
const gaps = computed(() =>
  isEmptyAddendum(publishable.value)
    ? []
    : addendumGaps(organizationContent.value, publishable.value, {
        locales: requiredLocales.value,
      }),
);

function emptyAddendum(): PrivacyNoticeAddendum {
  return {
    dataCategories: [],
    recipients: [],
    additional: null,
    excluded: null,
  };
}

/** Loads what is published into the editor and baselines the edit against it. */
function loadPublished(published: PrivacyNoticeAddendum | undefined) {
  content.value = { ...emptyAddendum(), ...published };
  // Baseline it *after* normalising, or the page opens claiming edits the
  // author never made.
  publishedSnapshot.value = JSON.stringify(content.value);
}

void loadPage();

async function loadPage() {
  try {
    // On a reload this page is what instantiates the event store, so the store's
    // own route guard has already run and nothing has fetched the event yet.
    await eventDetailsStore.fetchData();

    const id = eventId.value;
    if (!id) {
      error.value = eventDetailsStore.error;
      return;
    }

    const [context, notice] = await Promise.all([
      fetchEventAddendum(id),
      fetchEventNotice(id),
    ]);

    loadPublished(context.content);
    organizationContent.value = context.organizationContent;
    requiredLocales.value = context.requiredLocales;
    organizationPublishedVersion.value = context.organizationPublishedVersion;
    organizationPublishedAt.value = context.organizationPublishedAt;
    publishedVersion.value = context.publishedVersion;
    publishedAt.value = context.publishedAt;
    published.value = notice;
  } catch (err) {
    error.value = extractErrorText(err);
  } finally {
    loading.value = false;
  }
}

/* The organization baseline */

/**
 * The organization's notice as a registrant would read it, without this event's
 * additions — the "before" half of the pair the preview buttons open.
 */
const baselineNotice = computed<PublishedPrivacyNotice | null>(() => {
  if (!published.value || !organizationContent.value) {
    return null;
  }

  return {
    ...published.value,
    notice: composePrivacyNotice(organizationContent.value),
    eventVersion: null,
  };
});

/** The same notice with the addendum as it stands on screen. */
const previewNotice = computed<PublishedPrivacyNotice | null>(() => {
  if (!published.value) {
    return null;
  }

  return {
    ...published.value,
    notice: organizationContent.value
      ? composePrivacyNotice(organizationContent.value, publishable.value)
      : null,
    eventVersion: publishedVersion.value,
  };
});

/* Inheritance: what the organization already declares */

function inheritedCategory(key: PrivacyDataCategoryKey) {
  return organizationContent.value?.dataCategories.find(
    (entry) => entry.key === key,
  );
}
function inheritsCategory(key: PrivacyDataCategoryKey): boolean {
  return inheritedCategory(key) !== undefined;
}
function inheritedCategoryBasis(
  key: PrivacyDataCategoryKey,
): SpecialCategoryBasisKey | null {
  const entry = inheritedCategory(key);
  if (!entry || !isSpecialCategory(key)) {
    return null;
  }

  return entry.specialCategoryBasis ?? DEFAULT_SPECIAL_CATEGORY_BASIS;
}

function inheritedRecipient(key: PrivacyRecipientRef) {
  return organizationContent.value?.recipients.find(
    (entry) => entry.key === key,
  );
}
function inheritsRecipient(key: PrivacyRecipientRef): boolean {
  return inheritedRecipient(key) !== undefined;
}
function inheritedRecipientName(key: PrivacyRecipientKey): string | null {
  return inheritedRecipient(key)?.name || null;
}

/**
 * The data categories this event's form asks for: its `privacyCategory` tags —
 * what the registration gate checks — and the `eventDataType` fields mapped onto
 * categories. Partial by construction — a free-text question can hold anything —
 * so it only ever proposes, and never proposes what the organization already
 * covers.
 */
const formCategories = computed<PrivacyDataCategoryKey[]>(() => {
  const form = event.value?.form;
  if (!form) {
    return [];
  }

  const found = new Set<PrivacyDataCategoryKey>();
  for (const { category } of extractPrivacyTags(form).tagged) {
    if (isCatalogueCategory(category)) {
      found.add(category);
    }
  }
  for (const tag of extractEventDataTypes(form)) {
    const category = eventDataTagPrivacyCategory(tag);
    if (category) {
      found.add(category);
    }
  }

  return [...found];
});

const suggestedCategories = computed<PrivacyDataCategoryKey[]>(() =>
  formCategories.value.filter(
    (key) => !hasDataCategory(key) && !inheritsCategory(key),
  ),
);

// A tagged question the notice does not declare stops registrations
// (docs/privacy.md, 5) — then it is no longer a suggestion.
const suggestionBlocks = computed<boolean>(() => {
  const form = event.value?.form;
  if (!form) {
    return false;
  }
  const tagged = new Set(
    extractPrivacyTags(form).tagged.map((question) => question.category),
  );

  return suggestedCategories.value.some((key) => tagged.has(key));
});

function isCatalogueCategory(key: string): key is PrivacyDataCategoryKey {
  return (PRIVACY_DATA_CATEGORY_KEYS as readonly string[]).includes(key);
}

function applySuggested() {
  suggestedCategories.value.forEach((key) => toggleDataCategory(key, true));
}

/* Data categories */

function hasCategoryNotes(key: PrivacyDataCategoryKey): boolean {
  return isAdvisorySpecialCategory(key) || requiresConsentQuestion(key);
}

/* What each section lists, and what waits behind "add more" */

const ownPurposeKeys = computed(() =>
  eventPurposeKeys.value.filter((key) => hasEventPurpose(key)),
);
const morePurposeKeys = computed(() =>
  eventPurposeKeys.value.filter((key) => !hasEventPurpose(key)),
);

const inheritedCategoryKeys = computed(() =>
  PRIVACY_DATA_CATEGORY_KEYS.filter((key) => inheritsCategory(key)),
);
// Inherited and the event's own, in catalogue order.
const ownCategoryKeys = computed(() =>
  PRIVACY_DATA_CATEGORY_KEYS.filter(
    (key) => inheritsCategory(key) || hasDataCategory(key),
  ),
);
const moreCategoryKeys = computed(() =>
  PRIVACY_DATA_CATEGORY_KEYS.filter(
    (key) => !inheritsCategory(key) && !hasDataCategory(key),
  ),
);
const inheritedCategoryCount = computed(
  () =>
    inheritedCategoryKeys.value.length + inheritedCustomCategories.value.length,
);

const inheritedRecipientKeys = computed(() =>
  PRIVACY_RECIPIENT_KEYS.filter((key) => inheritsRecipient(key)),
);
const ownRecipientKeys = computed(() =>
  PRIVACY_RECIPIENT_KEYS.filter(
    (key) => inheritsRecipient(key) || hasRecipient(key),
  ),
);
const moreRecipientKeys = computed(() =>
  PRIVACY_RECIPIENT_KEYS.filter(
    (key) => !inheritsRecipient(key) && !hasRecipient(key),
  ),
);
const inheritedRecipientCount = computed(
  () =>
    inheritedRecipientKeys.value.length +
    inheritedCustomRecipients.value.length,
);

function sectionSummary(inherited: number, own: number): string {
  const parts = [
    inherited ? t('summary.inherited', { count: inherited }) : null,
    own ? t('summary.own', { count: own }) : null,
  ].filter((part): part is string => part !== null);

  return parts.length ? parts.join(' · ') : t('summary.none');
}

function categoryNames(keys: PrivacyDataCategoryKey[]): string {
  return keys.map((key) => gt(`privacy.dataCategory.${key}`)).join(', ');
}

/* The event's own purposes */

// The catalogue minus what the organization already declares: those rows are
// the inherited ones above, kept or excluded rather than ticked.
const eventPurposeKeys = computed(() =>
  PRIVACY_PURPOSE_KEYS.filter(
    (key) => !inheritedPurposes.value.some((entry) => entry.key === key),
  ),
);

function eventPurpose(key: PrivacyPurposeKey) {
  return content.value.purposes?.find((entry) => entry.key === key);
}
function hasEventPurpose(key: PrivacyPurposeKey): boolean {
  return eventPurpose(key) !== undefined;
}
/**
 * Like the organization's editor: a purpose brings its usual data and
 * recipients, unless the organization already declares them. Unticking never
 * removes those again.
 */
function toggleEventPurpose(key: PrivacyPurposeKey, on: boolean) {
  const entries = content.value.purposes ?? [];
  if (!on) {
    content.value.purposes = entries.filter((entry) => entry.key !== key);
    return;
  }

  const preset = PRIVACY_PURPOSE_PRESETS[key];
  // A basis the law attaches conditions to is left for the author to choose.
  content.value.purposes = [
    ...entries,
    {
      key,
      legalBasis: presetLegalBasis(
        preset.legalBasis,
        noticeFramework(organizationContent.value),
      ),
    },
  ];
  for (const category of preset.dataCategories) {
    if (!inheritsCategory(category) && !hasDataCategory(category)) {
      toggleDataCategory(category, true);
    }
  }
  for (const recipientKey of preset.recipients) {
    if (!inheritsRecipient(recipientKey) && !hasRecipient(recipientKey)) {
      toggleRecipient(recipientKey, true);
    }
  }
}
function setEventLegalBasis(key: PrivacyPurposeKey, value: LegalBasisKey) {
  const entry = eventPurpose(key);
  if (entry) {
    entry.legalBasis = value;
  }
}

/* Recipients */

/* Exclusions: inherit, change or drop an organization entry */

type ExclusionPart = keyof PrivacyNoticeExclusions;

function isExcluded(part: ExclusionPart, key: string): boolean {
  return (
    (content.value.excluded?.[part] as string[] | undefined)?.includes(key) ??
    false
  );
}

function setExcluded(part: ExclusionPart, key: string, on: boolean) {
  const excluded = { ...content.value.excluded };
  const keys = new Set<string>(excluded[part] ?? []);
  if (on) {
    keys.add(key);
  } else {
    keys.delete(key);
  }
  (excluded as Record<string, string[]>)[part] = [...keys];

  const remaining = Object.values(excluded).some((list) => list?.length);
  content.value.excluded = remaining ? excluded : null;
}

/**
 * Whether the server would refuse excluding this key — the same check, run on
 * the addendum as it would be with the key excluded.
 */
function excludeBlocked(part: ExclusionPart, key: string): boolean {
  const organization = organizationContent.value;
  if (!organization) {
    return true;
  }

  const excluded = content.value.excluded ?? {};
  const candidate = normalizeExclusions(organization, {
    ...content.value,
    excluded: { ...excluded, [part]: [...(excluded[part] ?? []), key] },
  });

  return refusedExclusions(organization, candidate).some(
    (entry) => entry.part === part && entry.key === key,
  );
}

function entryState(
  part: ExclusionPart,
  key: string,
  restated: boolean,
): InheritedEntryState {
  if (isExcluded(part, key)) {
    return 'exclude';
  }

  return restated ? 'override' : 'inherit';
}

function categoryState(key: PrivacyDataCategoryRef): InheritedEntryState {
  return entryState(
    'dataCategories',
    key,
    content.value.dataCategories?.some((entry) => entry.key === key) ?? false,
  );
}

function setCategoryState(
  key: PrivacyDataCategoryRef,
  state: InheritedEntryState,
) {
  setExcluded('dataCategories', key, state === 'exclude');

  const entries = (content.value.dataCategories ?? []).filter(
    (entry) => entry.key !== key,
  );
  const inherited = organizationContent.value?.dataCategories.find(
    (entry) => entry.key === key,
  );
  // An override starts as a copy of the organization's entry; the mandatory
  // flag is the organization's to set, not the event's.
  content.value.dataCategories =
    state === 'override' && inherited
      ? [...entries, withoutAllEvents(inherited)]
      : entries;
}

function recipientState(key: PrivacyRecipientRef): InheritedEntryState {
  return entryState('recipients', key, hasRecipient(key));
}

function setRecipientState(
  key: PrivacyRecipientRef,
  state: InheritedEntryState,
) {
  setExcluded('recipients', key, state === 'exclude');

  const entries = (content.value.recipients ?? []).filter(
    (entry) => entry.key !== key,
  );
  const inherited = inheritedRecipient(key);
  content.value.recipients =
    state === 'override' && inherited
      ? [...entries, withoutAllEvents(inherited)]
      : entries;
}

function withoutAllEvents<T extends { allEvents?: boolean | null }>(
  entry: T,
): Omit<T, 'allEvents'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { allEvents, ...rest } = entry;
  return rest;
}

/** Why an entry cannot be excluded, for the caption under it. */
function lockedReason(
  part: ExclusionPart,
  key: string,
  allEvents: boolean | null | undefined,
): string | null {
  if (allEvents) {
    return t('entry.allEvents');
  }
  if (part === 'recipients' && isAlwaysRecipient(key as PrivacyRecipientKey)) {
    return t('entry.alwaysRecipient');
  }
  if (part === 'transferCountries' && excludeBlocked(part, key)) {
    return t('entry.countryInUse');
  }

  return null;
}

const inheritedPurposes = computed(
  () => organizationContent.value?.purposes ?? [],
);

// Catalogue categories are listed below anyway; the organization's own custom
// ones have no row there, so they get one here.
const inheritedCustomCategories = computed(() =>
  (organizationContent.value?.dataCategories ?? []).filter((entry) =>
    isCustomKey(entry.key),
  ),
);

const inheritedCustomRecipients = computed(() =>
  (organizationContent.value?.recipients ?? []).filter((entry) =>
    isCustomKey(entry.key),
  ),
);

const inheritedTransferCountries = computed(() =>
  organizationContent.value?.thirdCountryTransfers.enabled
    ? organizationContent.value.thirdCountryTransfers.countries
    : [],
);

/**
 * Categories the form's tags point at but this event excludes: registrants
 * would hand them over without being told.
 */
const excludedFormCategories = computed<PrivacyDataCategoryKey[]>(() =>
  formCategories.value.filter((key) => isExcluded('dataCategories', key)),
);

/* Additional information */

const additionalForLocale = useLocaleTextModel(
  {
    get: () => content.value.additional,
    set: (value) => (content.value.additional = value),
  },
  additionalLocale,
);

/**
 * Only the languages this event's registrants read. The addendum is written by
 * hand and never translated for the author, so a tab for a country the event
 * does not run in is only an invitation to write text nobody is served.
 */
// The tab currently being edited, once it has actually been opened. Without it
// an out-of-country locale would lose its tab the moment its text is cleared —
// pulling the editor out from under the author mid-edit.
const pinnedAdditionalLocale = ref<string | null>(null);

const additionalLocales = computed(() => {
  const own = eventTextLocales(event.value?.countries);

  // Text written before the event's countries changed stays reachable: it is
  // published either way, and a tab nobody can open is a tab nobody can fix.
  return APP_LOCALES.filter(
    (loc) =>
      own.includes(loc) ||
      loc === pinnedAdditionalLocale.value ||
      localeText(content.value.additional, loc).trim() !== '',
  );
});

watch(additionalLocale, (locale) => {
  if (additionalLocales.value.some((available) => available === locale)) {
    pinnedAdditionalLocale.value = locale;
  }
});

// The event arrives after the page does, so the tab picked at load may not be
// among the event's own languages.
watch(
  additionalLocales,
  (available) => {
    if (!available.some((locale) => locale === additionalLocale.value)) {
      additionalLocale.value = available[0] ?? 'en';
    }
  },
  { immediate: true },
);

const filledAdditionalLocales = computed(() =>
  additionalLocales.value.filter(
    (loc) => localeText(content.value.additional, loc).trim() !== '',
  ),
);

/* Publishing */

async function publish() {
  const id = eventId.value;
  if (!id) {
    return;
  }

  publishing.value = true;
  try {
    const context = await publishEventAddendum(id, { ...publishable.value });
    publishedVersion.value = context.publishedVersion;
    publishedAt.value = context.publishedAt;
    // From what came back, not from what was sent: the server sanitizes the
    // free-text field, so the two are not always the same document.
    loadPublished(context.content);
  } catch (err) {
    // Notify rather than set `error`: that swaps the whole page for an error
    // state, and since the draft lives only in this browser, it would throw away
    // everything the author just wrote.
    notifier.error('publish', err, t('notify.publishFailed'));
  } finally {
    publishing.value = false;
  }
}
</script>

<style lang="scss" scoped>
$indent-checkbox: 2.25rem;
$field-max: 32rem;

// The grid columns are proportional, so on a very wide monitor 8/12 is still
// far past a readable measure.
.privacy-shell {
  max-width: 70rem;
}

.entry {
  margin-bottom: 0.25rem;

  // Line a row's notes and revealed fields up with its label rather than with
  // its checkbox.
  &__note,
  &__nested {
    margin-left: $indent-checkbox;
  }

  &__note {
    margin-bottom: 0.35rem;
  }

  &__field {
    max-width: $field-max;
    margin-bottom: 0.5rem;
  }
}

.entry__label--excluded {
  text-decoration: line-through;
  color: var(--md3-on-surface-variant);
}

.baseline-chip {
  background-color: var(--md3-surface-container-high);
  color: var(--md3-on-surface);
}

.baseline-version {
  background-color: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}

.baseline-banner,
.suggestion-banner {
  background-color: var(--md3-surface-container-high);
  color: var(--md3-on-surface-variant);
  border-radius: 12px;
}

// On phones the chip/toggle drop to a full-width second line under the title
// rather than squeezing it into an unreadably narrow column.
@media (max-width: 599px) {
  .card-header {
    flex-wrap: wrap;
  }

  .card-header__badge {
    flex: 0 0 100%;
  }
}
</style>

<i18n lang="yaml" locale="en">
title: 'Privacy information'
subtitle: 'What this event adds to the privacy information of its organisation.'
baseline:
  title: 'From your organisation'
  hint: 'Published by the organisation and shown for every one of its events. This event can add to it, but never change or replace it.'
  version: 'Version {version} · {date}'
  previewHint: 'The notice as it stands today, without this event’s additions.'
  open: 'Read the full notice'
  edit: 'Edit at the organisation'
  freeText: 'Your organisation wrote its notice as free text, so this event can only add text of its own. Read its notice before adding anything here.'
  missing:
    title: 'Your organisation has not published any privacy information yet.'
    detail: 'Until it does, registrants see no notice for this event — and nothing you add here reaches them.'
addendum:
  purposes: 'Why data is collected'
  transfers: 'Transfers outside the EEA'
  excludedInForm: 'The form asks for {categories}, which this event excludes. Registrants would not be told about it.'
  freeTextEntries:
    title: 'Earlier additions are not shown'
    detail: 'This event added entries before your organisation switched to free text. Registrants do not see them; publishing removes them. Add anything still needed as text below.'
  dataCategories: 'Data collected'
  recipients: 'Recipients'
  additional: 'Additional information'
  additionalHint: 'Only for this event, and not translated for you.'
  suggested: 'This event’s form appears to collect: {categories}.'
  suggestedBlocking: 'This event’s form asks for {categories}. Until they are declared here, the event takes no registrations.'
  applySuggested: 'Add these'
field:
  legalBasis: 'Legal basis'
  additionalPlaceholder: 'Additional privacy information for this event…'
status:
  none:
    title: 'No additions for this event'
    detail: 'Registrants see your organisation’s notice as it stands.'
  unpublishedDetail: 'Registrants see your organisation’s notice without these additions until you publish.'
  blocked: 'There is nothing to publish these additions on top of yet.'
  incomplete: 'These additions cannot be published yet:'
  empty: 'Nothing to publish yet — tick what this event adds, or write an addition below.'
  withdraw: 'Publishing now withdraws this event’s additions — registrants then see your organisation’s notice on its own.'
notify:
  publishFailed: 'Publishing failed'
entry:
  allEvents: 'Applies to every event of your organisation.'
  alwaysRecipient: 'Always receives the data.'
  countryInUse: 'A recipient listed here is located in this country.'
readOnly: 'You can view this privacy information but not change it. Event directors can.'
summary:
  inherited: '{count} from your organisation'
  own: '{count} of this event'
  none: 'Nothing yet'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Datenschutzinformationen'
subtitle: 'Was diese Veranstaltung den Datenschutzinformationen ihrer Organisation hinzufügt.'
baseline:
  title: 'Von eurer Organisation'
  hint: 'Von der Organisation veröffentlicht und bei allen ihren Veranstaltungen angezeigt. Diese Veranstaltung kann sie ergänzen, aber nicht ändern oder ersetzen.'
  version: 'Version {version} · {date}'
  previewHint: 'Die Informationen im heutigen Stand, ohne die Ergänzungen dieser Veranstaltung.'
  open: 'Vollständige Informationen lesen'
  edit: 'Bei der Organisation bearbeiten'
  freeText: 'Eure Organisation hat die Informationen als Freitext verfasst, deshalb kann diese Veranstaltung nur eigenen Text ergänzen. Lies sie durch, bevor du hier etwas ergänzt.'
  missing:
    title: 'Eure Organisation hat noch keine Datenschutzinformationen veröffentlicht.'
    detail: 'Bis dahin sehen Anmeldende zu dieser Veranstaltung keine Informationen – und auch nichts, was du hier ergänzt.'
addendum:
  purposes: 'Warum Daten erhoben werden'
  transfers: 'Übermittlungen außerhalb des EWR'
  excludedInForm: 'Das Formular fragt nach {categories}, die diese Veranstaltung ausschließt. Teilnehmende würden darüber nicht informiert.'
  freeTextEntries:
    title: 'Frühere Ergänzungen werden nicht angezeigt'
    detail: 'Diese Veranstaltung hat Angaben ergänzt, bevor eure Organisation auf Freitext umgestellt hat. Teilnehmende sehen sie nicht; beim Veröffentlichen werden sie entfernt. Ergänze, was weiterhin nötig ist, unten als Text.'
  dataCategories: 'Erhobene Daten'
  recipients: 'Empfänger'
  additional: 'Zusätzliche Informationen'
  additionalHint: 'Gilt nur für diese Veranstaltung und wird nicht automatisch übersetzt.'
  suggested: 'Das Formular dieser Veranstaltung erhebt offenbar: {categories}.'
  suggestedBlocking: 'Das Formular dieser Veranstaltung fragt nach {categories}. Solange sie hier nicht angegeben sind, nimmt die Veranstaltung keine Anmeldungen an.'
  applySuggested: 'Hinzufügen'
field:
  legalBasis: 'Rechtsgrundlage'
  additionalPlaceholder: 'Zusätzliche Datenschutzinformationen zu dieser Veranstaltung…'
status:
  none:
    title: 'Keine Ergänzungen für diese Veranstaltung'
    detail: 'Anmeldende sehen die Informationen eurer Organisation unverändert.'
  unpublishedDetail: 'Anmeldende sehen die Informationen der Organisation ohne diese Ergänzungen, bis du veröffentlichst.'
  blocked: 'Es gibt noch nichts, worauf diese Ergänzungen aufsetzen könnten.'
  incomplete: 'Diese Ergänzungen können noch nicht veröffentlicht werden:'
  empty: 'Noch nichts zu veröffentlichen – hake an, was diese Veranstaltung ergänzt, oder schreibe unten eine Ergänzung.'
  withdraw: 'Beim Veröffentlichen werden die Ergänzungen dieser Veranstaltung zurückgezogen – Anmeldende sehen dann nur die Informationen eurer Organisation.'
notify:
  publishFailed: 'Veröffentlichen fehlgeschlagen'
entry:
  allEvents: 'Gilt für alle Veranstaltungen eurer Organisation.'
  alwaysRecipient: 'Erhält die Daten immer.'
  countryInUse: 'Ein hier genannter Empfänger hat seinen Sitz in diesem Land.'
readOnly: 'Du kannst diese Datenschutzinformationen ansehen, aber nicht ändern. Das kann die Leitung der Veranstaltung.'
summary:
  inherited: '{count} von der Organisation'
  own: '{count} eigene'
  none: 'Noch nichts angegeben'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Informations sur la protection des données'
subtitle: 'Ce que cet événement ajoute aux informations de son organisation.'
baseline:
  title: 'De votre organisation'
  hint: "Publiées par l'organisation et affichées pour tous ses événements. Cet événement peut les compléter, jamais les modifier ni les remplacer."
  version: 'Version {version} · {date}'
  previewHint: "Les informations telles qu'elles sont aujourd'hui, sans les ajouts de cet événement."
  open: 'Lire les informations complètes'
  edit: "Modifier au niveau de l'organisation"
  freeText: "Votre organisation a rédigé ses informations en texte libre ; cet événement ne peut donc y ajouter que son propre texte. Lisez-les avant d'ajouter quoi que ce soit ici."
  missing:
    title: "Votre organisation n'a pas encore publié d'informations sur la protection des données."
    detail: "D'ici là, les personnes qui s'inscrivent ne voient aucune information pour cet événement — ni ce que vous ajoutez ici."
addendum:
  purposes: 'Pourquoi les données sont collectées'
  transfers: "Transferts hors de l'EEE"
  excludedInForm: "Le formulaire demande {categories}, que cet événement exclut. Les participants n'en seraient pas informés."
  freeTextEntries:
    title: 'Les ajouts précédents ne sont pas affichés'
    detail: 'Cet événement a ajouté des éléments avant que votre organisation ne passe au texte libre. Les participants ne les voient pas ; la publication les supprime. Ajoutez ci-dessous sous forme de texte ce qui reste nécessaire.'
  dataCategories: 'Données collectées'
  recipients: 'Destinataires'
  additional: 'Informations supplémentaires'
  additionalHint: 'Valables pour cet événement uniquement, et non traduites automatiquement.'
  suggested: 'Le formulaire de cet événement semble collecter : {categories}.'
  suggestedBlocking: 'Le formulaire de cet événement demande {categories}. Tant qu’elles ne sont pas déclarées ici, l’événement n’accepte aucune inscription.'
  applySuggested: 'Ajouter'
field:
  legalBasis: 'Base juridique'
  additionalPlaceholder: 'Informations complémentaires pour cet événement…'
status:
  none:
    title: 'Aucun ajout pour cet événement'
    detail: "Les personnes qui s'inscrivent voient les informations de votre organisation telles quelles."
  unpublishedDetail: "Les personnes qui s'inscrivent voient les informations de votre organisation sans ces ajouts tant que vous n'avez pas publié."
  blocked: "Il n'y a encore rien sur quoi appuyer ces ajouts."
  incomplete: 'Ces ajouts ne peuvent pas encore être publiés :'
  empty: 'Rien à publier pour le moment — cochez ce que cet événement ajoute, ou rédigez un ajout ci-dessous.'
  withdraw: "Publier maintenant retire les ajouts de cet événement — les personnes qui s'inscrivent ne verront plus que les informations de votre organisation."
notify:
  publishFailed: 'Échec de la publication'
entry:
  allEvents: "S'applique à tous les événements de votre organisation."
  alwaysRecipient: 'Reçoit toujours les données.'
  countryInUse: 'Un destinataire indiqué ici est établi dans ce pays.'
readOnly: "Tu peux consulter ces informations sur la protection des données, mais pas les modifier. La direction de l'événement le peut."
summary:
  inherited: '{count} de votre organisation'
  own: '{count} de cet événement'
  none: 'Rien pour l’instant'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Informace o ochraně osobních údajů'
subtitle: 'Co tato akce doplňuje k informacím své organizace.'
baseline:
  title: 'Od vaší organizace'
  hint: 'Zveřejněno organizací a zobrazeno u všech jejích akcí. Tato akce je může doplnit, nikoli změnit nebo nahradit.'
  version: 'Verze {version} · {date}'
  previewHint: 'Informace v dnešní podobě, bez doplnění této akce.'
  open: 'Přečíst celé informace'
  edit: 'Upravit u organizace'
  freeText: 'Vaše organizace sepsala informace volným textem, tato akce k nim proto může doplnit jen vlastní text. Přečti si je, než tu něco doplníš.'
  missing:
    title: 'Vaše organizace zatím nezveřejnila žádné informace o ochraně osobních údajů.'
    detail: 'Do té doby přihlašující se u této akce nevidí žádné informace – ani to, co tu doplníš.'
addendum:
  purposes: 'Proč se údaje shromažďují'
  transfers: 'Předávání mimo EHP'
  excludedInForm: 'Formulář se ptá na {categories}, které tato akce vylučuje. Účastníci by o tom nebyli informováni.'
  freeTextEntries:
    title: 'Dřívější doplňky se nezobrazují'
    detail: 'Tato akce doplnila položky dřív, než vaše organizace přešla na volný text. Účastníci je nevidí; zveřejněním se odstraní. Co je stále potřeba, doplň níže jako text.'
  dataCategories: 'Sbírané údaje'
  recipients: 'Příjemci'
  additional: 'Další informace'
  additionalHint: 'Platí jen pro tuto akci a nepřekládá se automaticky.'
  suggested: 'Formulář této akce zřejmě sbírá: {categories}.'
  suggestedBlocking: 'Formulář této akce se ptá na {categories}. Dokud zde nejsou uvedeny, akce nepřijímá registrace.'
  applySuggested: 'Přidat'
field:
  legalBasis: 'Právní základ'
  additionalPlaceholder: 'Další informace o ochraně osobních údajů pro tuto akci…'
status:
  none:
    title: 'Žádná doplnění pro tuto akci'
    detail: 'Přihlašující vidí informace vaší organizace beze změn.'
  unpublishedDetail: 'Přihlašující vidí informace vaší organizace bez těchto doplnění, dokud je nezveřejníš.'
  blocked: 'Zatím není na čem tato doplnění postavit.'
  incomplete: 'Tato doplnění zatím nelze zveřejnit:'
  empty: 'Zatím není co zveřejnit – zaškrtni, co tato akce doplňuje, nebo níže napiš doplnění.'
  withdraw: 'Zveřejněním se doplnění této akce stáhnou – přihlašující pak uvidí jen informace vaší organizace.'
notify:
  publishFailed: 'Publikování se nezdařilo'
entry:
  allEvents: 'Platí pro všechny akce vaší organizace.'
  alwaysRecipient: 'Údaje dostává vždy.'
  countryInUse: 'Některý zde uvedený příjemce sídlí v této zemi.'
readOnly: 'Tyto informace o ochraně údajů můžeš zobrazit, ale ne měnit. To může vedení akce.'
summary:
  inherited: '{count} od organizace'
  own: '{count} vlastní'
  none: 'Zatím nic'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Informacje o ochronie danych'
subtitle: 'Co to wydarzenie dodaje do informacji swojej organizacji.'
baseline:
  title: 'Od Waszej organizacji'
  hint: 'Opublikowane przez organizację i pokazywane przy wszystkich jej wydarzeniach. To wydarzenie może je uzupełnić, ale nie zmienić ani zastąpić.'
  version: 'Wersja {version} · {date}'
  previewHint: 'Informacje w dzisiejszym kształcie, bez uzupełnień tego wydarzenia.'
  open: 'Przeczytaj pełne informacje'
  edit: 'Edytuj w organizacji'
  freeText: 'Wasza organizacja napisała informacje własnym tekstem, więc to wydarzenie może do nich dodać tylko własny tekst. Przeczytaj je, zanim coś tu dodasz.'
  missing:
    title: 'Wasza organizacja nie opublikowała jeszcze żadnych informacji o ochronie danych.'
    detail: 'Do tego czasu osoby zgłaszające się nie widzą przy tym wydarzeniu żadnych informacji – ani tego, co tu dodasz.'
addendum:
  purposes: 'Dlaczego zbierane są dane'
  transfers: 'Przekazywanie poza EOG'
  excludedInForm: 'Formularz pyta o {categories}, które to wydarzenie wyklucza. Uczestnicy nie zostaliby o tym poinformowani.'
  freeTextEntries:
    title: 'Wcześniejsze uzupełnienia nie są wyświetlane'
    detail: 'To wydarzenie dodało pozycje, zanim wasza organizacja przeszła na tekst własny. Uczestnicy ich nie widzą; publikacja je usunie. To, co nadal jest potrzebne, dodaj poniżej jako tekst.'
  dataCategories: 'Zbierane dane'
  recipients: 'Odbiorcy'
  additional: 'Dodatkowe informacje'
  additionalHint: 'Dotyczy tylko tego wydarzenia i nie jest tłumaczone automatycznie.'
  suggested: 'Formularz tego wydarzenia prawdopodobnie zbiera: {categories}.'
  suggestedBlocking: 'Formularz tego wydarzenia pyta o {categories}. Dopóki nie zostaną tu podane, wydarzenie nie przyjmuje rejestracji.'
  applySuggested: 'Dodaj'
field:
  legalBasis: 'Podstawa prawna'
  additionalPlaceholder: 'Dodatkowe informacje o ochronie danych dla tego wydarzenia…'
status:
  none:
    title: 'Brak uzupełnień dla tego wydarzenia'
    detail: 'Osoby zgłaszające się widzą informacje Waszej organizacji bez zmian.'
  unpublishedDetail: 'Osoby zgłaszające się widzą informacje Waszej organizacji bez tych uzupełnień, dopóki ich nie opublikujesz.'
  blocked: 'Nie ma jeszcze na czym oprzeć tych uzupełnień.'
  incomplete: 'Tych uzupełnień nie można jeszcze opublikować:'
  empty: 'Nie ma jeszcze czego publikować – zaznacz, co dodaje to wydarzenie, albo napisz uzupełnienie poniżej.'
  withdraw: 'Publikacja wycofa uzupełnienia tego wydarzenia – osoby zgłaszające się zobaczą wtedy same informacje Waszej organizacji.'
notify:
  publishFailed: 'Publikacja nie powiodła się'
entry:
  allEvents: 'Dotyczy wszystkich wydarzeń waszej organizacji.'
  alwaysRecipient: 'Zawsze otrzymuje dane.'
  countryInUse: 'Jeden z podanych tu odbiorców ma siedzibę w tym kraju.'
readOnly: 'Możesz przeglądać te informacje o ochronie danych, ale nie możesz ich zmieniać. Może to zrobić kierownictwo wydarzenia.'
summary:
  inherited: '{count} od organizacji'
  own: '{count} własne'
  none: 'Jeszcze nic'
</i18n>
