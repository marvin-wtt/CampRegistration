import fileService from 'app/file/file.service';
import logger from 'config/logger';

export const deleteUnusedFiles = async () => {
  const fileCount = await fileService.deleteUnreferencedFiles();
  logger.info(`Deleted ${fileCount} unused file(s) from disk`);
};

export const deleteUnassignedFiles = async () => {
  const fileCount = await fileService.deleteUnassignedFiles();
  logger.info(`Deleted ${fileCount} unreferenced file(s) from disk`);
};

export const deleteTemporaryFiles = async () => {
  const fileCount = await fileService.deleteTempFiles();
  logger.info(`Deleted ${fileCount} unused temporary file(s) from disk`);
};
