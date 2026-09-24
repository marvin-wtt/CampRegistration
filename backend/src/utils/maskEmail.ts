// Keeps only the local part's first character and the domain
// (`jane.doe@example.com` → `j***@example.com`).
export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@');
  if (at <= 0) {
    return '***';
  }
  return `${email.charAt(0)}***${email.slice(at)}`;
}
