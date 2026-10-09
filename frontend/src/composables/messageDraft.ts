import { computed, ref, type Ref } from 'vue';

/**
 * The composer's unsent message, kept in this browser so a reload or a lost
 * tab doesn't take it. Recipients are stored as registration ids and resolved
 * again on restore; attachments are only named, since the uploads they point
 * to belong to the session.
 */
export interface StoredMessageDraft {
  recipients: StoredRecipient[];
  subject: string;
  body: string;
  priority: 'high' | 'normal' | 'low';
  replyTo: string;
  attachmentNames: string[];
  savedAt: string;
}

export type StoredRecipient =
  | {
      type: 'group';
      name: string;
      registrationIds: string[];
      country?: string | null;
    }
  | { type: 'registration'; registrationId: string };

const PREFIX = 'message-draft:';

// Shared per key, so every user of a key sees the same draft.
const drafts = new Map<string, Ref<StoredMessageDraft | null>>();

function read(key: string): StoredMessageDraft | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as StoredMessageDraft) : null;
  } catch {
    return null;
  }
}

export function useMessageDraft(key: () => string | null) {
  function state(): Ref<StoredMessageDraft | null> | null {
    const current = key();
    if (!current) {
      return null;
    }
    let draft = drafts.get(current);
    if (!draft) {
      draft = ref(read(current));
      drafts.set(current, draft);
    }
    return draft;
  }

  const draft = computed<StoredMessageDraft | null>(
    () => state()?.value ?? null,
  );

  /** Whether the draft reached storage; false where storage is unavailable. */
  function save(value: Omit<StoredMessageDraft, 'savedAt'>): boolean {
    const current = key();
    const target = state();
    if (!current || !target) {
      return false;
    }
    const stored = { ...value, savedAt: new Date().toISOString() };
    target.value = stored;
    try {
      localStorage.setItem(PREFIX + current, JSON.stringify(stored));
      return true;
    } catch {
      return false;
    }
  }

  function clear() {
    const current = key();
    const target = state();
    if (!current || !target) {
      return;
    }
    target.value = null;
    try {
      localStorage.removeItem(PREFIX + current);
    } catch {
      // Nothing stored to remove.
    }
  }

  return { draft, save, clear };
}
