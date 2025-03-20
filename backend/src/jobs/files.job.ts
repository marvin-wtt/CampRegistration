import fileService from '#app/file/file.service';

export const deleteUnusedFiles = async () => {
  await fileService.deleteUnreferencedFiles();
};

export const deleteUnassignedFiles = async () => {
  await fileService.deleteUnassignedFiles();
};

export const deleteTemporaryFiles = async () => {
  await fileService.deleteTempFiles();
};
