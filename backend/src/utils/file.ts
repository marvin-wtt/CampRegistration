export function fileNameExtension(fileName: string): string {
  if (!fileName.includes('.')) {
    return '';
  }

  const extension = fileName.split('.').pop() ?? '';

  return `.${extension}`;
}
