import tokenService from 'app/token/token.service';
import logger from 'config/logger';

export const removeExpiredTokens = async () => {
  const result = await tokenService.deleteExpiredTokens();
  logger.info(`Removed ${result.count} token(s).`);
};
