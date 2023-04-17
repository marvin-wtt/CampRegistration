import { useLoginService } from 'src/services/LoginService';
import { useCampService } from 'src/services/CampService';
import { useRegistrationService } from 'src/services/RegistrationService';
import { useTemplateService } from 'src/services/TemplateService';
import { useUserService } from 'src/services/UserService';

export function useAPIService() {
  return {
    ...useLoginService(),
    ...useUserService(),
    ...useCampService(),
    ...useRegistrationService(),
    ...useTemplateService(),
  };
}
