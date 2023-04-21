import { Camp } from 'src/types/Camp';

export interface User {
  email: string;
  name: string;
  camps: Camp[];
}
