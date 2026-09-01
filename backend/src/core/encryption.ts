import bcrypt from 'bcryptjs';
import argon2 from 'argon2';

export const encryptPassword = async (password: string) => {
  return await argon2.hash(password);
};

export const isPasswordMatch = async (
  password: string,
  userPassword: string,
): Promise<boolean> => {
  if (isPasswordBcrypt(userPassword)) {
    return bcrypt.compare(password, userPassword);
  }

  return argon2.verify(userPassword, password);
};

export function passwordNeedsRehash(userPassword: string): boolean {
  return isPasswordBcrypt(userPassword);
}

function isPasswordBcrypt(password: string): boolean {
  return password.startsWith('$2');
}
