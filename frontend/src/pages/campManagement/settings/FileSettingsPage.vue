<template>
  <page-state-handler
    padding
    :error
    :loading
    class="files-page row justify-center"
  >
    <div class="files-content col-12 col-md-11 col-lg-10 column q-gutter-y-lg">
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
          v-if="can('camp.files.create')"
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

      <!-- Missing documents -->
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

              <q-item-section>
                <q-item-label class="file-name">
                  <span class="ellipsis">
                    {{ getUploadHint(doc.field, doc.locale) }}
                  </span>
                </q-item-label>
              </q-item-section>

              <q-item-section
                side
                class="file-meta"
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

              <q-item-section>
                <q-item-label class="file-name">
                  <a
                    :href="campFileStore.getUrl(file.id)"
                    target="_blank"
                    class="file-name-link ellipsis"
                  >
                    {{ file.name }}
                  </a>
                  <q-badge
                    v-if="file.locale"
                    rounded
                    class="locale-badge"
                    :label="file.locale.toUpperCase()"
                  />
                </q-item-label>
                <q-item-label class="file-caption ellipsis">
                  {{ formatBytes(file.size) }}
                  ·
                  {{ formatUtcDateTime(file.createdAt) }}
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
                  :aria-label="t('action.copy_link')"
                  icon="link"
                  class="file-action-btn"
                  flat
                  round
                  size="sm"
                  @click="copyLink(campFileStore.getUrl(file.id))"
                >
                  <q-tooltip>{{ t('action.copy_link') }}</q-tooltip>
                </q-btn>

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
                        v-if="can('camp.files.create')"
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
                        v-if="can('camp.files.delete')"
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
            v-if="can('camp.files.create')"
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
import PageStateHandler from 'components/common/PageStateHandler.vue';
import { useCampDetailsStore } from 'stores/camp-details-store';
import { useI18n } from 'vue-i18n';
import { computed, onMounted, ref } from 'vue';
import { copyToClipboard, useQuasar } from 'quasar';
import FileUploadDialog from 'components/campManagement/settings/files/FileUploadDialog.vue';
import type { ServiceFile } from '@camp-registration/common/entities';
import { formatBytes } from 'src/utils/formatters/formatBytes';
import { formatUtcDateTime } from 'src/utils/formatters/formatUtcDateTime';
import { useCampFilesStore } from 'stores/camp-files-store';
import { usePermissions } from 'src/composables/permissions';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';

// eslint-disable-next-line @typescript-eslint/unbound-method
const { t, te } = useI18n();
const quasar = useQuasar();
const campStore = useCampDetailsStore();
const campFileStore = useCampFilesStore();
const { can } = usePermissions();

onMounted(async () => {
  await Promise.allSettled([campStore.fetchData(), campFileStore.fetchData()]);
});

const uploadOngoing = ref(false);

const files = computed<ServiceFile[]>(() => campFileStore.data ?? []);

interface MissingDocument {
  id: string;
  field: string;
  locale: string | null;
}

const missingDocuments = computed<MissingDocument[]>(() => {
  if (!can('camp.files.create')) {
    return [];
  }

  const pending = campFileStore.pendingSlots.map((slot) => ({
    id: `__pending__${slot}`,
    field: slot,
    locale: null,
  }));

  const missingLocales = campFileStore.slotsWithMissingLocales.flatMap(
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
  () => campStore.isLoading || campFileStore.isLoading,
);

const error = computed<string | null>(
  () => campStore.error || campFileStore.error,
);

function fileIcon(type: string): string {
  if (type.startsWith('image/')) {
    return 'image';
  }
  if (type === 'application/pdf') {
    return 'picture_as_pdf';
  }
  if (type.startsWith('video/')) {
    return 'movie';
  }
  if (type.startsWith('audio/')) {
    return 'audiotrack';
  }

  return 'description';
}

function fileTileClass(type: string): string {
  if (type.startsWith('image/') || type.startsWith('video/')) {
    return 'tile--media';
  }
  if (type === 'application/pdf') {
    return 'tile--document';
  }

  return 'tile--other';
}

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
  const key = `virtual.upload_hint.${field}`;
  const label = te(key) ? t(key) : t('virtual.upload_hint.default', { field });

  return locale ? `${label} (${locale})` : label;
}

function uploadForSlot(slot: string, locale?: string | null) {
  openDialog({ initialField: slot, initialLocale: locale });
}

function openReplaceDialog(file: ServiceFile) {
  openDialog({ fileToReplace: file });
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
      void campFileStore.deleteEntry(file.id);
    });
}

function downloadFile(file: ServiceFile) {
  void campFileStore.downloadFile(file);
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
  padding-bottom: 24px;
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
  padding-left: 12px;
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
  font-weight: 500;
}

.file-name-link {
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
  color: var(--md3-on-surface-variant);
  font-size: 12px;
}

.file-meta {
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
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
  margin: 0;
  padding: 0 10px;
  border-radius: 8px;

  font-size: 12px;
  font-weight: 500;
}

.md3-chip :deep(.q-icon) {
  font-size: 14px;
}

.field-chip {
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
    justify-content: flex-start;
    padding-left: 56px;
  }
}
</style>

<i18n lang="yaml" locale="en">
title: 'Files'
subtitle: 'Upload and manage documents for this camp.'

action:
  delete: 'Delete'
  download: 'Download'
  upload: 'Upload'
  replace: 'Replace'
  copy_link: 'Copy link'
  menu: 'Actions'

section:
  files: 'Files'
  missing: 'Missing documents'

dialog:
  delete:
    title: 'Delete file'
    message: 'Do you really want to delete "{name}"?'
    cancel: 'Cancel'
    ok: 'Delete'

empty:
  title: 'No files yet'
  message: 'Upload documents such as camp rules or terms & conditions.'

virtual:
  upload_hint:
    rules: 'Upload Camp Rules'
    toc: 'Upload Terms & Conditions'
    default: 'Upload {field}'

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
subtitle: 'Laden Sie Dokumente für dieses Camp hoch und verwalten Sie sie.'

action:
  delete: 'Löschen'
  download: 'Herunterladen'
  upload: 'Hochladen'
  replace: 'Ersetzen'
  copy_link: 'Link kopieren'
  menu: 'Aktionen'

section:
  files: 'Dateien'
  missing: 'Fehlende Dokumente'

dialog:
  delete:
    title: 'Datei löschen'
    message: 'Möchten Sie „{name}“ wirklich löschen?'
    cancel: 'Abbrechen'
    ok: 'Löschen'

empty:
  title: 'Noch keine Dateien'
  message: 'Laden Sie Dokumente wie Campregeln oder AGB hoch.'

virtual:
  upload_hint:
    rules: 'Campregeln hochladen'
    toc: 'AGB hochladen'
    default: '{field} hochladen'

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
subtitle: 'Téléversez et gérez les documents de ce camp.'

action:
  delete: 'Supprimer'
  download: 'Télécharger'
  upload: 'Téléverser'
  replace: 'Remplacer'
  copy_link: 'Copier le lien'
  menu: 'Actions'

section:
  files: 'Fichiers'
  missing: 'Documents manquants'

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
    default: 'Téléverser {field}'

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
subtitle: 'Przesyłaj i zarządzaj dokumentami tego obozu.'

action:
  delete: 'Usuń'
  download: 'Pobierz'
  upload: 'Prześlij'
  replace: 'Zastąp'
  copy_link: 'Kopiuj link'
  menu: 'Akcje'

section:
  files: 'Pliki'
  missing: 'Brakujące dokumenty'

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
    default: 'Prześlij {field}'

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
subtitle: 'Nahrávejte a spravujte dokumenty tohoto tábora.'

action:
  delete: 'Smazat'
  download: 'Stáhnout'
  upload: 'Nahrát'
  replace: 'Nahradit'
  copy_link: 'Kopírovat odkaz'
  menu: 'Akce'

section:
  files: 'Soubory'
  missing: 'Chybějící dokumenty'

dialog:
  delete:
    title: 'Smazat soubor'
    message: 'Opravdu chcete smazat „{name}“?'
    cancel: 'Zrušit'
    ok: 'Smazat'

empty:
  title: 'Zatím žádné soubory'
  message: 'Nahrajte dokumenty, jako jsou táborová pravidla nebo obchodní podmínky.'

virtual:
  upload_hint:
    rules: 'Nahrát táborová pravidla'
    toc: 'Nahrát obchodní podmínky'
    default: 'Nahrát {field}'

access_level:
  public: 'Veřejný'
  private: 'Soukromý'

notification:
  copy_link:
    success: 'Odkaz zkopírován do schránky'
    failed: 'Nepodařilo se zkopírovat odkaz do schránky'
</i18n>
