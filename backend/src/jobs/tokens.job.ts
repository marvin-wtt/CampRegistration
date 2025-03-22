import tokenService from '#app/token/token.service';
import logger from '#core/logger';

export const removeExpiredTokens = async () => {
  const result = await tokenService.deleteExpiredTokens();
  logger.info(`Removed ${result.count.toString()} token(s).`);
};
