import Cron from "croner";
import prisma from "@/client";
import moment from "moment";

export const removeExpiredTokens = () => {
  Cron(
    "0 2 * * *",
    {
      name: "token-removal-jpb",
    },
    () => {
      // TODO Get from config
      const refDate = moment().subtract(1, "months").toDate();

      prisma.token.deleteMany({
        where: {
          expiresAt: {
            lte: refDate,
          },
        },
      });
    },
  );
};
