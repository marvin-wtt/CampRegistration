import { type Prisma, PrismaClient } from "@prisma/client";
import data from "./json/registrations.json";
import { ulid } from "@/utils/ulid"

const name = "registration";
const run = (prisma: PrismaClient) => {
  const campId = "01H4BK6DFQAVVB5TDS5BJ1AB95 ";

  const registrations: Prisma.RegistrationCreateManyInput[] = [];

  for (const registration of data) {
    // Boolean checkboxes
    convertBooleanCheckbox("waiting_list", registration);
    convertBooleanCheckbox("agreement_rules", registration);
    convertBooleanCheckbox("agreement_privacy", registration);
    convertBooleanCheckbox("agreement_forward_list_participants", registration);
    convertBooleanCheckbox(
      "agreement_general_terms_and_conditions",
      registration
    );
    // Integers
    convertStringToInt("guardian_permission_leave", registration);

    registrations.push({
      id: ulid(),
      campId: campId,
      data: registration,
    });
  }

  return prisma.registration.createMany({
    data: registrations,
  });
};

function convertBooleanCheckbox(
  key: string,
  registration: Record<string, any>
): void {
  if (!(key in registration) || !Array.isArray(registration[key])) {
    return;
  }

  registration[key] =
    registration[key].length === 1 && registration[key][0] === "1";
}

function convertStringToInt(
  key: string,
  registration: Record<string, any>
): void {
  if (!(key in registration)) {
    return;
  }

  registration[key] = parseInt(registration[key]);
}

export default {
  name,
  run,
};
