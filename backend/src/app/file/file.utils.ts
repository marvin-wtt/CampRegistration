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

// Multer names the fields of a multi-file upload `files[<key>]`.
export function extractKeyFromFieldName(fieldName: string): string {
  const match = /^files\[(.+)]$/.exec(fieldName);
  return match ? match[1] : fieldName;
}
