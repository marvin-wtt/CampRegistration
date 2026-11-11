// Pure list updates for id-keyed collections; each returns a new array so
// watchers and computeds see the change.

interface Identified {
  id: string;
}

export function replaceById<T extends Identified>(list: T[], item: T): T[] {
  return list.map((entry) => (entry.id === item.id ? item : entry));
}

export function replaceAllById<T extends Identified>(
  list: T[],
  items: T[],
): T[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  return list.map((entry) => byId.get(entry.id) ?? entry);
}

export function upsertById<T extends Identified>(list: T[], item: T): T[] {
  return list.some((entry) => entry.id === item.id)
    ? replaceById(list, item)
    : [...list, item];
}

export function removeById<T extends Identified>(list: T[], id: string): T[] {
  return list.filter((entry) => entry.id !== id);
}
