import prisma from "../client";

const campManagerExistsWithUserIdAndCampId = async (
  campId: string,
  userId: string
): Promise<boolean> => {
  return await prisma.campManager
    .findFirst({
      where: {
        campId: campId,
        userId: userId,
      },
    })
    .then((value) => value !== null);
};

export default {
  campManagerExistsWithUserIdAndCampId,
};
