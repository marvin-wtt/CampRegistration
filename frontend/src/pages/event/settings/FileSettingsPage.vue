<template>
  <page-state-handler
    padding
    :error
    :loading
    class="files-page row justify-center"
  >
    <div class="files-content col-12 col-md-11 col-lg-10 q-gutter-y-lg">
      <!-- Header -->
      <div class="row items-end justify-between q-col-gutter-y-sm">
        <div class="col-12 col-sm page-title">
          <div class="text-h5 text-weight-medium">
            {{ t('title') }}
          </div>
          <div class="text-body2 text-grey-6 q-mt-xs">
            {{ t('subtitle') }}
          </div>
        </div>

        <div
          v-if="can('event.files.create')"
          class="col-12 col-sm-auto"
        >
          <m-btn
            :label="t('action.upload')"
            :loading="uploadOngoing"
            color="primary"
            icon="cloud_upload"
            @click="uploadFile"
          />
        </div>
      </div>

      <!-- Missing documents — surfaced above Logo/Banner since it's a
           required action item, not an optional branding tweak. -->
      <q-card
        v-if="missingDocuments.length > 0"
        flat
        bordered
        class="section-card"
      >
        <q-card-section class="q-pb-none">
          <div class="row items-center no-wrap q-gutter-sm">
            <q-icon
              name="upload_file"
              color="primary"
              size="20px"
            />
            <div class="text-subtitle2 text-weight-bold">
              {{ t('section.missing') }}
            </div>
            <q-badge
              rounded
              class="count-badge"
              :label="missingDocuments.length"
            />
          </div>
        </q-card-section>

        <q-card-section class="q-px-none q-pb-xs">
          <q-list>
            <q-item
              v-for="doc in missingDocuments"
              :key="doc.id"
              clickable
              class="file-row file-row--clickable"
              @click="uploadForSlot(doc.field, doc.locale)"
            >
              <q-item-section avatar>
                <q-avatar
                  size="44px"
                  rounded
                  class="file-tile tile--missing"
                >
                  <q-icon
                    name="cloud_upload"
                    size="20px"
                  />
                </q-avatar>
              </q-item-section>

              <q-item-section class="file-main">
                <q-item-label class="file-name">
                  <span class="ellipsis">
                    {{ getUploadHint(doc.field, doc.locale) }}
                  </span>
                </q-item-label>
              </q-item-section>

              <q-item-section
                side
                class="file-meta file-meta--inline"
              >
                <q-chip
                  v-if="doc.locale"
                  class="md3-chip locale-chip"
                  :label="doc.locale.toUpperCase()"
                />
              </q-item-section>

              <q-item-section
                side
                class="file-chevron"
              >
                <q-icon
                  name="chevron_right"
                  size="20px"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>

      <!-- Logo -->
      <file-slot-card
        icon="image"
        :title="t('section.logo')"
        :file="logoFile"
        :file-url="logoFile ? eventFileStore.getUrl(logoFile.id) : undefined"
        :description="t('logo.description')"
        :empty-text="t('logo.empty')"
        :not-public-text="t('logo.not_public')"
        :add-label="t('action.add_logo')"
        :change-label="t('action.change_logo')"
        :can-upload="can('event.files.create')"
        :can-delete="can('event.files.delete')"
        :upload-loading="uploadOngoing"
        @upload="uploadLogo"
        @delete="showDeleteDialog(logoFile!)"
      />

      <!-- Banner -->
      <file-slot-card
        icon="panorama"
        :title="t('section.banner')"
        :file="bannerFile"
        :file-url="
          bannerFile ? eventFileStore.getUrl(bannerFile.id) : undefined
        "
        :description="t('banner.description')"
        :empty-text="t('banner.empty')"
        :not-public-text="t('banner.not_public')"
        :add-label="t('action.add_banner')"
        :change-label="t('action.change_banner')"
        :can-upload="can('event.files.create')"
        :can-delete="can('event.files.delete')"
        :upload-loading="uploadOngoing"
        @upload="uploadBanner"
        @delete="showDeleteDialog(bannerFile!)"
      />

      <!-- Files -->
      <q-card
        v-if="files.length > 0"
        flat
        bordered
        class="section-card"
      >
        <q-card-section class="q-pb-none">
          <div class="row items-center no-wrap q-gutter-sm">
            <q-icon
              name="folder"
              color="primary"
              size="20px"
            />
            <div class="text-subtitle2 text-weight-bold">
              {{ t('section.files') }}
            </div>
            <q-badge
              rounded
              class="count-badge"
              :label="files.length"
            />
          </div>
        </q-card-section>

        <q-card-section class="q-px-none q-pb-xs">
          <q-list>
            <q-item
              v-for="file in files"
              :key="file.id"
              class="file-row"
            >
              <q-item-section avatar>
                <q-avatar
                  size="44px"
                  rounded
                  class="file-tile"
                  :class="fileTileClass(file.type)"
                >
                  <q-icon
                    :name="fileIcon(file.type)"
                    size="20px"
                  />
                </q-avatar>
              </q-item-section>

              <q-item-section class="file-main">
                <q-item-label class="file-name">
                  <a
                    :href="eventFileStore.getUrl(file.id)"
                    target="_blank"
                    class="file-name-link ellipsis"
                  >
                    {{ file.name }}
                  </a>
                </q-item-label>
                <q-item-label class="file-caption">
                  <q-badge
                    v-if="file.locale"
                    rounded
                    class="locale-badge"
                    :label="file.locale.toUpperCase()"
                  />
                  <span class="ellipsis">
                    {{ formatBytes(file.size) }}
                    ·
                    {{ formatUtcDateTime(file.createdAt) }}
                  </span>
                </q-item-label>
              </q-item-section>

              <q-item-section
                side
                class="file-meta"
              >
                <q-chip
                  v-if="file.field"
                  class="md3-chip field-chip"
                  icon="sell"
                  :label="file.field"
                />
                <q-chip
                  v-if="file.accessLevel"
                  class="md3-chip"
                  :class="
                    file.accessLevel === 'public'
                      ? 'access-chip--public'
                      : 'access-chip--private'
                  "
                  :icon="file.accessLevel === 'public' ? 'public' : 'lock'"
                  :label="t('access_level.' + file.accessLevel)"
                />
              </q-item-section>

              <q-item-section
                side
                class="file-buttons"
              >
                <q-btn
                  :aria-label="t('action.menu')"
                  icon="more_vert"
                  class="file-action-btn"
                  flat
                  round
                  size="sm"
                >
                  <q-menu>
                    <q-list style="min-width: 180px">
                      <q-item
                        clickable
                        v-close-popup
                        @click="copyLink(eventFileStore.getUrl(file.id))"
                      >
                        <q-item-section avatar>
                          <q-icon
                            name="link"
                            size="sm"
                          />
                        </q-item-section>
                        <q-item-section>
                          {{ t('action.copy_link') }}
                        </q-item-section>
                      </q-item>
                      <q-item
                        clickable
                        v-close-popup
                        @click="downloadFile(file)"
                      >
                        <q-item-section avatar>
                          <q-icon
                            name="cloud_download"
                            size="sm"
                          />
                        </q-item-section>
                        <q-item-section>
                          {{ t('action.download') }}
                        </q-item-section>
                      </q-item>
                      <q-item
                        v-if="can('event.files.edit')"
                        clickable
                        v-close-popup
                        @click="openEditDialog(file)"
                      >
                        <q-item-section avatar>
                          <q-icon
                            name="edit"
                            size="sm"
                          />
                        </q-item-section>
                        <q-item-section>
                          {{ t('action.edit') }}
                        </q-item-section>
                      </q-item>
                      <q-item
                        v-if="can('event.files.create')"
                        clickable
                        v-close-popup
                        @click="openReplaceDialog(file)"
                      >
                        <q-item-section avatar>
                          <q-icon
                            name="cloud_upload"
                            size="sm"
                          />
                        </q-item-section>
                        <q-item-section>
                          {{ t('action.replace') }}
                        </q-item-section>
                      </q-item>
                      <q-item
                        v-if="can('event.files.delete')"
                        clickable
                        v-close-popup
                        class="text-negative"
                        @click="showDeleteDialog(file)"
                      >
                        <q-item-section avatar>
                          <q-icon
                            name="delete"
                            size="sm"
                          />
                        </q-item-section>
                        <q-item-section>
                          {{ t('action.delete') }}
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-btn>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>

      <!-- Empty state -->
      <q-card
        v-if="files.length === 0 && missingDocuments.length === 0"
        flat
        bordered
        class="section-card"
      >
        <q-card-section class="column items-center text-center q-pa-xl">
          <q-icon
            name="cloud_upload"
            size="56px"
            class="empty-icon"
          />
          <div class="text-subtitle1 text-weight-medium q-mt-md">
            {{ t('empty.title') }}
          </div>
          <div class="text-body2 text-grey-6 q-mt-xs">
            {{ t('empty.message') }}
          </div>
          <m-btn
            v-if="can('event.files.create')"
            :label="t('action.upload')"
            :loading="uploadOngoing"
            color="primary"
            icon="cloud_upload"
            class="q-mt-md"
            @click="uploadFile"
          />
        </q-card-section>
      </q-card>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { useI18n } from 'vue-i18n';
import { computed, onMounted, ref } from 'vue';
import { copyToClipboard, useQuasar } from 'quasar';
import FileUploadDialog from '@/components/event/settings/files/FileUploadDialog.vue';
import FileSlotCard from '@/components/event/settings/files/FileSlotCard.vue';
import type { ServiceFile } from '@camp-registration/common/entities';
import { formatBytes } from '@/utils/formatters/formatBytes';
import { formatUtcDateTime } from '@/utils/formatters/formatUtcDateTime';
import { fileIcon, fileTileClass } from '@/utils/fileTypeIcon';
import {
  splitFieldVersion,
  useEventFilesStore,
} from '@/stores/event-files-store';
import { usePermissions } from '@/composables/permissions';
import {
  EVENT_LOGO_SLOT,
  EVENT_BANNER_SLOT,
} from '@camp-registration/common/form';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';

// eslint-disable-next-line @typescript-eslint/unbound-method
const { t, te } = useI18n();
const quasar = useQuasar();
const eventStore = useEventDetailsStore();
const eventFileStore = useEventFilesStore();
const { can } = usePermissions();

onMounted(async () => {
  await Promise.allSettled([
    eventStore.fetchData(),
    eventFileStore.fetchData(),
  ]);
});

const uploadOngoing = ref(false);

// The logo and banner have their own sections above — excluded here so they
// aren't listed twice.
const files = computed<ServiceFile[]>(() =>
  sortFiles(
    (eventFileStore.data ?? []).filter(
      (file) =>
        file.field !== EVENT_LOGO_SLOT && file.field !== EVENT_BANNER_SLOT,
    ),
  ),
);

const logoFile = computed<ServiceFile | undefined>(
  () => eventFileStore.logoFile,
);

const bannerFile = computed<ServiceFile | undefined>(
  () => eventFileStore.bannerFile,
);

/**
 * Presentational ordering for the file list:
 * 1. Fielded slot documents (rules, toc, …) first, grouped by `field`.
 * 2. Within a field, by `locale` so language variants cluster together.
 * 3. Free uploads (no field) last, newest first.
 * `id` is the final tiebreaker to keep the order stable across refetches.
 */
function sortFiles(list: ServiceFile[]): ServiceFile[] {
  return [...list].sort((a, b) => {
    if (!!a.field !== !!b.field) {
      return a.field ? -1 : 1;
    }

    if (a.field && b.field) {
      const byField = a.field.localeCompare(b.field);
      if (byField !== 0) {
        return byField;
      }

      const byLocale = (a.locale ?? '').localeCompare(b.locale ?? '');
      if (byLocale !== 0) {
        return byLocale;
      }
    } else {
      const byDate = b.createdAt.localeCompare(a.createdAt);
      if (byDate !== 0) {
        return byDate;
      }
    }

    return a.id.localeCompare(b.id);
  });
}

interface MissingDocument {
  id: string;
  field: string;
  locale: string | null;
}

const missingDocuments = computed<MissingDocument[]>(() => {
  if (!can('event.files.create')) {
    return [];
  }

  const pending = eventFileStore.pendingSlots.map((slot) => ({
    id: `__pending__${slot}`,
    field: slot,
    locale: null,
  }));

  const missingLocales = eventFileStore.slotsWithMissingLocales.flatMap(
    ({ slot, missingLocales }) =>
      missingLocales.map((locale) => ({
        id: `__missing__${slot}__${locale}`,
        field: slot,
        locale,
      })),
  );

  return [...pending, ...missingLocales];
});

const loading = computed<boolean>(
  () => eventStore.isLoading || eventFileStore.isLoading,
);

const error = computed<string | null>(
  () => eventStore.error || eventFileStore.error,
);

function openDialog(componentProps?: Record<string, unknown>) {
  uploadOngoing.value = true;
  quasar
    .dialog({ component: FileUploadDialog, componentProps })
    .onDismiss(() => {
      uploadOngoing.value = false;
    });
}

function uploadFile() {
  openDialog();
}

function getUploadHint(field: string, locale?: string | null): string {
  const { baseField, version } = splitFieldVersion(field);

  const key = `virtual.upload_hint.${baseField}`;
  const label = te(key)
    ? t(key)
    : t('virtual.upload_hint.default', { field: baseField });

  const versioned =
    version === undefined
      ? label
      : `${label} (${t('virtual.version.replacement', { n: version })})`;

  return locale ? `${versioned} (${locale})` : versioned;
}

function uploadForSlot(slot: string, locale?: string | null) {
  openDialog({ initialField: slot, initialLocale: locale });
}

// The logo isn't localized — the dialog locks the locale to null for this
// slot, so re-submitting always replaces the one existing logo file.
function uploadLogo() {
  uploadForSlot(EVENT_LOGO_SLOT, null);
}

// Same reasoning as the logo: a single, non-localized banner file.
function uploadBanner() {
  uploadForSlot(EVENT_BANNER_SLOT, null);
}

function openReplaceDialog(file: ServiceFile) {
  openDialog({ fileToReplace: file });
}

function openEditDialog(file: ServiceFile) {
  openDialog({ fileToEdit: file });
}

function showDeleteDialog(file: ServiceFile) {
  quasar
    .dialog({
      title: t('dialog.delete.title'),
      message: t('dialog.delete.message', { name: file.name }),
      cancel: {
        label: t('dialog.delete.cancel'),
        color: 'primary',
        rounded: true,
        outline: true,
      },
      ok: {
        label: t('dialog.delete.ok'),
        color: 'negative',
        rounded: true,
      },
    })
    .onOk(() => {
      void eventFileStore.deleteEntry(file.id);
    });
}

function downloadFile(file: ServiceFile) {
  void eventFileStore.downloadFile(file);
}

function copyLink(url: string) {
  copyToClipboard(url)
    .then(() => {
      quasar.notify({
        type: 'positive',
        message: t('notification.copy_link.success'),
      });
    })
    .catch((reason) => {
      quasar.notify({
        type: 'negative',
        message: t('notification.copy_link.failed'),
        caption: reason,
      });
    });
}
</script>

<style scoped>
.files-content {
  max-width: 960px;
  min-width: 0;
  padding-bottom: 24px;
}

.page-title {
  min-width: 0;
}

/* The default page padding feels cramped under the app bar on phones. */
@media (max-width: 599px) {
  .files-page {
    padding-top: 24px;
  }
}

.section-card {
  border-radius: 16px;
}

.count-badge {
  min-width: 20px;
  padding: 2px 8px;
  justify-content: center;

  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface-variant);

  font-size: 12px;
  font-weight: 600;
}

.file-row {
  align-items: flex-start;
  min-width: 0;
  padding: 12px 16px;
}

.file-row + .file-row {
  border-top: 1px solid var(--md3-outline-variant);
}

.file-row .q-item__section--avatar {
  min-width: 0;
  padding-right: 12px;
}

.file-row .q-item__section--side {
  min-width: 0;
  padding-left: 12px;
}

.file-main {
  min-width: 0;
  overflow: hidden;
}

.file-row--clickable {
  transition: background-color 0.15s ease;
}

.file-row--clickable:hover,
.file-row--clickable:focus-visible {
  background: var(--md3-surface-container);
  outline: none;
}

.file-tile {
  border-radius: 12px;
}

.tile--document {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
}

.tile--media {
  background: var(--md3-tertiary-container);
  color: var(--md3-on-tertiary-container);
}

.tile--other {
  background: var(--md3-surface-container-highest);
  color: var(--md3-on-surface-variant);
}

.tile--missing {
  background: var(--md3-warning-container);
  color: var(--md3-on-warning-container);
}

.file-name {
  display: flex;
  align-items: center;
  gap: 8px;

  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  font-weight: 500;
}

/* The text child (file name link or upload hint) must shrink so long names
   truncate instead of widening the row; the locale badge stays at its size.
   `flex-basis: 0` (not auto) keeps the name from contributing its full intrinsic
   width, so it always truncates into the space left beside the badge. */
.file-name > .ellipsis,
.file-name-link {
  flex: 1 1 0;
  min-width: 0;
}

.file-name-link {
  display: block;

  color: inherit;
  text-decoration: none;
}

.locale-badge {
  flex: none;
  padding: 2px 8px;

  background: var(--md3-surface-container-highest);
  color: var(--md3-on-surface-variant);

  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.file-name-link:hover {
  text-decoration: underline;
}

.file-caption {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;

  color: var(--md3-on-surface-variant);
  font-size: 12px;
}

.file-caption > .ellipsis {
  min-width: 0;
}

.file-meta {
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  max-width: 45%;
  min-width: 0;

  /* Quasar only sets border-box on html/body, not globally, so be explicit:
     the mobile rule below adds padding-left to a flex: 0 0 100% section, which
     would otherwise add on top of the 100% and overflow the row. */
  box-sizing: border-box;
}

.file-buttons {
  flex-direction: row;
  align-items: center;
}

.file-action-btn {
  color: var(--md3-on-surface-variant);
}

.file-chevron {
  color: var(--md3-on-surface-variant);
}

.md3-chip {
  height: 24px;
  max-width: 100%;
  margin: 0;
  padding: 0 10px;
  border-radius: 8px;

  font-size: 12px;
  font-weight: 500;
}

.md3-chip :deep(.q-icon) {
  flex: none;
  font-size: 14px;
}

.md3-chip :deep(.q-chip__content) {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.field-chip {
  max-width: min(260px, 32vw);

  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}

.locale-chip {
  background: var(--md3-surface-container-highest);
  color: var(--md3-on-surface-variant);
}

.access-chip--public {
  background: var(--md3-tertiary-container);
  color: var(--md3-on-tertiary-container);
}

.access-chip--private {
  background: var(--md3-surface-container-highest);
  color: var(--md3-on-surface-variant);
}

.empty-icon {
  color: var(--md3-on-surface-variant);
  opacity: 0.6;
}

/* On phones the chips drop to a full-width second line, aligned with the
   text column next to the tile. */
@media (max-width: 599px) {
  .file-row {
    flex-wrap: wrap;
  }

  .file-meta {
    order: 5;
    flex: 0 0 100%;
    max-width: 100%;
    justify-content: flex-start;
    padding-left: 56px;
  }

  /* Missing-document rows only carry a small locale chip, so keep it inline
     next to the chevron instead of dropping it onto its own indented line. */
  .file-meta--inline {
    order: 0;
    flex: 0 0 auto;
    max-width: 50%;
    justify-content: flex-end;
    padding-left: 0;
  }

  .field-chip {
    max-width: 100%;
  }
}
</style>

<i18n lang="yaml" locale="en">
title: 'Files'
subtitle: 'Upload and manage documents for this event.'

action:
  delete: 'Delete'
  download: 'Download'
  edit: 'Edit'
  upload: 'Upload'
  replace: 'Replace'
  add_logo: 'Add logo'
  change_logo: 'Change logo'
  add_banner: 'Add banner'
  change_banner: 'Change banner'
  copy_link: 'Copy link'
  menu: 'Actions'

section:
  files: 'Files'
  logo: 'Logo'
  banner: 'Banner'
  missing: 'Missing documents'

logo:
  description: 'Shown on the event card, in the registration form header and in link previews.'
  empty: 'No logo uploaded yet.'
  not_public: 'The logo is private. Only public files are shown to participants.'

banner:
  description: 'Shown as a wide cover image on the event card, when set.'
  empty: 'No banner uploaded yet.'
  not_public: 'The banner is private. Only public files are shown to participants.'

dialog:
  delete:
    title: 'Delete file'
    message: 'Do you really want to delete "{name}"?'
    cancel: 'Cancel'
    ok: 'Delete'

empty:
  title: 'No files yet'
  message: 'Upload documents such as event rules or terms & conditions.'

virtual:
  upload_hint:
    rules: 'Upload Event Rules'
    toc: 'Upload Terms & Conditions'
    logo: 'Upload Logo'
    banner: 'Upload Banner'
    default: 'Upload {field}'
  version:
    replacement: 'Replacement {n}'

access_level:
  public: 'Public'
  private: 'Private'

notification:
  copy_link:
    success: 'Link copied to clipboard'
    failed: 'Failed to copy link to clipboard'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Dateien'
subtitle: 'Laden Sie Dokumente für diese Veranstaltung hoch und verwalten Sie sie.'

action:
  delete: 'Löschen'
  download: 'Herunterladen'
  edit: 'Bearbeiten'
  upload: 'Hochladen'
  replace: 'Ersetzen'
  add_logo: 'Logo hinzufügen'
  change_logo: 'Logo ändern'
  add_banner: 'Banner hinzufügen'
  change_banner: 'Banner ändern'
  copy_link: 'Link kopieren'
  menu: 'Aktionen'

section:
  files: 'Dateien'
  logo: 'Logo'
  banner: 'Banner'
  missing: 'Fehlende Dokumente'

logo:
  description: 'Wird auf der Veranstaltungskarte, im Kopfbereich des Anmeldeformulars und in Linkvorschauen angezeigt.'
  empty: 'Noch kein Logo hochgeladen.'
  not_public: 'Das Logo ist privat. Teilnehmenden werden nur öffentliche Dateien angezeigt.'

banner:
  description: 'Wird, falls vorhanden, als breites Titelbild auf der Veranstaltungskarte angezeigt.'
  empty: 'Noch kein Banner hochgeladen.'
  not_public: 'Das Banner ist privat. Teilnehmenden werden nur öffentliche Dateien angezeigt.'

dialog:
  delete:
    title: 'Datei löschen'
    message: 'Möchten Sie „{name}“ wirklich löschen?'
    cancel: 'Abbrechen'
    ok: 'Löschen'

empty:
  title: 'Noch keine Dateien'
  message: 'Laden Sie Dokumente wie Veranstaltungregeln oder AGB hoch.'

virtual:
  upload_hint:
    rules: 'Veranstaltungregeln hochladen'
    toc: 'AGB hochladen'
    logo: 'Logo hochladen'
    banner: 'Banner hochladen'
    default: '{field} hochladen'
  version:
    replacement: 'Ersatz {n}'

access_level:
  public: 'Öffentlich'
  private: 'Privat'

notification:
  copy_link:
    success: 'Link in Zwischenablage kopiert'
    failed: 'Link konnte nicht in Zwischenablage kopiert werden'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Fichiers'
subtitle: 'Téléversez et gérez les documents de cet événement.'

action:
  delete: 'Supprimer'
  download: 'Télécharger'
  edit: 'Modifier'
  upload: 'Téléverser'
  replace: 'Remplacer'
  add_logo: 'Ajouter un logo'
  change_logo: 'Changer le logo'
  add_banner: 'Ajouter une bannière'
  change_banner: 'Changer la bannière'
  copy_link: 'Copier le lien'
  menu: 'Actions'

section:
  files: 'Fichiers'
  logo: 'Logo'
  banner: 'Bannière'
  missing: 'Documents manquants'

logo:
  description: "Affiché sur la carte de l'événement, dans l'en-tête du formulaire d'inscription et dans les aperçus de lien."
  empty: 'Aucun logo téléversé pour le moment.'
  not_public: 'Le logo est privé. Seuls les fichiers publics sont affichés aux participants.'

banner:
  description: "Affichée, si définie, comme grande image de couverture sur la carte de l'événement."
  empty: 'Aucune bannière téléversée pour le moment.'
  not_public: 'La bannière est privée. Seuls les fichiers publics sont affichés aux participants.'

dialog:
  delete:
    title: 'Supprimer le fichier'
    message: 'Voulez-vous vraiment supprimer « {name} » ?'
    cancel: 'Annuler'
    ok: 'Supprimer'

empty:
  title: 'Aucun fichier pour le moment'
  message: 'Téléversez des documents comme le règlement ou les conditions générales.'

virtual:
  upload_hint:
    rules: 'Téléverser le règlement'
    toc: 'Téléverser les conditions générales'
    logo: 'Téléverser le logo'
    banner: 'Téléverser la bannière'
    default: 'Téléverser {field}'
  version:
    replacement: 'Remplacement {n}'

access_level:
  public: 'Public'
  private: 'Privé'

notification:
  copy_link:
    success: 'Lien copié dans le presse-papiers'
    failed: 'Échec de la copie du lien dans le presse-papiers'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Pliki'
subtitle: 'Przesyłaj i zarządzaj dokumentami tego wydarzenia.'

action:
  delete: 'Usuń'
  download: 'Pobierz'
  edit: 'Edytuj'
  upload: 'Prześlij'
  replace: 'Zastąp'
  add_logo: 'Dodaj logo'
  change_logo: 'Zmień logo'
  add_banner: 'Dodaj baner'
  change_banner: 'Zmień baner'
  copy_link: 'Kopiuj link'
  menu: 'Akcje'

section:
  files: 'Pliki'
  logo: 'Logo'
  banner: 'Baner'
  missing: 'Brakujące dokumenty'

logo:
  description: 'Wyświetlane na karcie wydarzenia, w nagłówku formularza rejestracyjnego i w podglądach linków.'
  empty: 'Nie przesłano jeszcze logo.'
  not_public: 'Logo jest prywatne. Uczestnikom pokazywane są tylko pliki publiczne.'

banner:
  description: 'Wyświetlany, jeśli ustawiony, jako szeroki obraz tytułowy na karcie wydarzenia.'
  empty: 'Nie przesłano jeszcze banera.'
  not_public: 'Baner jest prywatny. Uczestnikom pokazywane są tylko pliki publiczne.'

dialog:
  delete:
    title: 'Usuń plik'
    message: 'Czy na pewno chcesz usunąć „{name}”?'
    cancel: 'Anuluj'
    ok: 'Usuń'

empty:
  title: 'Brak plików'
  message: 'Prześlij dokumenty, takie jak regulamin lub warunki uczestnictwa.'

virtual:
  upload_hint:
    rules: 'Prześlij regulamin'
    toc: 'Prześlij warunki uczestnictwa'
    logo: 'Prześlij logo'
    banner: 'Prześlij baner'
    default: 'Prześlij {field}'
  version:
    replacement: 'Zamiennik {n}'

access_level:
  public: 'Publiczny'
  private: 'Prywatny'

notification:
  copy_link:
    success: 'Link skopiowany do schowka'
    failed: 'Nie udało się skopiować linku do schowka'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Soubory'
subtitle: 'Nahrávejte a spravujte dokumenty této akce.'

action:
  delete: 'Smazat'
  download: 'Stáhnout'
  edit: 'Upravit'
  upload: 'Nahrát'
  replace: 'Nahradit'
  add_logo: 'Přidat logo'
  change_logo: 'Změnit logo'
  add_banner: 'Přidat banner'
  change_banner: 'Změnit banner'
  copy_link: 'Kopírovat odkaz'
  menu: 'Akce'

section:
  files: 'Soubory'
  logo: 'Logo'
  banner: 'Banner'
  missing: 'Chybějící dokumenty'

logo:
  description: 'Zobrazuje se na kartě akce, v záhlaví registračního formuláře a v náhledech odkazů.'
  empty: 'Zatím nebylo nahráno žádné logo.'
  not_public: 'Logo je soukromé. Účastníkům se zobrazují pouze veřejné soubory.'

banner:
  description: 'Pokud je nastaven, zobrazuje se jako široký titulní obrázek na kartě akce.'
  empty: 'Zatím nebyl nahrán žádný banner.'
  not_public: 'Banner je soukromý. Účastníkům se zobrazují pouze veřejné soubory.'

dialog:
  delete:
    title: 'Smazat soubor'
    message: 'Opravdu chcete smazat „{name}“?'
    cancel: 'Zrušit'
    ok: 'Smazat'

empty:
  title: 'Zatím žádné soubory'
  message: 'Nahrajte dokumenty, jako jsou pravidla akce nebo obchodní podmínky.'

virtual:
  upload_hint:
    rules: 'Nahrát pravidla akce'
    toc: 'Nahrát obchodní podmínky'
    logo: 'Nahrát logo'
    banner: 'Nahrát banner'
    default: 'Nahrát {field}'
  version:
    replacement: 'Náhrada {n}'

access_level:
  public: 'Veřejný'
  private: 'Soukromý'

notification:
  copy_link:
    success: 'Odkaz zkopírován do schránky'
    failed: 'Nepodařilo se zkopírovat odkaz do schránky'
</i18n>
