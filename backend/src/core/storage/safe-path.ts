import path from 'path';

function isDirectoryPathValid(filePath: string, rootPath: string): boolean {
  // Make sure, that the file path does not escape the root path
  const resolvedFilePath = path.resolve(filePath);
  const resolvedRootPath = path.resolve(rootPath);

  return resolvedFilePath.startsWith(resolvedRootPath);
}

export function safeJoinFilePath(rootPath: string, filename: string): string {
  const filePath = path.join(rootPath, filename);

  if (!isDirectoryPathValid(filePath, rootPath)) {
    throw new Error('Invalid file');
  }

  return filePath;
}
