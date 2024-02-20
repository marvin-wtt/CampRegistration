import axios, { AxiosError } from 'axios';
import { useAuthService } from 'src/services/AuthService';
import { useCampService } from 'src/services/CampService';
import { useRegistrationService } from 'src/services/RegistrationService';
import { useTemplateService } from 'src/services/TemplateService';
import { useUserService } from 'src/services/UserService';
import { useRoomService } from 'src/services/RoomService';
import { useCampManagerService } from 'src/services/CampManagerService';
import { useFileService } from 'src/services/FileService';
import { useFeedbackService } from 'src/services/FeedbackService';
import { useStaticFileService } from 'src/services/StaticFileService';

export function useAPIService() {
  return {
    ...useStaticFileService(),
    ...useAuthService(),
    ...useUserService(),
    ...useCampService(),
    ...useCampManagerService(),
    ...useRegistrationService(),
    ...useTemplateService(),
    ...useRoomService(),
    ...useFileService(),
    ...useFeedbackService(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isAPIServiceError = <T = any, D = any>(
  error: unknown,
): error is AxiosError<T, D> => {
  return axios.isAxiosError(error);
};
