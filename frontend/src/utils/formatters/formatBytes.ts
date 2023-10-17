export function formatBytes(bytes: number, decimals?: number) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  if (bytes == 0) {
    return `${bytes} ${sizes[0]}`;
  }
  const k = 1024;
  const dm = decimals || 2;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
