type FieldResolver = (index: number) => string;

export interface FileConfig {
  file: string;
  fields: {
    general: {
      reference: string;
      country: {
        field: string;
        values: {
          de: string;
          fr: string;
          other: string;
        };
      };
      otherCountry: string;
      responsiblePerson: string;
      date: string;
    };
    participants: {
      lastName: FieldResolver;
      firstName: FieldResolver;
      zipCode: FieldResolver;
      city: FieldResolver;
      country: FieldResolver;
      age: FieldResolver;
      nights: FieldResolver;
      distance: FieldResolver;
      count: number;
    };
    counselors: {
      lastName: FieldResolver;
      firstName: FieldResolver;
      zipCode: FieldResolver;
      city: FieldResolver;
      country: FieldResolver;
      age: FieldResolver;
      nights: FieldResolver;
      role: {
        field: FieldResolver;
        values: {
          counselor: string;
          referent: string;
          interpreter: string;
          companion: string;
          instructor: string;
          trainee: string;
        };
      };
      distance: FieldResolver;
      count: number;
    };
  };
}

export interface FieldAnnotation {
  id: string;
  fieldType: 'Tx';
  fieldName: string;
}

export interface BtnAnnotation {
  id: string;
  fieldName: string;
  fieldType: 'Btn';
  buttonValue: string;
}

export interface Participant {
  lastName?: string;
  firstName?: string;
  zipCode?: string;
  city?: string;
  country?: string;
  age?: number;
  nights?: number;
  distance?: number;
}

export interface Counselor {
  lastName?: string;
  firstName?: string;
  zipCode?: string;
  city?: string;
  country?: string;
  age?: number;
  nights?: number;
  role?: keyof FileConfig['fields']['counselors']['role']['values'];
  distance?: number;
}

export interface ParticipationListData {
  country: string;
  participants: Participant[];
  counselors: Counselor[];
  reference?: string;
  responsiblePerson?: string;
}
