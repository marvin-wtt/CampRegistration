import { PrismaClient } from "@prisma/client";
import form from "./json/campForm.json";
import { PrismaPromise } from "@prisma/client";

const name = "camp";

const run = (prisma: PrismaClient): PrismaPromise<any> => {
  return prisma.camp.create({
    data: {
      id: "98daa32a-f6dd-41bd-b723-af10071459ad",
      public: true,
      countries: ["de", "fr"],
      name: {
        de: "DFJW Ballonsommercamp 2023",
        fr: "OFAJ Camp d'été en montgolfière 2023",
      },
      maxParticipants: {
        de: "16",
        fr: "16",
      },
      minAge: 13,
      maxAge: 19,
      startAt: new Date("2023-07-29T00:00:00"),
      endAt: new Date("2023-08-05T00:00:00"),
      location: {
        de: "Bartholomä",
        fr: "Bartholomä",
      },
      price: 250.0,
      form: form,
      campManager: {
        create: [
          {
            userId: "0a9b8159-d6b8-438c-9557-9dcaa52d0270",
          },
        ],
      },
    },
  });
};

export default {
  name,
  run,
};
