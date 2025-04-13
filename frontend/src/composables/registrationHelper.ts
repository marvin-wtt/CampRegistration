import type { Registration } from '@camp-registration/common/entities';
import { useCampDetailsStore } from 'stores/camp-details-store';
import { useRegistrationsStore } from 'stores/registration-store';

export function useRegistrationHelper() {
  const campDetailsStore = useCampDetailsStore();
  const registrationStore = useRegistrationsStore();

  function firstName(registration: Registration): string | undefined {
    return registration.computedData.firstName ?? undefined;
  }

  function lastName(registration: Registration): string | undefined {
    return registration.computedData.lastName ?? undefined;
  }

  function fullName(registration: Registration): string | undefined {
    const firstNameValue = firstName(registration);
    const lastNameValue = lastName(registration);

    return firstNameValue || lastNameValue
      ? `${firstNameValue} ${lastNameValue}`.trim()
      : undefined;
  }

  function uniqueName(registration: Registration): string | undefined {
    const others = registrationStore.data;

    const firstNameValue = firstName(registration);
    const lastNameValue = lastName(registration);

    // If no first name is found, try the full name
    if (!firstNameValue) {
      return fullName(registration);
    }

    // No formatting is needed if no last name is defined or there are no others
    if (lastNameValue === undefined || others === undefined) {
      return firstNameValue;
    }

    // Search for people with same name
    const sameFirstName = others.filter((value) => {
      return (
        value !== registration &&
        firstName(value)?.toLowerCase() === firstNameValue.toLowerCase()
      );
    });

    // If no match was found, this can be ignored.
    if (sameFirstName.length === 0) {
      return firstNameValue;
    }

    // Search for people who's last name starts with the same letter
    const sameLastNameStart = sameFirstName.filter((value) => {
      return (
        lastName(value)?.toLowerCase().charAt(0) ===
        lastNameValue.toLowerCase().charAt(0)
      );
    });

    // If only one match was found, use the first letter of the last name as abbreviation.
    return sameLastNameStart.length > 0
      ? `${firstNameValue} ${lastNameValue}`
      : `${firstNameValue} ${lastNameValue[0]}.`;
  }

  function dateOfBirth(registration: Registration): Date | undefined {
    return registration.computedData.dataOfBirth !== null
      ? new Date(registration.computedData.dataOfBirth)
      : undefined;
  }

  function age(registration: Registration): number | undefined {
    // Use date of birth instead
    const birthDate = dateOfBirth(registration);
    if (!birthDate) {
      return undefined;
    }

    const campStart = campDetailsStore.data?.startAt;
    const currentDate = campStart ? new Date(campStart) : new Date();
    const ageInMilliseconds = currentDate.getTime() - birthDate.getTime();
    const ageInYears = ageInMilliseconds / (1000 * 60 * 60 * 24 * 365.25);

    return Math.floor(ageInYears);
  }

  function gender(registration: Registration): string | undefined {
    return registration.computedData.gender ?? undefined;
  }

  function country(registration: Registration): string | undefined {
    return address(registration)?.country ?? undefined;
  }

  type Address = Registration['computedData']['address'];
  function address(registration: Registration): Address | undefined {
    return registration.computedData.address;
  }

  function role(registration: Registration): string | undefined {
    // Default to participant
    return registration.computedData.role ?? 'participant';
  }

  function participant(registration: Registration): boolean {
    return role(registration) === 'participant';
  }

  function email(registration: Registration): string | undefined {
    return registration.computedData.emails !== null &&
      registration.computedData.emails.length > 0
      ? registration.computedData.emails[0]
      : undefined;
  }

  function emails(registration: Registration): string[] {
    return registration.computedData.emails ?? [];
  }

  return {
    firstName,
    lastName,
    fullName,
    uniqueName,
    dateOfBirth,
    age,
    gender,
    country,
    address,
    role,
    participant,
    email,
    emails,
  };
}
