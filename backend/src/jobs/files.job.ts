import { FileService } from '#app/file/file.service';
import { resolve } from '#core/ioc/container';

export const deleteUnusedFiles = async () => {
  await resolve(FileService).deleteUnreferencedFiles();
};

export const deleteUnassignedFiles = async () => {
  await resolve(FileService).deleteUnassignedFiles();
};

export const deleteTemporaryFiles = async () => {
  await resolve(FileService).deleteTempFiles();
};
