import type { ServiceFile } from '@camp-registration/common/entities';

export interface MissingSlotFile {
  slot: string;
  // The group lacking it; null when the event has a single group.
  group: string | null;
  // The language lacking it; null when the group has no file at all.
  locale: string | null;
}

type SlotFile = Pick<ServiceFile, 'field' | 'locale' | 'group'>;

/**
 * The files a group's readers would miss in slots that already hold some. It
 * mirrors how the server picks a slot's file: a group's own files if it has
 * any, else those for every group — never another group's. Within those, a
 * file without a language covers every language.
 */
export function missingSlotFiles(
  files: readonly SlotFile[],
  { locales, groups }: { locales: string[]; groups: string[] },
): MissingSlotFile[] {
  const bySlot = new Map<string, SlotFile[]>();
  for (const file of files) {
    if (file.field) {
      bySlot.set(file.field, [...(bySlot.get(file.field) ?? []), file]);
    }
  }

  const checked: (string | null)[] = groups.length > 1 ? groups : [null];

  return [...bySlot.entries()].flatMap(([slot, slotFiles]) =>
    checked.flatMap((group): MissingSlotFile[] => {
      const pool = group ? poolFor(slotFiles, group) : slotFiles;
      if (pool.length === 0) {
        return [{ slot, group, locale: null }];
      }
      if (pool.some((file) => file.locale === null)) {
        return [];
      }

      const covered = new Set(pool.map((file) => file.locale));
      return locales
        .filter((locale) => !covered.has(locale))
        .map((locale) => ({ slot, group, locale }));
    }),
  );
}

function poolFor(files: SlotFile[], group: string): SlotFile[] {
  const own = files.filter((file) => file.group === group);
  return own.length > 0 ? own : files.filter((file) => file.group === null);
}
