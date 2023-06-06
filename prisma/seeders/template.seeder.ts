import { PrismaPromise, type Prisma, PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import data from "./json/templates.json";

const name = "template";

const run = (prisma: PrismaClient): PrismaPromise<any> => {
  const campId = "98daa32a-f6dd-41bd-b723-af10071459ad";

  const templates: Prisma.TemplateCreateManyInput[] = [];

  for (const template of data) {
    templates.push({
      id: randomUUID(),
      campId: campId,
      data: template,
    });
  }

  return prisma.template.createMany({
    data: templates,
  });
};

export default {
  name,
  run,
};
