import { Registration } from 'src/types/Registration';
import { formatPersonName } from 'src/utils/formatters/personName';

export function formatUniqueName(
  registration: Registration,
  others: Registration[],
  firstNameKey: string,
  lastNameKey?: string,
): string {
  const firstName = registration.data[firstNameKey] as string;

  // Search for people with same name
  const sameFirstName = others.filter((value) => {
    return value.data[firstNameKey] === firstName;
  });

  // If no match was found, this can be ignored. (Filter finds itself)
  // TODO Use accessor
  if (
    sameFirstName.length === 1 ||
    lastNameKey === undefined ||
    typeof registration.data[lastNameKey] !== 'string'
  ) {
    return formatPersonName(firstName);
  }
  // TODO Use accessor
  const lastName = registration.data[lastNameKey] as string;
  const sameLastNameStart = sameFirstName.filter((value) => {
    // TODO Use accessor
    return value.data[lastNameKey] === lastName;
  });

  const name =
    sameLastNameStart.length > 0
      ? `${firstName} ${lastName}`
      : `${firstName} ${lastName[0]}.`;

  return formatPersonName(name);
}
