import bcrypt from "bcryptjs";

export const encryptPassword = async (password: string) => {
  return await bcrypt.hash(password, 8);
};

export const isPasswordMatch = async (
  password: string,
  userPassword: string,
) => {
  return bcrypt.compare(password, userPassword);
};
