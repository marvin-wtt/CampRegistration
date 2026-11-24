<template>
  <page-state-handler
    padding
    :loading
    :error
    class="row justify-center"
  >
    <!-- Same shell as the other organization pages: a centred column rather
         than the full page width. -->
    <div
      class="privacy-shell column no-wrap col-12 col-sm-10 col-md-8 q-gutter-md"
    >
      <page-header
        :title="t('title')"
        :subtitle="t('subtitle')"
      >
        <!-- The event addendum merges on top of this, so an author needs to know
             up front that they are writing the shared part. -->
        <div class="text-caption text-on-surface-variant q-mt-xs">
          {{ t('baselineNote') }}
        </div>
      </page-header>

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

      <!-- The builder is the default because it is the only path that produces
           a notice in every language a event runs in. Free text stays available
           for anyone whose processing it cannot express, or who already has
           counsel-drafted wording. -->
      <q-card
        flat
        class="rounded-xl bg-surface-container-low"
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

        <!-- Only a guided notice cites a law (docs/privacy.md, 4): declared,
             never inferred, and offered only where there is a choice. A law
             the platform has no record of means free text. -->
        <template v-if="content.mode === 'builder'">
          <q-separator />
          <q-card-section data-test="privacy-framework">
            <template v-if="frameworkOptions.length > 1">
              <q-select
                :model-value="framework"
                :options="frameworkOptions"
                :label="t('framework.title')"
                :disable="!canEdit"
                emit-value
                map-options
                dense
                outlined
                rounded
                data-test="privacy-framework-select"
                @update:model-value="setFramework"
              />
              <div class="text-caption text-on-surface-variant q-mt-xs">
                {{ t('framework.hint') }}
              </div>
            </template>
            <div class="row items-center q-gutter-sm q-mt-xs">
              <div class="col text-caption text-on-surface-variant">
                {{
                  frameworkOptions.length > 1
                    ? t('framework.none')
                    : t('framework.single')
                }}
              </div>
              <m-btn
                v-if="canEdit"
                :label="t('framework.useFreeText')"
                color="primary"
                flat
                rounded
                dense
                data-test="privacy-framework-free-text"
                @click="content.mode = 'free_text'"
              />
            </div>
            <div
              v-if="record?.baseline"
              class="text-caption text-warning q-mt-sm"
              data-test="privacy-framework-warning"
            >
              {{ t('framework.warning', { baseline: to(record.baseline) }) }}
            </div>
          </q-card-section>
        </template>
      </q-card>

      <!-- Free text -->
      <q-card
        v-if="content.mode === 'free_text'"
        flat
        class="rounded-xl bg-surface-container-low"
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
          <locale-tabs
            v-model="freeTextLocale"
            :filled="filledFreeTextLocales"
            add-languages
            @remove="clearFreeText"
          />
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
        header-nav
        color="primary"
        keep-alive
        class="privacy-stepper rounded-xl bg-surface-container-low"
      >
        <!-- 1 -->
        <q-step
          :name="1"
          :title="t('step.controller.title')"
          :caption="sectionCaption('controller', t('step.controller.caption'))"
          icon="badge"
          header-nav
          :error="shownGaps('controller').length > 0"
          :done="step > 1 && sectionGaps('controller').length === 0"
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

          <privacy-dpo-fields
            v-model="content.dpo"
            :can-edit
            class="q-mt-md"
          />
          <privacy-authority-fields
            v-if="needsEnteredAuthority(content)"
            v-model="content.supervisoryAuthority"
            :can-edit
            :hint="record?.authorityHint ? to(record.authorityHint) : ''"
            class="q-mt-md"
          />
          <q-stepper-navigation>
            <m-btn
              :label="t('action.next')"
              color="primary"
              @click="step = 2"
            />
          </q-stepper-navigation>
        </q-step>

        <!-- 2: purposes first — ticking one pre-selects its usual data and
             recipients, which the next two steps then only adjust. -->
        <q-step
          :name="2"
          :title="t('step.purposes.title')"
          :caption="sectionCaption('purposes', t('step.purposes.caption'))"
          icon="checklist"
          header-nav
          :error="shownGaps('purposes').length > 0"
          :done="step > 2 && sectionGaps('purposes').length === 0"
        >
          <p class="text-body2">{{ t('step.purposes.hint') }}</p>

          <privacy-entry-list>
            <privacy-entry-row
              v-for="key in purposeKeys"
              :key="key"
              :label="gt(`privacy.purpose.${key}`)"
              :selected="hasPurpose(key)"
              :disable="!canEdit"
              @update:selected="(on) => togglePurpose(key, on)"
            >
              <template
                v-if="purpose(key)"
                #actions
              >
                <all-events-toggle
                  :model-value="purpose(key)?.allEvents === true"
                  :disable="!canEdit"
                  @update:model-value="(v) => setAllEvents(purpose(key), v)"
                />
              </template>
              <template
                v-if="purpose(key)"
                #default
              >
                <q-select
                  :model-value="purpose(key)?.legalBasis"
                  :options="legalBasisOptions"
                  :label="t('field.legalBasis')"
                  emit-value
                  map-options
                  dense
                  outlined
                  rounded
                  :disable="!canEdit"
                  @update:model-value="(v) => setLegalBasis(key, v)"
                />
                <div
                  v-if="legalBasisCaution(purpose(key)?.legalBasis)"
                  class="text-caption text-warning q-mt-xs"
                  data-test="privacy-basis-caution"
                >
                  {{ legalBasisCaution(purpose(key)?.legalBasis) }}
                </div>
                <translated-input
                  v-if="purpose(key)?.legalBasis === 'legitimate_interests'"
                  :model-value="purpose(key)?.legitimateInterest"
                  :label="t('field.legitimateInterest')"
                  :locales
                  add-languages
                  always
                  dense
                  outlined
                  rounded
                  :disable="!canEdit"
                  class="q-mt-xs"
                  @update:model-value="(v) => setLegitimateInterest(key, v)"
                />
                <div
                  v-if="purpose(key)?.legalBasis === 'consent'"
                  class="text-caption text-on-surface-variant q-mt-xs"
                >
                  {{
                    gt('privacy.editor.field.consentQuestion', {
                      citation: cite('freelyGiven'),
                    })
                  }}
                </div>
              </template>
            </privacy-entry-row>
          </privacy-entry-list>

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
                    add-languages
                    default-untranslated
                    dense
                    outlined
                    rounded
                    hide-bottom-space
                    :disable="!canEdit"
                    class="col"
                    @update:model-value="(v) => setEntryLabel(entry, v)"
                  />
                  <all-events-toggle
                    :model-value="entry.allEvents === true"
                    :disable="!canEdit"
                    @update:model-value="(v) => setAllEvents(entry, v)"
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
                  rounded
                  :disable="!canEdit"
                />
                <div
                  v-if="legalBasisCaution(entry.legalBasis)"
                  class="text-caption text-warning q-mt-xs"
                >
                  {{ legalBasisCaution(entry.legalBasis) }}
                </div>
                <translated-input
                  v-if="entry.legalBasis === 'legitimate_interests'"
                  :model-value="entry.legitimateInterest"
                  :label="t('field.legitimateInterest')"
                  :locales
                  add-languages
                  always
                  dense
                  outlined
                  rounded
                  :disable="!canEdit"
                  @update:model-value="
                    (v) => (entry.legitimateInterest = asTranslatable(v))
                  "
                />
                <div
                  v-if="entry.legalBasis === 'consent'"
                  class="text-caption text-on-surface-variant"
                >
                  {{
                    gt('privacy.editor.field.consentQuestion', {
                      citation: cite('freelyGiven'),
                    })
                  }}
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
          :title="t('step.data.title')"
          :caption="sectionCaption('data', t('step.data.caption'))"
          icon="inventory_2"
          header-nav
          :error="shownGaps('data').length > 0"
          :done="step > 3 && sectionGaps('data').length === 0"
        >
          <p class="text-body2">{{ t('step.data.hint') }}</p>

          <div
            v-for="group in categoryGroups"
            :key="group.key"
            class="q-mb-md"
          >
            <div class="text-body2 text-weight-medium">
              {{
                group.key === 'special'
                  ? withCitation(t('group.special.title'), 'specialCategories')
                  : t(`group.${group.key}.title`)
              }}
            </div>
            <div class="text-caption text-on-surface-variant q-mb-sm">
              {{ t(`group.${group.key}.hint`) }}
            </div>
            <privacy-entry-list>
              <privacy-entry-row
                v-for="key in group.keys"
                :key="key"
                :label="gt(`privacy.dataCategory.${key}`)"
                :selected="hasDataCategory(key)"
                :disable="!canEdit"
                @update:selected="(on) => toggleDataCategory(key, on)"
              >
                <template
                  v-if="dataCategory(key)"
                  #actions
                >
                  <all-events-toggle
                    :model-value="dataCategory(key)?.allEvents === true"
                    :disable="!canEdit"
                    @update:model-value="
                      (v) => setAllEvents(dataCategory(key), v)
                    "
                  />
                </template>
                <template
                  v-if="hasDataCategory(key) && hasCategoryDetails(key)"
                  #default
                >
                  <special-category-basis-field
                    v-if="isSpecialCategory(key)"
                    :model-value="dataCategory(key)?.specialCategoryBasis"
                    :legal-reference="dataCategory(key)?.legalReference"
                    :can-edit="canEdit"
                    :locales
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
            </privacy-entry-list>
          </div>

          <!-- Anything the catalogue is deliberately too coarse for. Set apart
               from the lists above, because these are the entries the
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
                  <translated-input
                    :model-value="entry.label"
                    :label="t('field.customCategoryName')"
                    :locales
                    add-languages
                    default-untranslated
                    dense
                    outlined
                    rounded
                    hide-bottom-space
                    :disable="!canEdit"
                    class="col"
                    @update:model-value="(v) => setEntryLabel(entry, v)"
                  />
                  <all-events-toggle
                    :model-value="entry.allEvents === true"
                    :disable="!canEdit"
                    @update:model-value="(v) => setAllEvents(entry, v)"
                  />
                  <m-btn
                    flat
                    round
                    dense
                    icon="delete"
                    :aria-label="t('action.remove')"
                    :disable="!canEdit"
                    @click="removeDataCategory(entry.key)"
                  />
                </div>

                <q-checkbox
                  :model-value="entry.special === true"
                  :label="
                    withCitation(
                      t('field.customCategorySpecial'),
                      'specialCategories',
                    )
                  "
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

                <special-category-basis-field
                  v-if="entry.special"
                  v-model="entry.specialCategoryBasis"
                  v-model:legal-reference="entry.legalReference"
                  :can-edit="canEdit"
                  :locales
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
          :error="shownGaps('recipients').length > 0"
          :done="step > 4 && sectionGaps('recipients').length === 0"
        >
          <p class="text-body2">{{ t('step.recipients.hint') }}</p>

          <privacy-entry-list>
            <privacy-entry-row
              v-for="key in recipientKeys"
              :key="key"
              :label="gt(`privacy.recipient.${key}`)"
              :caption="
                isAlwaysRecipient(key) ? t('field.recipientAlways') : null
              "
              :selected="hasRecipient(key)"
              :locked="isAlwaysRecipient(key)"
              :disable="!canEdit"
              @update:selected="(on) => toggleRecipient(key, on)"
            >
              <template
                v-if="recipient(key) && !isAlwaysRecipient(key)"
                #actions
              >
                <all-events-toggle
                  :model-value="recipient(key)?.allEvents === true"
                  :disable="!canEdit"
                  @update:model-value="(v) => setAllEvents(recipient(key), v)"
                />
              </template>
              <!-- No name to ask for: the event team is the author's own, and
                   the platform is this one, whose name we already know. -->
              <template
                v-if="hasRecipient(key) && !isAlwaysRecipient(key)"
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
                  @update:model-value="(v) => setRecipientName(key, String(v))"
                />
              </template>
            </privacy-entry-row>
          </privacy-entry-list>

          <!-- Anyone the catalogue has no word for: a school, a sports club, a
               venue's security. Named per locale, like custom categories. -->
          <div class="q-mt-lg">
            <div class="text-body2 text-weight-medium">
              {{ t('custom.recipient.title') }}
            </div>
            <div class="text-caption text-on-surface-variant q-mb-sm">
              {{ t('custom.recipient.hint') }}
            </div>

            <q-card
              v-for="entry in customRecipients"
              :key="entry.key"
              flat
              bordered
              class="inset-card q-mb-sm"
            >
              <q-card-section class="q-pa-sm">
                <div class="row items-center no-wrap q-gutter-sm">
                  <translated-input
                    :model-value="entry.label"
                    :label="t('field.customRecipientName')"
                    :locales
                    add-languages
                    default-untranslated
                    dense
                    outlined
                    rounded
                    hide-bottom-space
                    :disable="!canEdit"
                    class="col"
                    @update:model-value="(v) => setEntryLabel(entry, v)"
                  />
                  <all-events-toggle
                    :model-value="entry.allEvents === true"
                    :disable="!canEdit"
                    @update:model-value="(v) => setAllEvents(entry, v)"
                  />
                  <m-btn
                    flat
                    round
                    dense
                    icon="delete"
                    :aria-label="t('action.remove')"
                    :disable="!canEdit"
                    @click="removeRecipient(entry.key)"
                  />
                </div>
              </q-card-section>
            </q-card>

            <m-btn
              :label="t('action.addRecipient')"
              icon="add"
              outline
              color="primary"
              :disable="!canEdit"
              @click="addCustomRecipient"
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
          :error="shownGaps('retention').length > 0"
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

          <locale-tabs
            v-model="additionalLocale"
            :filled="filledAdditionalLocales"
            add-languages
            @remove="clearAdditional"
          />
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
      </privacy-publish-card>
    </div>

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
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import {
  PRIVACY_DATA_CATEGORY_KEYS,
  PRIVACY_PURPOSE_KEYS,
  PRIVACY_PURPOSE_PRESETS,
  PRIVACY_RECIPIENT_KEYS,
  DEFAULT_SPECIAL_CATEGORY_BASIS,
  ALWAYS_RECIPIENT_KEYS,
  composePrivacyNotice,
  frameworkRecord,
  frameworksFor,
  needsEnteredAuthority,
  noticeSupervisoryAuthority,
  presetLegalBasis,
  noticeFramework,
  nextCustomKey,
  emptyPrivacyNoticeContent,
  gapsInSection,
  isCustomKey,
  isAdvisorySpecialCategory,
  isAlwaysRecipient,
  isSpecialCategory,
  requiresConsentQuestion,
  privacyNoticeCompleteness,
  type DataProtectionFramework,
  type LegalBasisKey,
  type PrivacyDataCategoryEntry,
  type PrivacyDataCategoryKey,
  type PrivacyNoticeContent,
  type PrivacyNoticeSection,
  type PrivacyPurposeEntry,
  type PrivacyPurposeKey,
  type PrivacyPurposeRef,
  type PrivacyRecipientEntry,
  type PublishedPrivacyNotice,
} from '@camp-registration/common/privacy';
import type { Translatable } from '@camp-registration/common/entities';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import RichTextEditor from '@/components/common/inputs/RichTextEditor.vue';
import TranslatedInput from '@/components/common/inputs/TranslatedInput.vue';
import LocaleTabs from '@/components/common/localization/LocaleTabs.vue';
import AllEventsToggle from '@/components/privacy/AllEventsToggle.vue';
import PrivacyCategoryNotes from '@/components/privacy/PrivacyCategoryNotes.vue';
import PrivacyEntryList from '@/components/privacy/PrivacyEntryList.vue';
import PrivacyEntryRow from '@/components/privacy/PrivacyEntryRow.vue';
import PrivacyPreviewDialog from '@/components/privacy/PrivacyPreviewDialog.vue';
import PrivacyPublishCard from '@/components/privacy/PrivacyPublishCard.vue';
import SpecialCategoryBasisField from '@/components/privacy/SpecialCategoryBasisField.vue';
import PrivacyRetentionStep from '@/components/organization/privacy/PrivacyRetentionStep.vue';
import PrivacyDpoFields from '@/components/organization/privacy/PrivacyDpoFields.vue';
import PrivacyAuthorityFields from '@/components/organization/privacy/PrivacyAuthorityFields.vue';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { usePrivacyNoticeService } from '@/services/PrivacyNoticeService';
import { useOrganizationDetailsStore } from '@/stores/organization-details-store';
import { useOrganizationPermissions } from '@/composables/organizationPermissions';
import { useErrorExtractor } from '@/composables/errorText';
import { useNotifier } from '@/composables/notifier';
import { usePrivacyEntryEditor } from '@/composables/privacyEntryEditor';
import {
  providePrivacyFramework,
  usePrivacyLabels,
} from '@/composables/privacyLabels';
import {
  localeText,
  useLocaleTextModel,
  withLocaleText,
} from '@/composables/localeText';
import { countryName } from '@/utils/countries';
import { APP_LOCALES as locales } from '@/i18n/locales';

const { t } = useI18n();
const { t: gt, locale: uiLocale } = useI18n({ useScope: 'global' });
const route = useRoute();
const quasar = useQuasar();
const router = useRouter();
const organizationStore = useOrganizationDetailsStore();
const { data: organization } = storeToRefs(organizationStore);
const { canAccessOrg } = useOrganizationPermissions();
const { extractErrorText } = useErrorExtractor();
const notifier = useNotifier();
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

const {
  dataCategory,
  hasDataCategory,
  addDataCategory,
  removeDataCategory,
  toggleDataCategory,
  setSpecialBasis,
  setLegalReference,
  recipient,
  hasRecipient,
  addRecipient,
  removeRecipient,
  toggleRecipient,
  setRecipientName,
} = usePrivacyEntryEditor(content);
// The controls on this page cite the law the notice is written under.
const noticeLaw = () => content.value;
providePrivacyFramework(noticeLaw);
const { legalBasisOptions, cite, withCitation, legalBasisCaution, record } =
  usePrivacyLabels(noticeLaw);
const { to } = useObjectTranslation();

const additionalForLocale = useLocaleTextModel(
  {
    get: () => content.value.additional,
    set: (value) => (content.value.additional = value),
  },
  additionalLocale,
);
const freeTextForLocale = useLocaleTextModel(
  {
    get: () => content.value.freeText,
    set: (value) => (content.value.freeText = value),
  },
  freeTextLocale,
);

const hasUnpublishedChanges = computed(
  () => JSON.stringify(content.value) !== publishedSnapshot.value,
);

// Special categories apart: they are the ones that need an Art. 9 basis.
const categoryGroups = [
  {
    key: 'general',
    keys: PRIVACY_DATA_CATEGORY_KEYS.filter((key) => !isSpecialCategory(key)),
  },
  {
    key: 'special',
    keys: PRIVACY_DATA_CATEGORY_KEYS.filter((key) => isSpecialCategory(key)),
  },
] as const;

function hasCategoryDetails(key: PrivacyDataCategoryKey): boolean {
  return (
    isSpecialCategory(key) ||
    isAdvisorySpecialCategory(key) ||
    requiresConsentQuestion(key)
  );
}
const purposeKeys = PRIVACY_PURPOSE_KEYS;
const recipientKeys = PRIVACY_RECIPIENT_KEYS;

const organizationId = computed<string>(
  () => route.params.organizationId as string,
);
const canEdit = computed<boolean>(() => canAccessOrg('organization.edit'));

// The locales its events are offered in: every translated text needs each.
const requiredLocales = ref<string[]>([]);

const completeness = computed(() =>
  privacyNoticeCompleteness(content.value, { locales: requiredLocales.value }),
);

void loadNotice();

async function loadNotice() {
  try {
    const notice = await fetchOrganizationNotice(organizationId.value);
    // Replace rather than merge: `content` is a ref now, and Object.assign on
    // the ref itself silently wrote past `.value` and dropped the fetch.
    content.value = { ...emptyPrivacyNoticeContent(), ...notice.content };
    publishedAt.value = notice.publishedAt;
    publishedVersion.value = notice.publishedVersion;
    requiredLocales.value = notice.requiredLocales;
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
}

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
  controller: 1,
  purposes: 2,
  data: 3,
  recipients: 4,
  retention: 5,
  free_text: 0,
};

/**
 * A section's gaps as the stepper shows them: once the author has moved past
 * its step, and not while they are on it, filling it in.
 */
function shownGaps(section: PrivacyNoticeSection) {
  const at = SECTION_STEPS[section];

  return step.value !== at && hasVisitedBeyond(at) ? sectionGaps(section) : [];
}

function sectionCaption(section: PrivacyNoticeSection, fallback: string) {
  const gaps = shownGaps(section);

  return gaps.length > 0
    ? gaps.map((gap) => gt(`privacy.gap.${gap}`)).join(' · ')
    : fallback;
}

const framework = computed<DataProtectionFramework>(() =>
  noticeFramework(content.value),
);

// A church law is offered only where it applies; the current value stays
// listed should the organization's country change.
const frameworkOptions = computed(() => {
  const available = frameworksFor(organization.value?.country ?? '');
  const values = available.includes(framework.value)
    ? available
    : [...available, framework.value];
  return values.map((value) => {
    const name = frameworkRecord(value)?.name;
    return { value, label: name ? to(name) : t(`framework.${value}`) };
  });
});

function setFramework(value: DataProtectionFramework) {
  content.value.framework = value;
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
 * The draft as a registrant would read it. Composed against no event addendum:
 * this is the organization's own notice, and a event only ever adds to it.
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
    supervisoryAuthority: noticeSupervisoryAuthority(
      content.value,
      org.country,
    ),
    notice: composePrivacyNotice({ ...content.value }),
    organizationVersion: publishedVersion.value,
    eventVersion: null,
  };
});

function asTranslatable(value: unknown): Translatable | null {
  return (value ?? null) as Translatable | null;
}

/* Data categories */

const customCategories = computed(() =>
  content.value.dataCategories.filter((entry) => isCustomKey(entry.key)),
);

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
  entry: PrivacyDataCategoryEntry | PrivacyPurposeEntry | PrivacyRecipientEntry,
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
 * of the catalogue is that the common event is a handful of checkboxes. They
 * stay editable, and unticking never removes them again: they may have been
 * confirmed for a reason the preset does not know.
 */
function togglePurpose(key: PrivacyPurposeKey, on: boolean) {
  if (!on) {
    removePurpose(key);
    return;
  }

  const preset = PRIVACY_PURPOSE_PRESETS[key];
  // A basis the law attaches conditions to is left for the author to choose.
  content.value.purposes.push({
    key,
    legalBasis: presetLegalBasis(preset.legalBasis, framework.value),
  });
  preset.dataCategories.forEach(addDataCategory);
  preset.recipients.forEach(addRecipient);
}
function removePurpose(key: PrivacyPurposeRef) {
  content.value.purposes = content.value.purposes.filter(
    (entry) => entry.key !== key,
  );
}
function setLegalBasis(key: PrivacyPurposeRef, value: LegalBasisKey | null) {
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

/**
 * Marks an entry as part of every event's notice, so no event can exclude it.
 * Left off the entry rather than stored as false.
 */
function setAllEvents(
  entry: { allEvents?: boolean | null } | undefined,
  on: boolean,
) {
  if (!entry) {
    return;
  }
  if (on) {
    entry.allEvents = true;
  } else {
    delete entry.allEvents;
  }
}

const customRecipients = computed(() =>
  content.value.recipients.filter((entry) => isCustomKey(entry.key)),
);

function addCustomRecipient() {
  content.value.recipients.push({
    key: nextCustomKey(content.value.recipients),
    label: null,
  });
}
/* Retention */

/* Free text and the builder's own free-text section */

// The rich-text editor edits one locale at a time; the stored value stays a
// per-locale record so a notice can be read in every language a event runs in.
// Art. 12 wants the notice in a language the reader understands, and nothing
// translates free text for the organization — so name what is still missing.
const filledFreeTextLocales = computed(() =>
  locales.filter((loc) => localeText(content.value.freeText, loc).trim()),
);
const missingFreeTextLocales = computed(() =>
  locales.filter((loc) => !filledFreeTextLocales.value.includes(loc)),
);
const filledAdditionalLocales = computed(() =>
  locales.filter((loc) => localeText(content.value.additional, loc).trim()),
);

function clearFreeText(loc: string) {
  content.value.freeText = withLocaleText(content.value.freeText, loc, '');
}

function clearAdditional(loc: string) {
  content.value.additional = withLocaleText(content.value.additional, loc, '');
}

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

    // A draft's first notice submits it for review on the server.
    if (organization.value?.verificationStatus === 'DRAFT') {
      void organizationStore.reload();
      quasar.notify({
        type: 'positive',
        message: t('notify.submitted'),
        timeout: 8000,
        multiLine: true,
      });
    }

    // Publishing lifts the blocker that refuses verification, but nothing puts
    // a rejected organization back into the queue on its own.
    if (organization.value?.verificationStatus === 'REJECTED') {
      quasar.notify({
        type: 'info',
        message: t('notify.rejected'),
        timeout: 8000,
        multiLine: true,
        actions: [
          {
            label: t('notify.rejectedAction'),
            noCaps: true,
            handler: () => {
              void router.push({ name: 'management.organization.dashboard' });
            },
          },
        ],
      });
    }
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

  // Rounded like the card, so the hover highlight doesn't cut a square into it.
  :deep(.q-stepper__tab) {
    border-radius: 12px;
  }

  // Quasar gives a step's content no top padding: the first outlined field's
  // floating label would touch the highlighted header above it.
  :deep(.q-stepper__step-inner) {
    padding-top: 12px;
  }
}
</style>

<i18n lang="yaml" locale="en">
title: 'Privacy information'
subtitle: 'What happens to the data collected when someone registers.'
baselineNote: 'This is the baseline for every event your organisation runs. Individual events can add to it and adjust it where they differ, but not replace it.'
framework:
  title: 'Data protection law'
  hint: 'The law your organisation is subject to. You decide this as the controller.'
  none: 'None of these applies to your organisation? Write the notice as free text instead.'
  single: 'The guided notice is written under the GDPR. If another data protection law applies to your organisation, write the notice as free text instead.'
  useFreeText: 'Use free text'
  gdpr: 'The GDPR'
  warning: 'Check that this law applies to your organisation, that the version in force for you matches the one cited here ({baseline}), and whether your diocese or regional church deviates from it. If it does, write the notice as free text instead.'
mode:
  title: 'How do you want to write this?'
  builder: 'Guided — pick from prepared wording (translated into all languages for you)'
  freeText: 'Free text — write the whole notice yourself'
  freeTextWarning: 'You write the whole notice yourself, in every language your events run in. Nothing is translated or filled in for you, and your text is published exactly as you write it.'
freeText:
  title: 'Your privacy notice'
  hint: 'Your text is the whole notice: nothing is added for you. Include the data subjects’ rights, the right to lodge a complaint and the competent supervisory authority yourself.'
  placeholder: 'Write your privacy notice…'
  missingLocales: 'Not written yet in: {locales}'
step:
  controller:
    title: 'Who you are'
    caption: 'Your organisation and data protection officer'
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
    title: 'How long you keep it, and where it goes'
    caption: 'Retention periods, transfers outside the EEA, automated decisions'
  additional:
    title: 'Anything else'
    caption: 'Optional free text'
    hint: 'Only for processing the options above cannot describe. Text you write here is not translated for you.'
custom:
  recipient:
    title: 'Someone else?'
    hint: 'Add a recipient the list above does not cover — a school, a sports club, a venue’s security.'
  category:
    title: 'Something else?'
    hint: 'Add a category the list above does not cover. Keep it at the level of a category, not a single form field.'
  purpose:
    title: 'Something else?'
    hint: 'Add a purpose the list above does not cover.'
field:
  customRecipientName: 'Recipient'
  customCategoryName: 'Name of the category'
  customCategorySpecial: 'Sensitive'
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
  addRecipient: 'Add a recipient'
  next: 'Continue'
  back: 'Back'
  addCategory: 'Add another category'
  addPurpose: 'Add another purpose'
  remove: 'Remove'
notify:
  submitted: 'Published. The organization has been submitted for verification.'
  rejected: 'Published. This organization is still rejected — publishing alone does not request a new review.'
  rejectedAction: 'Overview'
  publishFailed: 'Publishing failed'
group:
  general:
    title: 'General data'
    hint: 'Everyday details a registration needs.'
  special:
    title: 'Special categories'
    hint: 'Health, religion and the like need an extra legal basis — usually a consent question in the form.'
readOnly: 'You can view this privacy information but not change it. Administrators of the organization can.'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Datenschutzinformationen'
subtitle: 'Was mit den Daten geschieht, die bei einer Anmeldung erhoben werden.'
baselineNote: 'Diese Angaben gelten für alle Veranstaltungen der Organisation. Einzelne Veranstaltungen können sie ergänzen und dort anpassen, wo sie abweichen – ersetzen können sie sie nicht.'
framework:
  title: 'Datenschutzrecht'
  hint: 'Das Recht, dem deine Organisation unterliegt. Das entscheidet deine Organisation als Verantwortliche.'
  none: 'Keines davon gilt für deine Organisation? Schreib die Informationen stattdessen als Freitext.'
  single: 'Die geführten Informationen beruhen auf der DSGVO. Gilt für deine Organisation ein anderes Datenschutzrecht, schreib sie stattdessen als Freitext.'
  useFreeText: 'Freitext verwenden'
  gdpr: 'Die DSGVO'
  warning: 'Prüfe, ob dieses Recht für deine Organisation gilt, ob die für dich geltende Fassung der hier zitierten entspricht ({baseline}) und ob dein Bistum oder deine Landeskirche davon abweicht. Falls ja, schreib die Informationen stattdessen als Freitext.'
mode:
  title: 'Wie sollen die Informationen entstehen?'
  builder: 'Geführt – vorformulierte Textbausteine auswählen, automatisch in alle Sprachen übersetzt'
  freeText: 'Freitext – alles selbst formulieren'
  freeTextWarning: 'Du verfasst die gesamten Informationen selbst – in jeder Sprache, in der die Veranstaltungen stattfinden. Nichts wird übersetzt oder ergänzt, und der Text wird genau so veröffentlicht, wie du ihn schreibst.'
freeText:
  title: 'Datenschutzinformationen'
  hint: 'Dein Text ist die gesamte Information: Es wird nichts ergänzt. Nenne die Betroffenenrechte, das Beschwerderecht und die zuständige Aufsichtsbehörde selbst.'
  placeholder: 'Datenschutzinformationen verfassen…'
  missingLocales: 'Noch nicht verfasst in: {locales}'
step:
  controller:
    title: 'Verantwortliche Stelle'
    caption: 'Organisation und Datenschutzbeauftragte Person'
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
    title: 'Speicherdauer und Übermittlung'
    caption: 'Löschfristen, Übermittlung außerhalb des EWR, automatisierte Entscheidungen'
  additional:
    title: 'Sonstiges'
    caption: 'Optionaler Freitext'
    hint: 'Nur für Verarbeitungen, die sich mit den Optionen oben nicht beschreiben lassen. Hier eingegebener Text wird nicht automatisch übersetzt.'
custom:
  recipient:
    title: 'Jemand anderes?'
    hint: 'Ergänze einen Empfänger, den die Liste oben nicht abdeckt – eine Schule, einen Sportverein, den Sicherheitsdienst einer Unterkunft.'
  category:
    title: 'Etwas anderes?'
    hint: 'Ergänze eine Kategorie, die in der Liste oben fehlt. Beschreibe dabei eine Kategorie, nicht ein einzelnes Formularfeld.'
  purpose:
    title: 'Etwas anderes?'
    hint: 'Ergänze einen Zweck, der in der Liste oben fehlt.'
field:
  customRecipientName: 'Empfänger'
  customCategoryName: 'Bezeichnung der Kategorie'
  customCategorySpecial: 'Besondere Kategorie'
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
  addRecipient: 'Empfänger hinzufügen'
  next: 'Weiter'
  back: 'Zurück'
  addCategory: 'Weitere Kategorie hinzufügen'
  addPurpose: 'Weiteren Zweck hinzufügen'
  remove: 'Entfernen'
notify:
  submitted: 'Veröffentlicht. Die Organisation wurde zur Verifizierung eingereicht.'
  rejected: 'Veröffentlicht. Diese Organisation ist weiterhin abgelehnt – das Veröffentlichen allein fordert keine neue Prüfung an.'
  rejectedAction: 'Übersicht'
  publishFailed: 'Veröffentlichen fehlgeschlagen'
group:
  general:
    title: 'Allgemeine Daten'
    hint: 'Alltägliche Angaben, die eine Anmeldung braucht.'
  special:
    title: 'Besondere Kategorien'
    hint: 'Gesundheit, Religion und Ähnliches brauchen eine zusätzliche Rechtsgrundlage – meist eine Einwilligungsfrage im Formular.'
readOnly: 'Du kannst diese Datenschutzinformationen ansehen, aber nicht ändern. Das können Administrator:innen der Organisation.'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Informations sur la protection des données'
subtitle: "Ce qu'il advient des données recueillies lors d'une inscription."
baselineNote: "Ces informations valent pour tous les événements de l'organisation. Chaque événement peut les compléter et les ajuster là où il diffère, mais pas les remplacer."
framework:
  title: 'Droit de la protection des données'
  hint: 'Le droit auquel votre organisation est soumise. C’est à vous d’en décider en tant que responsable de traitement.'
  none: 'Aucun ne s’applique à votre organisation ? Rédigez plutôt les informations en texte libre.'
  single: 'Les informations guidées reposent sur le RGPD. Si un autre droit de la protection des données s’applique à votre organisation, rédigez-les plutôt en texte libre.'
  useFreeText: 'Utiliser le texte libre'
  gdpr: 'Le RGPD'
  warning: 'Vérifiez que ce droit s’applique à votre organisation, que la version en vigueur pour vous correspond à celle citée ici ({baseline}) et si votre diocèse ou votre Église régionale s’en écarte. Si c’est le cas, rédigez plutôt les informations en texte libre.'
mode:
  title: 'Comment souhaitez-vous rédiger ces informations ?'
  builder: 'Guidé – choisir des formulations préétablies, traduites automatiquement dans toutes les langues'
  freeText: 'Texte libre – tout rédiger vous-même'
  freeTextWarning: "Vous rédigez l'intégralité des informations vous-même, dans chaque langue de vos événements. Rien n'est traduit ni complété pour vous, et votre texte est publié tel que vous l'écrivez."
freeText:
  title: 'Vos informations sur la protection des données'
  hint: 'Votre texte constitue l’intégralité des informations : rien n’est ajouté. Indiquez vous-même les droits des personnes concernées, le droit de réclamation et l’autorité de contrôle compétente.'
  placeholder: 'Rédigez vos informations…'
  missingLocales: 'Pas encore rédigé en : {locales}'
step:
  controller:
    title: 'Qui vous êtes'
    caption: 'Votre organisation et le délégué à la protection des données'
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
    title: 'Durée de conservation et transferts'
    caption: 'Durées, transferts hors de l’EEE, décisions automatisées'
  additional:
    title: 'Autres informations'
    caption: 'Texte libre facultatif'
    hint: "Uniquement pour les traitements que les options ci-dessus ne peuvent décrire. Le texte saisi ici n'est pas traduit automatiquement."
custom:
  recipient:
    title: 'Quelqu’un d’autre ?'
    hint: 'Ajoute un destinataire que la liste ci-dessus ne couvre pas – une école, un club sportif, la sécurité d’un lieu.'
  category:
    title: 'Autre chose ?'
    hint: "Ajoutez une catégorie que la liste ci-dessus ne couvre pas. Restez au niveau d'une catégorie, pas d'un champ de formulaire."
  purpose:
    title: 'Autre chose ?'
    hint: 'Ajoutez une finalité que la liste ci-dessus ne couvre pas.'
field:
  customRecipientName: 'Destinataire'
  customCategoryName: 'Nom de la catégorie'
  customCategorySpecial: 'Donnée sensible'
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
  addRecipient: 'Ajouter un destinataire'
  next: 'Continuer'
  back: 'Retour'
  addCategory: 'Ajouter une catégorie'
  addPurpose: 'Ajouter une finalité'
  remove: 'Supprimer'
notify:
  submitted: "Publiée. L'organisation a été soumise à la vérification."
  rejected: 'Publié. Cette organisation reste refusée : la publication seule ne demande pas de nouvelle vérification.'
  rejectedAction: 'Aperçu'
  publishFailed: 'Échec de la publication'
group:
  general:
    title: 'Données générales'
    hint: 'Les informations courantes dont une inscription a besoin.'
  special:
    title: 'Catégories particulières'
    hint: 'La santé, la religion et similaires exigent une base juridique supplémentaire – le plus souvent une question de consentement dans le formulaire.'
readOnly: "Tu peux consulter ces informations sur la protection des données, mais pas les modifier. Les administrateurs de l'organisation le peuvent."
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Informace o ochraně osobních údajů'
subtitle: 'Co se děje s údaji, které se získávají při přihlášení.'
baselineNote: 'Tyto údaje platí pro všechny akce organizace. Jednotlivé akce je mohou doplnit a upravit tam, kde se liší, ale nemohou je nahradit.'
framework:
  title: 'Právo na ochranu osobních údajů'
  hint: 'Právo, kterému tvá organizace podléhá. O tom rozhoduje organizace jako správce.'
  none: 'Žádné z nich se na tvou organizaci nevztahuje? Sepiš informace raději jako volný text.'
  single: 'Informace s průvodcem vycházejí z GDPR. Pokud se na tvou organizaci vztahuje jiné právo na ochranu osobních údajů, sepiš je raději jako volný text.'
  useFreeText: 'Použít volný text'
  gdpr: 'GDPR'
  warning: 'Ověř, že se toto právo na tvou organizaci vztahuje, že pro tebe platné znění odpovídá zde citovanému ({baseline}) a zda se od něj tvá diecéze nebo zemská církev neodchyluje. Pokud ano, sepiš informace raději jako volný text.'
mode:
  title: 'Jak to chcete sepsat?'
  builder: 'S průvodcem – vybrat z připravených formulací, automaticky přeložených do všech jazyků'
  freeText: 'Volný text – sepsat vše sami'
  freeTextWarning: 'Veškeré informace sepisuješ ty – v každém jazyce, ve kterém pořádáte akce. Nic se nepřekládá ani nedoplňuje a text se zveřejní přesně tak, jak ho napíšeš.'
freeText:
  title: 'Vaše informace o ochraně osobních údajů'
  hint: 'Tvůj text je celou informací: nic se nedoplňuje. Uveď sám práva subjektů údajů, právo podat stížnost a příslušný dozorový úřad.'
  placeholder: 'Sepiš informace o ochraně osobních údajů…'
  missingLocales: 'Zatím nesepsáno v: {locales}'
step:
  controller:
    title: 'Kdo jste'
    caption: 'Vaše organizace a pověřenec'
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
    title: 'Doba uchování a předávání'
    caption: 'Lhůty, předávání mimo EHP, automatizovaná rozhodnutí'
  additional:
    title: 'Cokoli dalšího'
    caption: 'Volitelný volný text'
    hint: 'Jen pro zpracování, které volbami výše popsat nelze. Zde zadaný text se automaticky nepřekládá.'
custom:
  recipient:
    title: 'Někdo jiný?'
    hint: 'Doplň příjemce, kterého seznam výše nepokrývá – školu, sportovní klub, ostrahu ubytování.'
  category:
    title: 'Něco dalšího?'
    hint: 'Přidej kategorii, kterou seznam výše nepokrývá. Zůstaň na úrovni kategorie, ne jednotlivého pole formuláře.'
  purpose:
    title: 'Něco dalšího?'
    hint: 'Přidej účel, který seznam výše nepokrývá.'
field:
  customRecipientName: 'Příjemce'
  customCategoryName: 'Název kategorie'
  customCategorySpecial: 'Citlivý údaj'
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
  addRecipient: 'Přidat příjemce'
  next: 'Pokračovat'
  back: 'Zpět'
  addCategory: 'Přidat další kategorii'
  addPurpose: 'Přidat další účel'
  remove: 'Odebrat'
notify:
  submitted: 'Zveřejněno. Organizace byla odeslána k ověření.'
  rejected: 'Zveřejněno. Tato organizace je stále zamítnutá — samotné zveřejnění o nové ověření nežádá.'
  rejectedAction: 'Přehled'
  publishFailed: 'Publikování se nezdařilo'
group:
  general:
    title: 'Obecné údaje'
    hint: 'Běžné údaje, které registrace potřebuje.'
  special:
    title: 'Zvláštní kategorie'
    hint: 'Zdraví, náboženství a podobné vyžadují další právní základ – obvykle otázku na souhlas ve formuláři.'
readOnly: 'Tyto informace o ochraně údajů můžeš zobrazit, ale ne měnit. To mohou administrátoři organizace.'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Informacje o ochronie danych'
subtitle: 'Co dzieje się z danymi zbieranymi podczas zgłoszenia.'
baselineNote: 'Te informacje dotyczą wszystkich wydarzeń organizacji. Poszczególne wydarzenia mogą je uzupełnić i dostosować tam, gdzie się różnią, ale nie mogą ich zastąpić.'
framework:
  title: 'Prawo ochrony danych'
  hint: 'Prawo, któremu podlega Twoja organizacja. Decyduje o tym organizacja jako administrator.'
  none: 'Żadne z nich nie dotyczy Twojej organizacji? Napisz informacje jako tekst własny.'
  single: 'Informacje z kreatora opierają się na RODO. Jeśli Twoją organizację obowiązuje inne prawo ochrony danych, napisz je jako tekst własny.'
  useFreeText: 'Użyj tekstu własnego'
  gdpr: 'RODO'
  warning: 'Sprawdź, czy to prawo dotyczy Twojej organizacji, czy obowiązujące Cię brzmienie odpowiada cytowanemu tutaj ({baseline}) i czy Twoja diecezja lub Kościół krajowy nie wprowadza odstępstw. Jeśli tak, napisz informacje jako tekst własny.'
mode:
  title: 'Jak chcecie to napisać?'
  builder: 'Kreator – wybór z przygotowanych sformułowań, tłumaczonych automatycznie na wszystkie języki'
  freeText: 'Tekst własny – napisanie całości samodzielnie'
  freeTextWarning: 'Całość informacji piszesz samodzielnie – w każdym języku Waszych wydarzeń. Nic nie jest tłumaczone ani uzupełniane, a tekst zostaje opublikowany dokładnie tak, jak go napiszesz.'
freeText:
  title: 'Wasze informacje o ochronie danych'
  hint: 'Twój tekst stanowi całość informacji: nic nie jest dodawane. Samodzielnie podaj prawa osób, których dane dotyczą, prawo do skargi i właściwy organ nadzorczy.'
  placeholder: 'Napisz informacje o ochronie danych…'
  missingLocales: 'Jeszcze nie napisano w: {locales}'
step:
  controller:
    title: 'Kim jesteście'
    caption: 'Wasza organizacja i inspektor ochrony danych'
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
    title: 'Okres przechowywania i przekazywanie'
    caption: 'Okresy, przekazywanie poza EOG, zautomatyzowane decyzje'
  additional:
    title: 'Coś jeszcze'
    caption: 'Opcjonalny tekst'
    hint: 'Tylko dla przetwarzania, którego nie da się opisać powyższymi opcjami. Wpisany tu tekst nie jest tłumaczony automatycznie.'
custom:
  recipient:
    title: 'Ktoś inny?'
    hint: 'Dodaj odbiorcę, którego nie obejmuje lista powyżej – szkołę, klub sportowy, ochronę obiektu.'
  category:
    title: 'Coś jeszcze?'
    hint: 'Dodaj kategorię, której nie obejmuje powyższa lista. Pozostań na poziomie kategorii, nie pojedynczego pola formularza.'
  purpose:
    title: 'Coś jeszcze?'
    hint: 'Dodaj cel, którego nie obejmuje powyższa lista.'
field:
  customRecipientName: 'Odbiorca'
  customCategoryName: 'Nazwa kategorii'
  customCategorySpecial: 'Dane wrażliwe'
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
  addRecipient: 'Dodaj odbiorcę'
  next: 'Dalej'
  back: 'Wstecz'
  addCategory: 'Dodaj kolejną kategorię'
  addPurpose: 'Dodaj kolejny cel'
  remove: 'Usuń'
notify:
  submitted: 'Opublikowano. Organizacja została zgłoszona do weryfikacji.'
  rejected: 'Opublikowano. Ta organizacja nadal jest odrzucona — sama publikacja nie zgłasza prośby o ponowną weryfikację.'
  rejectedAction: 'Przegląd'
  publishFailed: 'Publikacja nie powiodła się'
group:
  general:
    title: 'Dane ogólne'
    hint: 'Codzienne informacje potrzebne do rejestracji.'
  special:
    title: 'Szczególne kategorie'
    hint: 'Zdrowie, religia i podobne wymagają dodatkowej podstawy prawnej – zwykle pytania o zgodę w formularzu.'
readOnly: 'Możesz przeglądać te informacje o ochronie danych, ale nie możesz ich zmieniać. Mogą to zrobić administratorzy organizacji.'
</i18n>
