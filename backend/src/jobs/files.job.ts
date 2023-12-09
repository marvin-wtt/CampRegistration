import { fileService } from "services";
import logger from "config/logger";

export const deleteUnusedFiles = async () => {
  const fileCount = await fileService.deleteUnreferencedFiles();
  logger.info(`Deleted ${fileCount} unused files from disk`);
};

export const deleteTemporaryFiles = async () => {
  const fileCount = await fileService.deleteTempFiles();
  logger.info(`Deleted ${fileCount} unused temporary files from disk`);
};
