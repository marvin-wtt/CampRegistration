/**
 * What a registration message template can print: every value already
 * rendered for the reader (texts translated, dates formatted, countries named).
 * The backend builds it and the editor's variable picker offers its paths.
 */
export interface RegistrationMessageContext {
  event: {
    name: string;
    organizer: string | null;
    contactEmail: string | null;
    /** The participating countries' names, comma-separated. */
    countries: string;
    startAt: string;
    endAt: string;
    minAge: number;
    maxAge: number;
    maxParticipants: number | null;
    location: string | null;
    // Kept for templates saved before 1.1; the picker offers the
    // registration's own price instead.
    price: number;
    priceWithCurrency: string;
  };
  registration: {
    id: string;
    data: Record<string, unknown>;
    computedData: {
      firstName: string | null;
      lastName: string | null;
      dateOfBirth: string | null;
      gender: string | null;
      address: {
        street: string | null;
        city: string | null;
        zipCode: string | null;
        country: string | null;
      };
      role: string | null;
      emails: string[];
      phoneNumbers: string[];
    };
    customData: Record<string, unknown>;
    /** The fields an edit changed; empty outside the "updated" trigger. */
    changes: string;
    status: 'PENDING' | 'WAITLISTED' | 'ACCEPTED';
    price: number | null;
    priceWithCurrency: string | null;
    reference: string | null;
    locale: string;
    /** The group's country name. */
    group: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

type Dot<P extends string, K extends string> = P extends '' ? K : `${P}.${K}`;

/**
 * Every printable path of `T`, as a template writes it: arrays by index
 * (`emails.[0]`), open records by any key (`data.${string}`).
 */
export type TemplatePath<
  T,
  P extends string = '',
> = T extends readonly unknown[]
  ? P | `${P}.[${number}]`
  : T extends object
    ? {
        [K in keyof T & string]: TemplatePath<T[K], Dot<P, K>>;
      }[keyof T & string]
    : P;

export type RegistrationMessagePath = TemplatePath<RegistrationMessageContext>;
