import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import argon2 from 'argon2';
import bcrypt from 'bcryptjs';
import ApiError from '#utils/ApiError';
import { AuthService } from '#app/auth/auth.service';
import { UserService } from '#app/user/user.service';
import { TokenService } from '#app/token/token.service';
import type { User } from '#generated/prisma/client.js';

const buildUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-1',
    email: 'test@email.net',
    password: '',
    locked: false,
    ...overrides,
  }) as User;

describe('AuthService.loginWithEmailPassword', () => {
  it('rehashes the password to argon2 when the stored hash is bcrypt', async () => {
    const userService = mock<UserService>();
    const tokenService = mock<TokenService>();
    const service = new AuthService(userService, tokenService);

    const bcryptHash = bcrypt.hashSync('Password1', 8);
    const user = buildUser({ password: bcryptHash });
    userService.getUserByEmail.mockResolvedValue(user);

    await service.loginWithEmailPassword('test@email.net', 'Password1');

    expect(userService.updateUserById).toHaveBeenCalledWith('user-1', {
      password: 'Password1',
    });
  });

  it('does not rehash the password when the stored hash is already argon2', async () => {
    const userService = mock<UserService>();
    const tokenService = mock<TokenService>();
    const service = new AuthService(userService, tokenService);

    const argon2Hash = await argon2.hash('Password1');
    const user = buildUser({ password: argon2Hash });
    userService.getUserByEmail.mockResolvedValue(user);

    await service.loginWithEmailPassword('test@email.net', 'Password1');

    expect(userService.updateUserById).not.toHaveBeenCalled();
  });

  it('throws when the password does not match', async () => {
    const userService = mock<UserService>();
    const tokenService = mock<TokenService>();
    const service = new AuthService(userService, tokenService);

    const argon2Hash = await argon2.hash('Password1');
    const user = buildUser({ password: argon2Hash });
    userService.getUserByEmail.mockResolvedValue(user);

    await expect(
      service.loginWithEmailPassword('test@email.net', 'wrong'),
    ).rejects.toBeInstanceOf(ApiError);
    expect(userService.updateUserById).not.toHaveBeenCalled();
  });

  it('throws when the user is locked, after rehashing the password', async () => {
    const userService = mock<UserService>();
    const tokenService = mock<TokenService>();
    const service = new AuthService(userService, tokenService);

    const bcryptHash = bcrypt.hashSync('Password1', 8);
    const user = buildUser({ password: bcryptHash, locked: true });
    userService.getUserByEmail.mockResolvedValue(user);

    await expect(
      service.loginWithEmailPassword('test@email.net', 'Password1'),
    ).rejects.toBeInstanceOf(ApiError);
    expect(userService.updateUserById).toHaveBeenCalledWith('user-1', {
      password: 'Password1',
    });
  });
});
