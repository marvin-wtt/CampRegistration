// Strips characters that are unsafe in a Content-Disposition filename or on
// disk: control chars (header/CRLF injection), path separators, and reserved
// characters. Unicode letters are kept so international names survive.
export function safeFileName(name: string, fallback = 'file'): string {
  const sanitized = name
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1f\x7f]/g, '')
    .replace(/[/\\:*?"<>|]/g, '')
    .replace(/\s+/g, '_')
    .replace(/^[._]+|[._]+$/g, '')
    .slice(0, 200);

  return sanitized || fallback;
}

export function fileNameExtension(fileName: string): string {
  if (!fileName.includes('.')) {
    return '';
  }

  const extension = fileName.split('.').pop() ?? '';

  // Reject extensions containing path separators or non-alphanumeric characters
  // to prevent path traversal via crafted filenames.
  if (!/^[a-zA-Z0-9]+$/.test(extension)) {
    return '';
  }

  return `.${extension}`;
}
