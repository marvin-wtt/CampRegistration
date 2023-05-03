import { Registration } from 'src/types/Registration';
import { formatPersonName } from 'src/utils/formatters/personName';

export function formatUniqueName(
  registration: Registration,
  others: Registration[],
  firstNameKey: string,
  lastNameKey?: string
): string {
  const firstName = registration[firstNameKey] as string;

  // Search for people with same name
  const sameFirstName = others.filter((value) => {
    return value[firstNameKey] === firstName;
  });

  // If no match was found, this can be ignored. (Filter finds itself)
  if (
    sameFirstName.length === 1 ||
    lastNameKey === undefined ||
    typeof registration[lastNameKey] !== 'string'
  ) {
    return formatPersonName(firstName);
  }

  const lastName = registration[lastNameKey] as string;
  const sameLastNameStart = sameFirstName.filter((value) => {
    return value[lastNameKey] === lastName;
  });

  const name =
    sameLastNameStart.length > 0
      ? `${firstName} ${lastName}`
      : `${firstName} ${lastName[0]}.`;

  return formatPersonName(name);
}
