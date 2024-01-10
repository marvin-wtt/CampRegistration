import type { Registration } from '@camp-registration/common/entities';
import { useCampDetailsStore } from 'stores/camp-details-store';
import { useRegistrationsStore } from 'stores/registration-store';

export function useRegistrationHelper() {
  const campDetailsStore = useCampDetailsStore();
  const registrationStore = useRegistrationsStore();

  function unknownValue(
    registration: Registration,
    keyName: string,
    index = 0,
  ): unknown {
    const campData = registration.campData;

    if (!(keyName in campData) || campData[keyName].length < index + 1) {
      return undefined;
    }

    return campData[keyName][index];
  }

  function stringValue(
    registration: Registration,
    keyName: string,
  ): string | undefined {
    const value = unknownValue(registration, keyName);
    if (typeof value !== 'string') {
      return undefined;
    }

    return value;
  }

  function numericValue(
    registration: Registration,
    keyName: string,
  ): number | undefined {
    const value = unknownValue(registration, keyName);
    if (typeof value !== 'number') {
      return undefined;
    }

    return value;
  }

  function booleanValue(
    registration: Registration,
    keyName: string,
  ): boolean | undefined {
    const value = unknownValue(registration, keyName);
    if (typeof value !== 'boolean') {
      return undefined;
    }

    return value;
  }

  function dateValue(
    registration: Registration,
    keyName: string,
  ): Date | undefined {
    const value = stringValue(registration, keyName);
    if (!value) {
      return undefined;
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return undefined;
    }

    return date;
  }

  function firstName(registration: Registration): string | undefined {
    return stringValue(registration, 'firstName');
  }

  function lastName(registration: Registration): string | undefined {
    return stringValue(registration, 'lastName');
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
    return dateValue(registration, 'dateOfBirth');
  }

  function age(registration: Registration): number | undefined {
    // Try to use age key first
    const age = numericValue(registration, 'age');
    if (age) {
      return age;
    }

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
    return stringValue(registration, 'gender');
  }

  function country(registration: Registration): string | undefined {
    return stringValue(registration, 'country');
  }

  function counselor(registration: Registration): boolean {
    return booleanValue(registration, 'counselor') ?? false;
  }

  function participant(registration: Registration): boolean {
    return booleanValue(registration, 'participant') ?? true;
  }

  function waitingList(registration: Registration): boolean {
    return booleanValue(registration, 'waitingList') ?? false;
  }

  function email(registration: Registration): string | undefined {
    return stringValue(registration, 'email');
  }

  function secondaryEmail(registration: Registration): string | undefined {
    return stringValue(registration, 'secondaryEmail');
  }

  function emails(registration: Registration): string[] {
    const primary = email(registration);
    const secondary = email(registration);

    return [primary, secondary].filter((str) => str !== undefined) as string[];
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
    counselor,
    participant,
    waitingList,
    email,
    secondaryEmail,
    emails,
    unknownValue,
    stringValue,
    numericValue,
    booleanValue,
    dateValue,
  };
}
