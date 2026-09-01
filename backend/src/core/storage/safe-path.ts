import path from 'path';

/**
 * True when `target` resolves to a location strictly inside `root`. The
 * trailing separator prevents sibling directories sharing the root's name
 * prefix (`uploads-evil` vs `uploads`) from passing, and rules out the root
 * itself so an empty filename can never address the whole directory.
 */
export function isPathInside(target: string, root: string): boolean {
  const resolvedTarget = path.resolve(target);
  const resolvedRoot = path.resolve(root);

  return resolvedTarget.startsWith(resolvedRoot + path.sep);
}

export function safeJoinFilePath(rootPath: string, filename: string): string {
  const filePath = path.join(rootPath, filename);

  if (!isPathInside(filePath, rootPath)) {
    throw new Error('Invalid file');
  }

  return filePath;
}
