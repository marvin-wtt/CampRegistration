import { describe, expect, it } from 'vitest';
import { TokenFactory, UserFactory } from '../../../prisma/factories/index.js';
import prisma from '../utils/prisma.js';
import moment from 'moment';
import { resolve } from '#core/ioc/container';
import { TokenService } from '#app/token/token.service';

describe('token cleanup', () => {
  describe('purgeExpiredTokens', () => {
    it('should delete tokens that are expired', async () => {
      const validToken = await TokenFactory.create({
        user: { create: UserFactory.build() },
        expiresAt: moment().add('1', 'day').toDate(),
      });
      const expiredToken = await TokenFactory.create({
        user: { create: UserFactory.build() },
        expiresAt: moment().subtract('1', 'day').toDate(),
      });

      await resolve(TokenService).purgeExpiredTokens();

      expect(
        await prisma.token.findFirst({ where: { id: validToken.id } }),
      ).toBeDefined();
      expect(
        await prisma.token.findFirst({ where: { id: expiredToken.id } }),
      ).toBeNull();
    });
  });
});
