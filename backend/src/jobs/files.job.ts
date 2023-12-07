import Cron from "croner/types/croner";
import { fileService } from "services";

export const deleteUnusedFiles = () => {
  const jobConfig = {
    name: "file-deletion-job",
  };

  return Cron("0 4 * * *", jobConfig, async () => {
    await fileService.deleteUnreferencedFiles();
  });
};

export const deleteTemporaryFiles = () => {
  const jobConfig = {
    name: "tmp-file-deletion-job",
  };

  return Cron("30 3 * * *", jobConfig, async () => {
    await fileService.deleteTempFiles();
  });
};
