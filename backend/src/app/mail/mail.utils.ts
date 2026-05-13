import type { AddressLike, MailAttachment } from '#app/mail/mail.types';
import { FileService } from '#app/file/file.service';
import { resolve } from '#core/ioc/container';

export function addressLikeToString(to: AddressLike): string {
  const items = Array.isArray(to) ? to : [to];
  return items
    .map((entry) => (typeof entry === 'string' ? entry : entry.address))
    .join(', ');
}

export async function resolveFileAttachments(
  ids: string[],
): Promise<MailAttachment[]> {
  if (!ids.length) return [];

  const fileService = resolve(FileService);

  const results = await Promise.all(
    ids.map(async (id): Promise<MailAttachment | null> => {
      const file = await fileService.getFileById(id);
      if (!file) return null;

      return {
        filename: file.originalName,
        content: fileService.getFileStream(file),
        contentType: file.type,
      };
    }),
  );

  return results.filter((a): a is MailAttachment => a !== null);
}
