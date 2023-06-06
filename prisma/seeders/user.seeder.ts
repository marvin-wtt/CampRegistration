import { PrismaClient, PrismaPromise } from "@prisma/client";

const name = "user";
const run = (prisma: PrismaClient): PrismaPromise<any> => {
  return prisma.user.create({
    data: {
      id: "0a9b8159-d6b8-438c-9557-9dcaa52d0270",
      name: "John Doe",
      email: "john@example.com",
      password: "$2a$12$f4dwwAVJRqlz4okStqitmuC5UKrDhWMFjZEtviqrEJp4.in2uFPAK", // "password"
    },
  });
};

export default {
  name,
  run,
};
