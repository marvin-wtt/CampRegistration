import { User } from '@prisma/client';
import * as OTPAuth from 'otpauth';
import config from '#config/index.js';
import prisma from '#client.js';
import ApiError from '#utils/ApiError.js';
import httpStatus from 'http-status';

export const generateTOTP = async (user: User) => {
  const secret = new OTPAuth.Secret();

  const totp = new OTPAuth.TOTP({
    issuer: config.appName,
    label: user.email,
    secret,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
  });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      totpSecret: secret.base32,
    },
  });

  // Generate the URL
  return {
    url: totp.toString(),
    secret: secret.base32,
  };
};

export const validateTOTP = async (user: User, token: string) => {
  await verifyTOTP(user, token);

  // Enable 2FA after validation
  await prisma.user.update({
    where: { id: user.id },
    data: {
      twoFactorEnabled: true,
    },
  });
};

export const verifyTOTP = async (user: User, token: string) => {
  if (!user?.totpSecret) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'TOTP setup required');
  }

  // Create a TOTP object with the user's secret
  const totp = new OTPAuth.TOTP({
    secret: OTPAuth.Secret.fromBase32(user.totpSecret),
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
  });

  // Validate the token
  const delta = totp.validate({ token, window: 1 });

  if (delta === null) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid TOTP');
  }
};

const disableTOTP = async (user: User) => {
  await prisma.user.update({
    where: { id: user.id },
    data: {
      totpSecret: null,
      twoFactorEnabled: false,
    },
  });
};

export default { generateTOTP, validateTOTP, verifyTOTP, disableTOTP };
