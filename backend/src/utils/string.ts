export function uniqueLowerCase(emails: string[]): string[] {
  return [...new Set(emails.map((value) => value.trim().toLowerCase()))];
}
