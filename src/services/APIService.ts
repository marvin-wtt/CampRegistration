import axios from 'axios';
import { useLoginService } from 'src/services/LoginService';
import { useCampService } from 'src/services/CampService';
import { useRegistrationService } from 'src/services/RegistrationService';
import { useTemplateService } from 'src/services/TemplateService';
import { useUserService } from 'src/services/UserService';

export function useAPIService() {
  const API_SERVER = 'http://localhost:8000/api/v1';
  const instance = axios.create({
    baseURL: API_SERVER,
  });

  axios.defaults.baseURL = API_SERVER;

  return {
    ...useLoginService(),
    ...useUserService(),
    ...useCampService(),
    ...useRegistrationService(),
    ...useTemplateService(),
  };
}
