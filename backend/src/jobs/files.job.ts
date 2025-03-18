import fileService from '#app/file/file.service';
import logger from '#core/logger';

export const deleteUnusedFiles = async () => {
  const fileCount = await fileService.deleteUnreferencedFiles();
  logger.info(`Deleted ${fileCount.toString()} unused file(s) from disk`);
};

export const deleteUnassignedFiles = async () => {
  const fileCount = await fileService.deleteUnassignedFiles();
  logger.info(`Deleted ${fileCount.toString()} unreferenced file(s) from disk`);
};

export const deleteTemporaryFiles = async () => {
  const fileCount = await fileService.deleteTempFiles();
  logger.info(
    `Deleted ${fileCount.toString()} unused temporary file(s) from disk`,
  );
};
