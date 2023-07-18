import { Identifiable } from 'src/types/Identifiable';
import { Roommate } from 'src/types/Roommate';

interface Bed extends Identifiable {
  person: Roommate | null;
}

export interface Room extends Identifiable {
  name: string | Record<string, string>;
  capacity: number;
  beds: Bed[];
}

interface ResponseBed extends Identifiable {
  registrationId: string | null;
}

export interface ResponseRoom extends Identifiable {
  name: string | Record<string, string>;
  capacity: number;
  beds: ResponseBed[];
}

