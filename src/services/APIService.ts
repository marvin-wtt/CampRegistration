import { useAuthService } from 'src/services/AuthService';
import { useCampService } from 'src/services/CampService';
import { useRegistrationService } from 'src/services/RegistrationService';
import { useTemplateService } from 'src/services/TemplateService';
import { useUserService } from 'src/services/UserService';
import { useRoomService } from 'src/services/RoomService';
import { useRoomRoommateService } from 'src/services/RoomRoommateService';
import { useCampManagerService } from 'src/services/CampManagerService';

export function useAPIService() {
  return {
    ...useAuthService(),
    ...useUserService(),
    ...useCampService(),
    ...useCampManagerService(),
    ...useRegistrationService(),
    ...useTemplateService(),
    ...useRoomService(),
    ...useRoomRoommateService(),
  };
}
