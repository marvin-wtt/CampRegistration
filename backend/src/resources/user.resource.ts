import { Camp, User } from "@prisma/client";
import { campResource } from "./index";

export type UserInput = Pick<User, "id" | "name" | "email">;

const userResource = (user: UserInput) => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
};

export const userCampResource = (user: UserInput, camps: Camp[]) => {
  return {
    ...userResource(user),
    camps: camps.map((value) => campResource(value)),
  };
};

export default userResource;
