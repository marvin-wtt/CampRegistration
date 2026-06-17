import httpStatus from 'http-status';
import type { Prisma, User } from '#generated/prisma/client.js';
import ApiError from '#utils/ApiError';
import { encryptPassword } from '#core/encryption';
import { BaseService } from '#core/base/BaseService';
import { injectable } from 'inversify';

@injectable()
export class SetupService extends BaseService {
  /**
   * The application requires setup until the first ADMIN user exists. Once an
   * admin is present, the setup endpoints are permanently closed.
   */
  async isSetupRequired(): Promise<boolean> {
    const adminCount = await this.prisma.user.count({
      where: { role: 'ADMIN' },
    });

    return adminCount === 0;
  }

  async createInitialAdmin(data: {
    name: string;
    email: string;
    password: string;
    locale?: string;
  }): Promise<User> {
    const password = await encryptPassword(data.password);

    // Guard inside a transaction so a concurrent request can't create a second
    // bootstrap admin through this open endpoint.
    return this.prisma.$transaction(async (tx) => {
      const adminCount = await tx.user.count({ where: { role: 'ADMIN' } });
      if (adminCount > 0) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Setup already completed');
      }

      const existing = await tx.user.findUnique({
        where: { email: data.email },
      });
      if (existing) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
      }

      const createData: Prisma.UserCreateInput = {
        name: data.name,
        email: data.email,
        password,
        role: 'ADMIN',
        emailVerified: true,
        locale: data.locale,
      };

      return tx.user.create({ data: createData });
    });
  }
}
