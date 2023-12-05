import { removeExpiredTokens } from "@/jobs/tokens.job";
import { deleteTemporaryFiles, deleteUnusedFiles } from "@/jobs/files.job";

export const startJobs = () => {
  removeExpiredTokens();
  deleteUnusedFiles();
  deleteTemporaryFiles();
};
