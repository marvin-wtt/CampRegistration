import { defineStore } from 'pinia';
import { useAPIService } from '@/services/APIService';
import { useCollection, useRouteKey } from '@/composables/resource';
import { useAction } from '@/composables/action';
import { useNotifier } from '@/composables/notifier';
import { useI18n } from 'vue-i18n';
import { removeById, replaceById, upsertById } from '@/utils/collection';
import { useEventDetailsStore } from '@/stores/event-details-store';
import type {
  ServiceFileCreateData,
  ServiceFileUpdateData,
  ServiceFile,
} from '@camp-registration/common/entities';
import { exportFile } from 'quasar';
import { computed } from 'vue';
import {
  EVENT_LOGO_SLOT,
  EVENT_BANNER_SLOT,
} from '@camp-registration/common/form';
import {
  missingSlotFiles,
  type MissingSlotFile,
} from '@/utils/fileSlotCoverage';

// Matches {_file.slotName} placeholders used in SurveyJS form definitions.
const FILE_SLOT_REGEX = /\{\s?_file\.([a-z0-9_-]+)\s?}/g;

/**
 * Whether `field` is `baseField` itself or one of its numbered versions
 * (`baseField-1`, `baseField-2`, …) — the scheme the Form Editor's file
 * picker uses so swapping an image keeps the previous one addressable
 * instead of deleting it.
 */
export function isFieldVersion(field: string, baseField: string): boolean {
  const escaped = baseField.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped}(-\\d+)?$`).test(field);
}

/**
 * Splits a field into its base name and version number, e.g. `"logo-2"` ->
 * `{ baseField: "logo", version: 2 }`. `version` is `undefined` for the
 * original (unsuffixed) field.
 */
export function splitFieldVersion(field: string): {
  baseField: string;
  version: number | undefined;
} {
  const match = /^(.*)-(\d+)$/.exec(field);

  return match
    ? { baseField: match[1]!, version: Number(match[2]) }
    : { baseField: field, version: undefined };
}

export const useEventFilesStore = defineStore('eventFiles', () => {
  const api = useAPIService();
  const eventStore = useEventDetailsStore();
  const { run } = useAction('eventFiles');
  const notifier = useNotifier('eventFiles');
  const { t } = useI18n({ useScope: 'global' });
  // List mode (no per-id metadata endpoint). The async upload-completion
  // (READY) status flip does not emit — the list refreshes on the next
  // created/updated/deleted event or page load.
  const files = useCollection<ServiceFile>({
    name: 'eventFiles',
    key: useRouteKey('eventId'),
    fetch: (eventId) => api.fetchEventFiles(eventId),
    realtime: { resource: 'file' },
  });

  // The file behind the reserved logo slot, if any — a single file, not
  // localized. Unlike a form slot this one is never declared by the form; see
  // EVENT_LOGO_SLOT.
  const logoFile = computed<ServiceFile | undefined>(() =>
    reservedSlotFile(EVENT_LOGO_SLOT),
  );

  // The file behind the reserved banner slot, if any — same reserved-slot
  // mechanism as the logo, see EVENT_BANNER_SLOT.
  const bannerFile = computed<ServiceFile | undefined>(() =>
    reservedSlotFile(EVENT_BANNER_SLOT),
  );

  // Should a slot hold several files, picks the one the server serves: ready
  // before pending, public before private, then newest.
  function reservedSlotFile(slot: string): ServiceFile | undefined {
    const rank = (file: ServiceFile) =>
      (file.uploadStatus === 'READY' ? 2 : 0) +
      (file.accessLevel === 'public' ? 1 : 0);

    return (files.data.value ?? [])
      .filter((file) => file.field === slot)
      .sort(
        (a, b) => rank(b) - rank(a) || b.createdAt.localeCompare(a.createdAt),
      )[0];
  }

  // Slots declared in the form via {_file.slotName} that have no uploaded file yet.
  const pendingSlots = computed<string[]>(() => {
    const form = eventStore.data?.form;
    if (!form) {
      return [];
    }

    const uploadedFields = new Set(
      (files.data.value ?? []).map((f) => f.field).filter(Boolean),
    );

    const json = JSON.stringify(form);
    const declared = new Set<string>();
    const regex = new RegExp(FILE_SLOT_REGEX.source, 'g');
    let match;
    while ((match = regex.exec(json)) !== null) {
      const value = match[1];
      if (value) {
        declared.add(value);
      }
    }

    return [...declared].filter((slot) => !uploadedFields.has(slot));
  });

  // Files missing from slots that already hold some, per group and language.
  const missingFiles = computed<MissingSlotFile[]>(() => {
    const event = eventStore.data;
    if (!event) {
      return [];
    }

    return missingSlotFiles(files.data.value ?? [], {
      locales: event.locales,
      groups: event.countries,
    });
  });

  // Number of files that need attention: one per declared-but-not-uploaded slot,
  // plus one per missing file on slots that already have files. A pending slot
  // has no files at all, so the two sets are disjoint and can be summed.
  const missingFilesCount = computed<number>(
    () => pendingSlots.value.length + missingFiles.value.length,
  );

  function fieldOf(id: string): string | null | undefined {
    return files.data.value?.find((file) => file.id === id)?.field;
  }

  function fetchData(eventId?: string) {
    return files.load(eventId);
  }

  async function createEntry(
    createData: ServiceFileCreateData,
  ): Promise<ServiceFile> {
    const file = await files.mutate(
      'create',
      (eventId) => api.createEventFile(eventId, createData),
      { feedback: 'progress', apply: upsertById },
    );
    refreshEventMedia(file.field);
    return file;
  }

  // Uploads the new file, then deletes the old one. Once the upload is in,
  // the replace counts as done: a failed delete keeps the old file listed and
  // is reported, so retrying doesn't upload another copy.
  async function replaceFile(
    oldFile: ServiceFile,
    createData: ServiceFileCreateData,
  ): Promise<ServiceFile> {
    let deleteError: unknown;
    const file = await files.mutate(
      'replace',
      async (eventId) => {
        const created = await api.createEventFile(eventId, createData);
        deleteError = await api.deleteFile(oldFile.id).then(
          () => undefined,
          (err: unknown) => err ?? new Error('delete failed'),
        );
        return created;
      },
      {
        feedback: 'progress',
        apply: (list, created) => [
          ...(deleteError ? list : removeById(list, oldFile.id)),
          created,
        ],
      },
    );
    if (deleteError) {
      notifier.error(
        'replace',
        deleteError,
        t('stores.eventFiles.replace.oldFileKept'),
      );
    }
    refreshEventMedia(oldFile.field, file.field);
    return file;
  }

  async function updateEntry(
    id: string,
    updateData: ServiceFileUpdateData,
  ): Promise<ServiceFile> {
    const previousField = fieldOf(id);
    const file = await files.mutate(
      'update',
      () => api.updateFile(id, updateData),
      { feedback: 'progress', apply: replaceById },
    );
    refreshEventMedia(previousField, file.field);
    return file;
  }

  async function deleteEntry(id: string): Promise<void> {
    const field = fieldOf(id);
    await files.mutate('delete', () => api.deleteFile(id), {
      feedback: 'progress',
      apply: (list) => removeById(list, id),
    });
    refreshEventMedia(field);
  }

  /**
   * `EventDetails.logo`/`banner` are derived from their reserved slots on the
   * server, so a write to either slot — upload, replace, access-level change,
   * delete — changes the event resource as well. Refresh it instead of
   * leaving event cards and the form header pointing at a logo or banner that
   * is no longer there (or missing one that now is).
   */
  function refreshEventMedia(...fields: (string | null | undefined)[]) {
    if (
      fields.includes(EVENT_LOGO_SLOT) ||
      fields.includes(EVENT_BANNER_SLOT)
    ) {
      void eventStore.reload();
    }
  }

  async function downloadFile(file: ServiceFile): Promise<void> {
    await run('download', async () => {
      const blob = await api.downloadFile(file.id);
      exportFile(file.name, blob, { mimeType: file.type });
    });
  }

  function getUrl(id: string) {
    return api.getFileUrl(id);
  }

  /**
   * The next free field for uploading a new version under `baseField`:
   * the base field itself if it's never been used, otherwise the lowest
   * unused `baseField-N`. Uploading through it never overwrites an earlier
   * version — swapping an image just points the form at a new field.
   */
  function nextAvailableField(baseField: string): string {
    const used = new Set(
      (files.data.value ?? [])
        .map((f) => f.field)
        .filter((f): f is string => !!f),
    );

    if (!used.has(baseField)) {
      return baseField;
    }

    let n = 1;
    while (used.has(`${baseField}-${n}`)) {
      n++;
    }

    return `${baseField}-${n}`;
  }

  return {
    data: files.data,
    isLoading: files.isLoading,
    error: files.error,
    reset: files.reset,
    logoFile,
    bannerFile,
    pendingSlots,
    missingFiles,
    missingFilesCount,
    downloadFile,
    getUrl,
    nextAvailableField,
    fetchData,
    createEntry,
    replaceFile,
    updateEntry,
    deleteEntry,
  };
});
