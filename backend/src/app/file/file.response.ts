import { pipeline } from 'stream/promises';
import type { Response } from 'express';
import httpStatus from 'http-status';
import contentDisposition from 'content-disposition';
import type { File } from '#generated/prisma/client.js';
import ApiError from '#utils/ApiError';
import logger from '#core/logger';
import { isClientDisconnect } from '#utils/stream';
import type { FileService } from './file.service.js';

function buildContentDisposition(
  originalName: string,
  download: boolean | undefined,
): string {
  const type = download ? 'attachment' : 'inline';
  try {
    return contentDisposition.create(originalName, { type });
  } catch {
    // originalName contains characters rejected by RFC 6266 (e.g. CR/LF);
    return contentDisposition.create(undefined, { type });
  }
}

/** Streams a stored file as the response, inline or as an attachment. */
export async function sendFile(
  res: Response,
  fileService: FileService,
  file: File,
  download?: boolean,
): Promise<void> {
  if (file.uploadStatus === 'PENDING') {
    throw new ApiError(httpStatus.CONFLICT, 'File upload is still in progress');
  }

  const fileStream = await fileService.getFileStream(file);

  res.contentType(file.type);
  res.setHeader(
    'Content-disposition',
    buildContentDisposition(file.originalName, download),
  );

  // pipeline (unlike pipe) propagates stream errors and tears the whole
  // chain down when either side fails or the client disconnects.
  try {
    await pipeline(fileStream, res);
  } catch (error) {
    if (isClientDisconnect(error)) {
      return;
    }

    if (!res.headersSent) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Failed to read file',
      );
    }

    // Mid-stream failure: the status is already out, so destroying the
    // socket is the only way to signal a truncated response.
    logger.error(`Failed to stream file "${file.id}"`, error);
    res.destroy();
  }
}
