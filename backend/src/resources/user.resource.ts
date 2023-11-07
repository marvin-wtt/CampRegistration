import { Camp, User } from "@prisma/client";
import { campResource } from "./index";

export type UserInput = Pick<User, "id" | "name" | "email">;
export type UserDetailedInput = UserInput &
  Pick<User, "emailVerified" | "locale">;

const userResource = (user: UserInput) => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
};

export const userDetailedResource = (user: UserDetailedInput) => {
  return {
    ...userResource(user),
    locale: user.locale,
    emailVerified: user.emailVerified,
  };
};

export const userCampResource = (user: UserInput, camps: Camp[]) => {
  return {
    ...userResource(user),
    camps: camps.map((value) => campResource(value)),
  };
};

export default userResource;
