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
