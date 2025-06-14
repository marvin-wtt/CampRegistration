export class RegistrationCampDataHelper {
  constructor(private readonly dataByTags: Record<string, unknown[]>) {}

  private stringValue(name: string): string | undefined {
    if (!(name in this.dataByTags)) {
      return undefined;
    }

    return this.dataByTags[name].find((value): value is string => {
      return typeof value === 'string';
    });
  }

  private dateValue(name: string): Date | undefined {
    const v = this.stringValue(name);

    return v !== undefined ? new Date(v) : undefined;
  }

  private stringArray(name: string): string[] | undefined {
    if (!(name in this.dataByTags)) {
      return undefined;
    }

    return this.dataByTags[name].filter((value): value is string => {
      return !!value && typeof value === 'string';
    });
  }

  emails(): string[] | undefined {
    return this.stringArray('email');
  }

  private address():
    | {
        street?: string | undefined;
        city?: string | undefined;
        zipCode?: string | undefined;
        country?: string | undefined;
      }
    | undefined {
    if (
      !('address' in this.dataByTags) ||
      this.dataByTags.address.length === 0
    ) {
      return undefined;
    }

    const address = this.dataByTags.address[0];
    if (!address || typeof address !== 'object') {
      return undefined;
    }

    return {
      street:
        'address' in address && typeof address.address === 'string'
          ? address.address
          : undefined,
      city:
        'city' in address && typeof address.city === 'string'
          ? address.city
          : undefined,
      zipCode:
        'zip_code' in address && typeof address.zip_code === 'string'
          ? address.zip_code
          : undefined,
      country:
        'country' in address && typeof address.country === 'string'
          ? address.country
          : undefined,
    };
  }

  street(): string | undefined {
    return this.stringValue('street') ?? this.address()?.street;
  }

  city(): string | undefined {
    return this.stringValue('city') ?? this.address()?.city;
  }

  zipCode(): string | undefined {
    return this.stringValue('zip_code') ?? this.address()?.zipCode;
  }

  country(): string | undefined {
    return this.stringValue('country') ?? this.address()?.country;
  }

  role(): string | undefined {
    return this.stringValue('role');
  }

  gender(): string | undefined {
    return this.stringValue('gender');
  }

  dateOfBirth(): string | undefined {
    return this.dateValue('date_of_birth')?.toISOString();
  }

  firstName(): string | undefined {
    return this.stringValue('first_name');
  }

  lastName(): string | undefined {
    return this.stringValue('last_name');
  }
}
