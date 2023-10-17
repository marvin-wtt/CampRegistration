export function formatPersonName(name: string | undefined): string {
  if (!name) {
    return 'Undefined';
  }

  // TODO Take specials into account (e.g.
  return name
    .toLowerCase()
    .replace(/(^|\s|-)(\w)/g, (match: string, p1: string, p2: string) => {
      return p1 + p2.toUpperCase();
    });
}
