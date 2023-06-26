import Cron from "croner/types/croner";

export const deleteUnusedFiles = () => {
  Cron(
    "0 3 * * *",
    {
      name: "file-deletion-jpb",
    },
    () => {
      // TODO Go through all files and check if there is a reference in the DB. If not, delete it
      //  Maybe just do a diff and mass delete
    }
  );
};
