import { tokenService } from "services";
import logger from "config/logger";

export const removeExpiredTokens = async () => {
  const result = await tokenService.deleteExpiredTokens();
  logger.info(`Removed ${result.count} tokens.`);
};
