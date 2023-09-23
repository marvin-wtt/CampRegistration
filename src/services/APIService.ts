import { useAuthService } from 'src/services/AuthService';
import { useCampService } from 'src/services/CampService';
import { useRegistrationService } from 'src/services/RegistrationService';
import { useTemplateService } from 'src/services/TemplateService';
import { useUserService } from 'src/services/UserService';
import { useRoomService } from 'src/services/RoomService';
import { useCampManagerService } from 'src/services/CampManagerService';
import axios, { AxiosError } from 'axios';
import { useFileService } from 'src/services/FileService';

export function useAPIService() {
  return {
    ...useAuthService(),
    ...useUserService(),
    ...useCampService(),
    ...useCampManagerService(),
    ...useRegistrationService(),
    ...useTemplateService(),
    ...useRoomService(),
    ...useFileService(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isAPIServiceError = <T = any, D = any>(
  error: unknown
): error is AxiosError<T, D> => {
  return axios.isAxiosError(error);
};
