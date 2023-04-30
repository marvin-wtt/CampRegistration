export function formatPersonName(name: string): string {
  return name
    .toLowerCase()
    .replace(/(^|\s|-)(\w)/g, (match: string, p1: string, p2: string) => {
      return p1 + p2.toUpperCase();
    });
}
