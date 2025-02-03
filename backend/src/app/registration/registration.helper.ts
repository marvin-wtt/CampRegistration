export class RegistrationCampDataHelper {
  constructor(private readonly campData: Record<string, unknown[]>) {}

  emails(): string[] {
    return this.campData['email']?.filter((value): value is string => {
      return !!value && typeof value === 'string';
    });
  }

  country(acceptedCountries?: string[]): string | undefined {
    const country = this.campData['country']?.find(
      (value: unknown): value is string => {
        return (
          typeof value === 'string' &&
          (!acceptedCountries || acceptedCountries.includes(value))
        );
      },
    );

    if (country) {
      return country;
    }

    // Try address instead
    const address = this.campData['address']?.find(
      (value: unknown): value is { country: string } => {
        if (!value || typeof value !== 'object' || !('country' in value)) {
          return false;
        }

        return (
          typeof value.country === 'string' &&
          (!acceptedCountries || acceptedCountries.includes(value.country))
        );
      },
    );

    return address?.country;
  }

  firstName(): string | undefined {
    if (
      !('first_name' in this.campData) ||
      this.campData.first_name.length === 0
    ) {
      return undefined;
    }

    return this.campData.first_name.find((value): value is string => {
      return typeof value === 'string';
    });
  }

  lastName(): string | undefined {
    if (
      !('last_name' in this.campData) ||
      this.campData.last_name.length === 0
    ) {
      return undefined;
    }

    return this.campData.last_name.find((value): value is string => {
      return typeof value === 'string';
    });
  }

  fullName(): string | undefined {
    if (
      !('full_name' in this.campData) ||
      this.campData.full_name.length === 0
    ) {
      return undefined;
    }

    return this.campData.full_name.find((value): value is string => {
      return typeof value === 'string';
    });
  }

  name = (): string | undefined => {
    const fullName = this.fullName();
    if (fullName) {
      return fullName;
    }

    const firstName = this.firstName();
    const lastName = this.lastName();
    if (firstName !== undefined && lastName !== undefined) {
      return `${firstName} ${lastName}`;
    }

    return firstName !== undefined ? firstName : lastName;
  };
}
