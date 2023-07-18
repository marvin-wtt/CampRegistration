import { useSettingsStore } from 'stores/settings-store';
import { Registration } from 'src/types/Registration';
import { useCampDetailsStore } from 'stores/camp-details-store';

export function useRegistrationHelper() {
  const settingsStore = useSettingsStore();
  const campDetailsStore = useCampDetailsStore();

  function stringValue(
    registration: Registration,
    keyName: string
  ): string | undefined {
    const key = settingsStore.getKey(keyName);
    if (!key || !(key in registration)) {
      return undefined;
    }

    const value = registration[key];
    if (typeof value !== 'string') {
      return undefined;
    }

    return value;
  }

  function booleanValue(
    registration: Registration,
    keyName: string
  ): boolean | undefined {
    const key = settingsStore.getKey(keyName);
    if (!key || !(key in registration)) {
      return undefined;
    }

    const value = registration[key];
    if (typeof value !== 'boolean') {
      return undefined;
    }

    return value;
  }

  function firstName(registration: Registration): string | undefined {
    return stringValue(registration, 'firstName');
  }

  function lastName(registration: Registration): string | undefined {
    return stringValue(registration, 'firstName');
  }

  function fullName(registration: Registration): string | undefined {
    const firstNameValue = firstName(registration);
    const lastNameValue = lastName(registration);

    return firstNameValue || lastNameValue
      ? `${firstNameValue} ${lastNameValue}`.trim()
      : undefined;
  }

  function dateOfBirth(registration: Registration): Date | undefined {
    const key = settingsStore.getKey('dateOfBirth');
    if (!key || !(key in registration)) {
      return undefined;
    }

    const dateOfBirth = registration[key];
    if (typeof dateOfBirth !== 'string') {
      return undefined;
    }

    const date = new Date(dateOfBirth);
    if (isNaN(date.getTime())) {
      return undefined;
    }

    return date;
  }

  function age(registration: Registration): number | undefined {
    // Try to use age key first
    const ageKey = settingsStore.getKey('age');
    if (ageKey && ageKey in registration) {
      // Type check
      const age = registration[ageKey];
      if (typeof age !== 'number') {
        return undefined;
      }

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

  function leader(registration: Registration): boolean {
    return booleanValue(registration, 'leader') ?? false;
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
    dateOfBirth,
    age,
    gender,
    country,
    leader,
    participant,
    waitingList,
    email,
    secondaryEmail,
    emails,
  };
}
