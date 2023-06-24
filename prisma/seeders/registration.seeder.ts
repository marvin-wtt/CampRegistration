import { PrismaPromise, type Prisma, PrismaClient } from "@prisma/client";
import data from "./json/registrations.json";
import { randomUUID } from "crypto";

const name = "registration";
const run = (prisma: PrismaClient) => {
  const campId = "98daa32a-f6dd-41bd-b723-af10071459ad";

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
    convertStringToInt("legal_guardian_permission_leave", registration);

    registrations.push({
      id: randomUUID(),
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
