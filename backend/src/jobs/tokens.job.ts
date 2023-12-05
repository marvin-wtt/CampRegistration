import Cron from "croner";
import { tokenService } from "@/services";

export const removeExpiredTokens = () => {
  const jobConfig = {
    name: "token-removal-jpb",
  };

  return Cron("0 3 * * *", jobConfig, async () => {
    await tokenService.deleteExpiredTokens();
  });
};
