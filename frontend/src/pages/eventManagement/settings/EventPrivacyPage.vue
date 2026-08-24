<template>
  <page-state-handler
    padding
    :loading
    :error
    class="row justify-center"
  >
    <div class="privacy-shell column col-12 col-sm-10 col-md-8 q-gutter-md">
      <div class="page-title">
        <div class="text-h5 text-weight-medium">{{ t('title') }}</div>
        <div class="text-body2 text-on-surface-variant q-mt-xs">
          {{ t('subtitle') }}
        </div>
      </div>

      <!-- What the organization already says. Read-only, and shown in full
           rather than summarised in a sentence: without it an author cannot
           tell which of the ticks below they still have to make. -->
      <q-card
        flat
        bordered
      >
        <q-card-section class="row items-start no-wrap q-gutter-sm">
          <div class="col">
            <div class="text-subtitle2 text-weight-bold">
              {{ t('baseline.title') }}
            </div>
            <div class="text-body2 text-on-surface-variant q-mt-xs">
              {{ t('baseline.hint') }}
            </div>
          </div>
          <q-chip
            v-if="organizationPublishedVersion !== null"
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
        </q-card-section>

        <q-separator />

        <q-card-section>
          <!-- Nothing published is the one state a event cannot work around,
               so it is stated before anything else on the page. -->
          <q-banner
            v-if="!organizationContent"
            dense
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
            v-else-if="organizationContent.mode === 'free_text'"
            class="text-body2 text-on-surface-variant"
          >
            {{ t('baseline.freeText') }}
          </div>

          <div
            v-else
            class="column q-gutter-y-md"
          >
            <div
              v-for="group in baselineGroups"
              :key="group.key"
            >
              <div class="text-caption text-weight-medium">
                {{ group.label }}
              </div>
              <div
                v-if="group.items.length"
                class="row items-center q-gutter-xs q-mt-xs"
              >
                <q-chip
                  v-for="item in group.items"
                  :key="item"
                  dense
                  square
                  class="baseline-chip"
                >
                  {{ item }}
                </q-chip>
              </div>
              <div
                v-else
                class="text-caption text-on-surface-variant q-mt-xs"
              >
                {{ t('baseline.none') }}
              </div>
            </div>

            <div v-if="baselineRetention">
              <div class="text-caption text-weight-medium">
                {{ t('baseline.retention') }}
              </div>
              <div class="text-body2 q-mt-xs">{{ baselineRetention }}</div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions>
          <m-btn
            v-if="organizationContent"
            :label="t('baseline.open')"
            icon="description"
            flat
            color="primary"
            @click="baselineOpen = true"
          />
          <m-btn
            v-if="canEditOrganization"
            :label="t('baseline.edit')"
            icon="open_in_new"
            flat
            color="primary"
            :to="{
              name: 'management.organization.privacy',
              params: { organizationId },
            }"
          />
        </q-card-actions>
      </q-card>

      <!-- The event's own additions. Every row states where it comes from, so
           ticking something the organization already declared is visibly a
           no-op rather than a duplicate. -->
      <q-card
        flat
        bordered
      >
        <q-card-section class="row items-start no-wrap q-gutter-sm">
          <div class="col">
            <div class="text-subtitle2 text-weight-bold">
              {{ t('addendum.title') }}
            </div>
            <div class="text-body2 text-on-surface-variant q-mt-xs">
              {{ t('addendum.hint') }}
            </div>
          </div>
          <q-toggle
            v-if="hasInherited"
            v-model="hideInherited"
            :label="t('addendum.hideInherited')"
            dense
            size="sm"
            class="text-caption"
          />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div class="text-caption text-weight-medium q-mb-sm">
            {{ t('addendum.dataCategories') }}
          </div>

          <!-- Derived from the questions the form author tagged with a
               `campDataType`; a suggestion the manager confirms, never an
               automatic claim about what the form collects. -->
          <q-banner
            v-if="suggestedCategories.length"
            dense
            class="suggestion-banner q-mb-sm"
          >
            <template #avatar>
              <q-icon name="lightbulb" />
            </template>
            <div class="row items-center justify-between q-gutter-sm">
              <div class="col text-caption">
                {{
                  t('addendum.suggested', {
                    categories: suggestedCategories
                      .map((key) => gt(`privacy.dataCategory.${key}`))
                      .join(', '),
                  })
                }}
              </div>
              <m-btn
                :label="t('addendum.applySuggested')"
                flat
                dense
                color="primary"
                :disable="!canEdit"
                @click="applySuggested"
              />
            </div>
          </q-banner>

          <div
            v-for="key in visibleDataCategoryKeys"
            :key="key"
            class="entry"
          >
            <div class="row items-center no-wrap">
              <q-checkbox
                :model-value="inheritsCategory(key) || hasDataCategory(key)"
                :label="gt(`privacy.dataCategory.${key}`)"
                :disable="!canEdit || inheritsCategory(key)"
                dense
                @update:model-value="(on) => toggleDataCategory(key, on)"
              />
              <origin-chip
                :origin="categoryOrigin(key)"
                class="q-ml-sm"
              />
            </div>

            <!-- Inherited entries show the organization's own answer rather
                 than an editable copy of it: restating it here would let the
                 event silently override the notice it is adding to. -->
            <div
              v-if="inheritedCategoryBasis(key)"
              class="text-caption text-on-surface-variant entry__note"
            >
              {{ gt('privacy.editor.field.art9Basis') }}:
              {{
                gt(
                  `privacy.specialCategoryBasis.${inheritedCategoryBasis(key)}`,
                )
              }}
            </div>

            <special-category-basis-field
              v-else-if="hasDataCategory(key) && isSpecialCategory(key)"
              :model-value="dataCategory(key)?.specialCategoryBasis"
              :can-edit="canEdit"
              class="entry__nested"
              @update:model-value="(value) => setSpecialBasis(key, value)"
            />

            <!-- Rendered for inherited entries too: the organization declared
                 the category, but both notes ask about this event's own form,
                 and it is this event's manager who builds it. -->
            <privacy-category-notes
              v-if="inheritsCategory(key) || hasDataCategory(key)"
              :category-key="key"
              class="text-caption text-on-surface-variant entry__note"
            />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div class="text-caption text-weight-medium q-mb-sm">
            {{ t('addendum.recipients') }}
          </div>
          <div
            v-for="key in visibleRecipientKeys"
            :key="key"
            class="entry"
          >
            <div class="row items-center no-wrap">
              <q-checkbox
                :model-value="inheritsRecipient(key) || hasRecipient(key)"
                :label="gt(`privacy.recipient.${key}`)"
                :disable="!canEdit || inheritsRecipient(key)"
                dense
                @update:model-value="(on) => toggleRecipient(key, on)"
              />
              <origin-chip
                :origin="recipientOrigin(key)"
                class="q-ml-sm"
              />
            </div>

            <div
              v-if="inheritedRecipientName(key)"
              class="text-caption text-on-surface-variant entry__note"
            >
              {{ inheritedRecipientName(key) }}
            </div>

            <q-input
              v-else-if="hasRecipient(key)"
              :model-value="recipient(key)?.name ?? ''"
              :label="gt('privacy.editor.field.recipientName')"
              :hint="gt('privacy.editor.field.recipientNameHint')"
              dense
              outlined
              :disable="!canEdit"
              class="entry__nested entry__field"
              @update:model-value="
                (value) => setRecipientName(key, String(value))
              "
            />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div class="text-caption text-weight-medium">
            {{ t('addendum.additional') }}
          </div>
          <div class="text-caption text-on-surface-variant q-mb-sm">
            {{ t('addendum.additionalHint') }}
          </div>
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
        </q-card-section>
      </q-card>

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
          v-else-if="isEmptyAddendum(content) && hasUnpublishedChanges"
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
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import {
  EVENT_DATA_TYPE_DATA_CATEGORIES,
  DEFAULT_SPECIAL_CATEGORY_BASIS,
  PRIVACY_DATA_CATEGORY_KEYS,
  PRIVACY_RECIPIENT_KEYS,
  addendumGaps,
  composePrivacyNotice,
  isEmptyAddendum,
  isSpecialCategory,
  type PrivacyDataCategoryKey,
  type PrivacyNoticeAddendum,
  type PrivacyNoticeContent,
  type PrivacyRecipientKey,
  type PublishedPrivacyNotice,
  type SpecialCategoryBasisKey,
} from '@camp-registration/common/privacy';
import type { Translatable } from '@camp-registration/common/entities';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import RichTextEditor from '@/components/common/inputs/RichTextEditor.vue';
import LocaleTabs from '@/components/common/localization/LocaleTabs.vue';
import OriginChip from '@/components/privacy/OriginChip.vue';
import PrivacyCategoryNotes from '@/components/privacy/PrivacyCategoryNotes.vue';
import PrivacyPreviewDialog from '@/components/privacy/PrivacyPreviewDialog.vue';
import PrivacyPublishCard from '@/components/privacy/PrivacyPublishCard.vue';
import SpecialCategoryBasisField from '@/components/privacy/SpecialCategoryBasisField.vue';
import { usePrivacyNoticeService } from '@/services/PrivacyNoticeService';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { usePermissions } from '@/composables/permissions';
import { useOrganizationPermissions } from '@/composables/organizationPermissions';
import { usePrivacyLabels } from '@/composables/privacyLabels';
import {
  useErrorExtractor,
  useServiceNotifications,
} from '@/composables/serviceHandler';
import { extractEventDataTypes } from '@/utils/surveyJS';
import { APP_LOCALES, localesForCountries } from '@/i18n/locales';

const { t, d } = useI18n();
const { t: gt } = useI18n({ useScope: 'global' });
const eventDetailsStore = useEventDetailsStore();
const { data: event } = storeToRefs(eventDetailsStore);
const { can } = usePermissions();
const { canOrgFor } = useOrganizationPermissions();
const { categoryLabel, purposeLabel, recipientLabel } = usePrivacyLabels();
const { extractErrorText } = useErrorExtractor();
const { showErrorNotification } = useServiceNotifications();
const { fetchEventAddendum, publishEventAddendum, fetchEventNotice } =
  usePrivacyNoticeService();

const loading = ref(true);
const publishing = ref(false);
const error = ref<string | null>(null);
const additionalLocale = ref('en');
const hideInherited = ref(false);
const baselineOpen = ref(false);
const previewOpen = ref(false);

/** The organization's published notice — what this event is adding to. */
const organizationContent = ref<PrivacyNoticeContent | null>(null);
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

const eventId = computed(() => event.value?.id);
const organizationId = computed(() => event.value?.organizationId);
const canEdit = computed(() => can('event.edit'));
const canEditOrganization = computed(
  () =>
    organizationId.value !== undefined &&
    canOrgFor(organizationId.value, 'organization.edit'),
);

const hasUnpublishedChanges = computed(
  () => JSON.stringify(content.value) !== publishedSnapshot.value,
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
    (isEmptyAddendum(content.value) && publishedVersion.value === null) ||
    gaps.value.length > 0,
);

/**
 * What this event adds that the composed notice cannot stand behind — the same
 * list the server refuses the addendum with. An empty addendum is a withdrawal
 * rather than a statement, so there is nothing to check.
 */
const gaps = computed(() =>
  isEmptyAddendum(content.value)
    ? []
    : addendumGaps(organizationContent.value, content.value),
);

function emptyAddendum(): PrivacyNoticeAddendum {
  return { dataCategories: [], recipients: [], additional: null };
}

/** Loads what is published into the editor and baselines the edit against it. */
function loadPublished(published: PrivacyNoticeAddendum | undefined) {
  content.value = { ...emptyAddendum(), ...published };
  // Baseline it *after* normalising, or the page opens claiming edits the
  // author never made.
  publishedSnapshot.value = JSON.stringify(content.value);
}

onMounted(async () => {
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
});

/* The organization baseline */

const baselineGroups = computed(() => {
  const notice = organizationContent.value;

  return [
    {
      key: 'purposes',
      label: t('baseline.purposes'),
      items: (notice?.purposes ?? []).map(purposeLabel),
    },
    {
      key: 'dataCategories',
      label: t('baseline.dataCategories'),
      items: (notice?.dataCategories ?? []).map(categoryLabel),
    },
    {
      key: 'recipients',
      label: t('baseline.recipients'),
      items: (notice?.recipients ?? []).map((entry) =>
        entry.name
          ? `${recipientLabel(entry)} (${entry.name})`
          : recipientLabel(entry),
      ),
    },
  ];
});

const baselineRetention = computed(() => {
  const retention = organizationContent.value?.retention;
  if (!retention) {
    return null;
  }

  return t('baseline.retentionSentence', {
    months: retention.months,
    anchor: gt(`privacy.retentionAnchor.${retention.anchor}`),
  });
});

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
      ? composePrivacyNotice(organizationContent.value, content.value)
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

function inheritedRecipient(key: PrivacyRecipientKey) {
  return organizationContent.value?.recipients.find(
    (entry) => entry.key === key,
  );
}
function inheritsRecipient(key: PrivacyRecipientKey): boolean {
  return inheritedRecipient(key) !== undefined;
}
function inheritedRecipientName(key: PrivacyRecipientKey): string | null {
  return inheritedRecipient(key)?.name || null;
}

type EntryOrigin = 'organization' | 'event' | null;

function categoryOrigin(key: PrivacyDataCategoryKey): EntryOrigin {
  if (inheritsCategory(key)) {
    return 'organization';
  }

  return hasDataCategory(key) ? 'event' : null;
}

function recipientOrigin(key: PrivacyRecipientKey): EntryOrigin {
  if (inheritsRecipient(key)) {
    return 'organization';
  }

  return hasRecipient(key) ? 'event' : null;
}

const hasInherited = computed(
  () =>
    (organizationContent.value?.dataCategories.length ?? 0) > 0 ||
    (organizationContent.value?.recipients.length ?? 0) > 0,
);

// Both catalogues are long, and most of the entries are the organization's
// rather than this event's — hiding them leaves the list the author came for.
const visibleDataCategoryKeys = computed(() =>
  PRIVACY_DATA_CATEGORY_KEYS.filter(
    (key) => !hideInherited.value || !inheritsCategory(key),
  ),
);

const visibleRecipientKeys = computed(() =>
  PRIVACY_RECIPIENT_KEYS.filter(
    (key) => !hideInherited.value || !inheritsRecipient(key),
  ),
);

/**
 * Maps the `campDataType` tags the form author put on this event's questions
 * onto data categories. Partial by construction — a free-text question can hold
 * anything — so it only ever proposes, and never proposes what the organization
 * already covers.
 */
const suggestedCategories = computed<PrivacyDataCategoryKey[]>(() => {
  const form = event.value?.form;
  if (!form) {
    return [];
  }

  const found = new Set<PrivacyDataCategoryKey>();
  for (const tag of extractEventDataTypes(form)) {
    const category = EVENT_DATA_TYPE_DATA_CATEGORIES[tag];
    if (category) {
      found.add(category);
    }
  }

  return [...found].filter(
    (key) => !hasDataCategory(key) && !inheritsCategory(key),
  );
});

function applySuggested() {
  suggestedCategories.value.forEach((key) => toggleDataCategory(key, true));
}

/* Data categories */

function dataCategory(key: PrivacyDataCategoryKey) {
  return content.value.dataCategories?.find((entry) => entry.key === key);
}
function hasDataCategory(key: PrivacyDataCategoryKey): boolean {
  return dataCategory(key) !== undefined;
}
function toggleDataCategory(key: PrivacyDataCategoryKey, on: boolean) {
  const entries = content.value.dataCategories ?? [];

  content.value.dataCategories = on
    ? [
        ...entries,
        // Pre-select the Art. 9 basis nearly every event actually relies on,
        // rather than opening with an empty required field.
        isSpecialCategory(key)
          ? { key, specialCategoryBasis: DEFAULT_SPECIAL_CATEGORY_BASIS }
          : { key },
      ]
    : entries.filter((entry) => entry.key !== key);
}
function setSpecialBasis(
  key: PrivacyDataCategoryKey,
  value: SpecialCategoryBasisKey | null | undefined,
) {
  const entry = dataCategory(key);
  if (entry) {
    entry.specialCategoryBasis = value ?? null;
  }
}

/* Recipients */

function recipient(key: PrivacyRecipientKey) {
  return content.value.recipients?.find((entry) => entry.key === key);
}
function hasRecipient(key: PrivacyRecipientKey): boolean {
  return recipient(key) !== undefined;
}
function toggleRecipient(key: PrivacyRecipientKey, on: boolean) {
  const entries = content.value.recipients ?? [];
  content.value.recipients = on
    ? [...entries, { key }]
    : entries.filter((entry) => entry.key !== key);
}
function setRecipientName(key: PrivacyRecipientKey, value: string) {
  const entry = recipient(key);
  if (entry) {
    entry.name = value || null;
  }
}

/* Additional information */

function localeText(value: Translatable | null | undefined, loc: string) {
  if (!value) {
    return '';
  }

  return typeof value === 'string' ? value : (value[loc] ?? '');
}

const additionalForLocale = computed({
  get: () => localeText(content.value.additional, additionalLocale.value),
  set: (html: string) => {
    const current =
      !content.value.additional || typeof content.value.additional === 'string'
        ? {}
        : { ...content.value.additional };

    if (html) {
      current[additionalLocale.value] = html;
    } else {
      delete current[additionalLocale.value];
    }

    content.value.additional = Object.keys(current).length > 0 ? current : null;
  },
});

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
  const own = localesForCountries(event.value?.countries);

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
    const context = await publishEventAddendum(id, { ...content.value });
    publishedVersion.value = context.publishedVersion;
    publishedAt.value = context.publishedAt;
    // From what came back, not from what was sent: the server sanitizes the
    // free-text field, so the two are not always the same document.
    loadPublished(context.content);
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
</style>

<i18n lang="yaml" locale="en">
title: 'Privacy information'
subtitle: 'What this event adds to the privacy information of its organisation.'
baseline:
  title: 'From your organisation'
  hint: 'Published by the organisation and shown for every one of its events. This event can add to it, but never change or replace it.'
  version: 'Version {version} · {date}'
  previewHint: 'The notice as it stands today, without this event’s additions.'
  purposes: 'Why data is collected'
  dataCategories: 'What is collected'
  recipients: 'Who else receives it'
  retention: 'How long it is kept'
  retentionSentence: '{months} months {anchor}'
  none: 'Nothing listed'
  open: 'Read the full notice'
  edit: 'Edit at the organisation'
  freeText: 'Your organisation wrote its notice as free text, so nothing below can be matched against it. Read its notice before adding anything here.'
  missing:
    title: 'Your organisation has not published any privacy information yet.'
    detail: 'Until it does, registrants see no notice for this event — and nothing you add here reaches them.'
addendum:
  title: 'Additions for this event'
  hint: 'Only what is specific to this event — a particular bus company, an insurer, photos published this season. What your organisation already declares is ticked and locked.'
  hideInherited: 'Hide what the organisation covers'
  dataCategories: 'Data collected'
  recipients: 'Recipients'
  additional: 'Additional information'
  additionalHint: 'Only for this event, and not translated for you.'
  suggested: 'This event’s form appears to collect: {categories}.'
  applySuggested: 'Add these'
field:
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
</i18n>

<i18n lang="yaml" locale="de">
title: 'Datenschutzinformationen'
subtitle: 'Was diese Veranstaltung den Datenschutzinformationen ihrer Organisation hinzufügt.'
baseline:
  title: 'Von eurer Organisation'
  hint: 'Von der Organisation veröffentlicht und bei allen ihren Veranstaltungen angezeigt. Diese Veranstaltung kann sie ergänzen, aber nicht ändern oder ersetzen.'
  version: 'Version {version} · {date}'
  previewHint: 'Die Informationen im heutigen Stand, ohne die Ergänzungen dieser Veranstaltung.'
  purposes: 'Wozu die Daten erhoben werden'
  dataCategories: 'Welche Daten erhoben werden'
  recipients: 'Wer sie außerdem erhält'
  retention: 'Wie lange sie gespeichert werden'
  retentionSentence: '{months} Monate {anchor}'
  none: 'Nichts angegeben'
  open: 'Vollständige Informationen lesen'
  edit: 'Bei der Organisation bearbeiten'
  freeText: 'Eure Organisation hat die Informationen als Freitext verfasst; die Angaben unten lassen sich deshalb nicht damit abgleichen. Lies sie durch, bevor du hier etwas ergänzt.'
  missing:
    title: 'Eure Organisation hat noch keine Datenschutzinformationen veröffentlicht.'
    detail: 'Bis dahin sehen Anmeldende zu dieser Veranstaltung keine Informationen – und auch nichts, was du hier ergänzt.'
addendum:
  title: 'Ergänzungen für diese Veranstaltung'
  hint: 'Nur was für diese Veranstaltung besonders ist — ein bestimmtes Busunternehmen, eine Versicherung, in dieser Saison veröffentlichte Fotos. Was die Organisation bereits angibt, ist angehakt und gesperrt.'
  hideInherited: 'Angaben der Organisation ausblenden'
  dataCategories: 'Erhobene Daten'
  recipients: 'Empfänger'
  additional: 'Zusätzliche Informationen'
  additionalHint: 'Gilt nur für diese Veranstaltung und wird nicht automatisch übersetzt.'
  suggested: 'Das Formular dieser Veranstaltung erhebt offenbar: {categories}.'
  applySuggested: 'Hinzufügen'
field:
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
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Informations sur la protection des données'
subtitle: 'Ce que cet événement ajoute aux informations de son organisation.'
baseline:
  title: 'De votre organisation'
  hint: "Publiées par l'organisation et affichées pour tous ses événements. Cet événement peut les compléter, jamais les modifier ni les remplacer."
  version: 'Version {version} · {date}'
  previewHint: "Les informations telles qu'elles sont aujourd'hui, sans les ajouts de cet événement."
  purposes: 'Pourquoi les données sont collectées'
  dataCategories: 'Ce qui est collecté'
  recipients: 'Qui les reçoit également'
  retention: 'Combien de temps elles sont conservées'
  retentionSentence: '{months} mois {anchor}'
  none: 'Rien indiqué'
  open: 'Lire les informations complètes'
  edit: "Modifier au niveau de l'organisation"
  freeText: "Votre organisation a rédigé ses informations en texte libre ; rien ci-dessous ne peut donc y être comparé. Lisez-les avant d'ajouter quoi que ce soit ici."
  missing:
    title: "Votre organisation n'a pas encore publié d'informations sur la protection des données."
    detail: "D'ici là, les personnes qui s'inscrivent ne voient aucune information pour cet événement — ni ce que vous ajoutez ici."
addendum:
  title: 'Ajouts pour cet événement'
  hint: 'Uniquement ce qui est propre à cet événement — un transporteur précis, un assureur, des photos publiées cette saison. Ce que votre organisation déclare déjà est coché et verrouillé.'
  hideInherited: "Masquer ce que couvre l'organisation"
  dataCategories: 'Données collectées'
  recipients: 'Destinataires'
  additional: 'Informations supplémentaires'
  additionalHint: 'Valables pour cet événement uniquement, et non traduites automatiquement.'
  suggested: 'Le formulaire de cet événement semble collecter : {categories}.'
  applySuggested: 'Ajouter'
field:
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
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Informace o ochraně osobních údajů'
subtitle: 'Co tato akce doplňuje k informacím své organizace.'
baseline:
  title: 'Od vaší organizace'
  hint: 'Zveřejněno organizací a zobrazeno u všech jejích akcí. Tato akce je může doplnit, nikoli změnit nebo nahradit.'
  version: 'Verze {version} · {date}'
  previewHint: 'Informace v dnešní podobě, bez doplnění této akce.'
  purposes: 'Proč se údaje sbírají'
  dataCategories: 'Co se sbírá'
  recipients: 'Kdo je dále dostává'
  retention: 'Jak dlouho se uchovávají'
  retentionSentence: '{months} měsíců {anchor}'
  none: 'Nic uvedeno'
  open: 'Přečíst celé informace'
  edit: 'Upravit u organizace'
  freeText: 'Vaše organizace sepsala informace volným textem, položky níže s nimi proto nelze porovnat. Přečti si je, než tu něco doplníš.'
  missing:
    title: 'Vaše organizace zatím nezveřejnila žádné informace o ochraně osobních údajů.'
    detail: 'Do té doby přihlašující se u této akce nevidí žádné informace – ani to, co tu doplníš.'
addendum:
  title: 'Doplnění pro tuto akci'
  hint: 'Jen to, co je specifické pro tuto akci — konkrétní dopravce, pojišťovna, fotografie zveřejněné v této sezóně. Co organizace už uvádí, je zaškrtnuté a uzamčené.'
  hideInherited: 'Skrýt to, co pokrývá organizace'
  dataCategories: 'Sbírané údaje'
  recipients: 'Příjemci'
  additional: 'Další informace'
  additionalHint: 'Platí jen pro tuto akci a nepřekládá se automaticky.'
  suggested: 'Formulář této akce zřejmě sbírá: {categories}.'
  applySuggested: 'Přidat'
field:
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
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Informacje o ochronie danych'
subtitle: 'Co to wydarzenie dodaje do informacji swojej organizacji.'
baseline:
  title: 'Od Waszej organizacji'
  hint: 'Opublikowane przez organizację i pokazywane przy wszystkich jej wydarzeniach. To wydarzenie może je uzupełnić, ale nie zmienić ani zastąpić.'
  version: 'Wersja {version} · {date}'
  previewHint: 'Informacje w dzisiejszym kształcie, bez uzupełnień tego wydarzenia.'
  purposes: 'W jakim celu dane są zbierane'
  dataCategories: 'Co jest zbierane'
  recipients: 'Kto jeszcze je otrzymuje'
  retention: 'Jak długo są przechowywane'
  retentionSentence: '{months} miesięcy {anchor}'
  none: 'Nic nie podano'
  open: 'Przeczytaj pełne informacje'
  edit: 'Edytuj w organizacji'
  freeText: 'Wasza organizacja napisała informacje własnym tekstem, więc poniższych pozycji nie da się z nimi zestawić. Przeczytaj je, zanim coś tu dodasz.'
  missing:
    title: 'Wasza organizacja nie opublikowała jeszcze żadnych informacji o ochronie danych.'
    detail: 'Do tego czasu osoby zgłaszające się nie widzą przy tym wydarzeniu żadnych informacji – ani tego, co tu dodasz.'
addendum:
  title: 'Uzupełnienia dla tego wydarzenia'
  hint: 'Tylko to, co jest specyficzne dla tego wydarzenia — konkretny przewoźnik, ubezpieczyciel, zdjęcia publikowane w tym sezonie. To, co organizacja już podaje, jest zaznaczone i zablokowane.'
  hideInherited: 'Ukryj to, co obejmuje organizacja'
  dataCategories: 'Zbierane dane'
  recipients: 'Odbiorcy'
  additional: 'Dodatkowe informacje'
  additionalHint: 'Dotyczy tylko tego wydarzenia i nie jest tłumaczone automatycznie.'
  suggested: 'Formularz tego wydarzenia prawdopodobnie zbiera: {categories}.'
  applySuggested: 'Dodaj'
field:
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
</i18n>
