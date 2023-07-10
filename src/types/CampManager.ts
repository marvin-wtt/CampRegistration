import { Identifiable } from 'src/types/Identifiable';
import { User } from 'src/types/User';
import { Invitation } from 'src/types/Invitation';

export interface CampManager extends Identifiable {
  user?: User;
  invitation?: Invitation;
}
