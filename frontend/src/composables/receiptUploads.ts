import { computed, onBeforeUnmount, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { ServiceFile } from '@camp-registration/common/entities';
import { useAPIService } from '@/services/APIService';

export interface ReceiptFile {
  key: string;
  /** Set once the upload finished; what the expense is saved with. */
  id: string | null;
  name: string;
  /** Where to open it: the stored file, or a blob of a fresh upload. */
  url: string | null;
  preview: string | null;
  uploading: boolean;
}

function storedReceiptFile(file: ServiceFile): ReceiptFile {
  return {
    key: file.id,
    id: file.id,
    name: file.name,
    url: file.url,
    preview: file.type.startsWith('image/') ? file.url : null,
    uploading: false,
  };
}

const isBlob = (file: ReceiptFile) => file.url?.startsWith('blob:') ?? false;

// Unique per upload: phones name every gallery photo `image.jpg`, and a
// batch is added within the same millisecond.
let uploadCount = 0;

/**
 * Receipt photos as they are taken: each uploads at once as a temporary file
 * of the session, previewed from a blob meanwhile. A failed one is dropped.
 */
export function useReceiptUploads(initial: readonly ServiceFile[]) {
  const quasar = useQuasar();
  const { t } = useI18n({ useScope: 'global' });
  const api = useAPIService();

  const files = ref<ReceiptFile[]>(initial.map(storedReceiptFile));
  const uploading = computed(() => files.value.some((f) => f.uploading));
  const uploadedIds = computed(() =>
    files.value.flatMap((f) => (f.id ? [f.id] : [])),
  );

  async function upload(file: File) {
    uploadCount += 1;
    const key = `upload-${uploadCount.toString()}`;
    const url = URL.createObjectURL(file);
    files.value.push({
      key,
      id: null,
      name: file.name,
      url,
      preview: file.type.startsWith('image/') ? url : null,
      uploading: true,
    });

    try {
      const uploaded = await api.createTemporaryFile({ file });
      const current = files.value.find((f) => f.key === key);
      if (current) {
        current.id = uploaded.id;
        current.uploading = false;
      }
    } catch {
      remove(key);
      quasar.notify({
        type: 'negative',
        message: t('finance.capture.uploadFailed'),
      });
    }
  }

  function add(list: readonly File[]) {
    for (const file of list) {
      void upload(file);
    }
  }

  function remove(key: string) {
    const file = files.value.find((f) => f.key === key);
    if (file && isBlob(file)) {
      URL.revokeObjectURL(file.url ?? '');
    }
    files.value = files.value.filter((f) => f.key !== key);
  }

  /** Replaces the list, e.g. with a restored draft's or an empty one. */
  function reset(next: ReceiptFile[] = []) {
    files.value.filter(isBlob).forEach((f) => {
      URL.revokeObjectURL(f.url ?? '');
    });
    files.value = next;
  }

  onBeforeUnmount(() => {
    reset();
  });

  return { files, uploading, uploadedIds, add, remove, reset };
}
