import { useLoginService } from 'src/services/LoginService';
import { useCampService } from 'src/services/CampService';
import { useRegistrationService } from 'src/services/RegistrationService';
import { useTemplateService } from 'src/services/TemplateService';
import { useUserService } from 'src/services/UserService';
import { useRoomPlannerService } from 'src/services/RoomPlannerService';

export function useAPIService() {
  return {
    ...useLoginService(),
    ...useUserService(),
    ...useCampService(),
    ...useCampManagerService(),
    ...useRegistrationService(),
    ...useTemplateService(),
    ...useRoomPlannerService(),
  };
}
