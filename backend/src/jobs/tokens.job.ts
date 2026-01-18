import { TokenService } from '#app/token/token.service';
import logger from '#core/logger';
import { resolve } from '#core/ioc/container';

export const removeExpiredTokens = async () => {
  const tokenService = resolve(TokenService);
  const result = await tokenService.deleteExpiredTokens();
  logger.info(`Removed ${result.count.toString()} token(s).`);
};
