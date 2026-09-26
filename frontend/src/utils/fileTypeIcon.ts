export function fileIcon(type: string): string {
  if (type.startsWith('image/')) {
    return 'image';
  }
  if (type === 'application/pdf') {
    return 'picture_as_pdf';
  }
  if (type.startsWith('video/')) {
    return 'movie';
  }
  if (type.startsWith('audio/')) {
    return 'audiotrack';
  }

  return 'description';
}

export function fileTileClass(type: string): string {
  if (type.startsWith('image/') || type.startsWith('video/')) {
    return 'tile--media';
  }
  if (type === 'application/pdf') {
    return 'tile--document';
  }

  return 'tile--other';
}
