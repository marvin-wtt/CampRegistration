import { type Prisma, PrismaClient } from "@prisma/client";
import data from "./json/templates.json";
import { ulid } from "../../src/utils/ulid"

const name = "template";

const run = (prisma: PrismaClient) => {
  const campId = "01H4BK6DFQAVVB5TDS5BJ1AB95 ";

  const templates: Prisma.TemplateCreateManyInput[] = [];

  for (const template of data) {
    templates.push({
      id: ulid(),
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
