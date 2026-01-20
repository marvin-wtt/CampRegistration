import { AppJob } from '#core/base/AppJob';
import { inject, injectable } from 'inversify';
import { TokenService } from '#app/token/token.service.js';

@injectable()
export class ExpiredTokenJob implements AppJob {
  name = 'token:cleanup';
  pattern = '0 3 * * *';

  constructor(
    @inject(TokenService) private readonly tokenService: TokenService,
  ) {}

  async run(): Promise<void> {
    await this.tokenService.deleteExpiredTokens();
  }
}
