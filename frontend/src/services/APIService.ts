import { useAuthService } from './AuthService';
import { useCampService } from './CampService';
import { useRegistrationService } from './RegistrationService';
import { useTableTemplateService } from './TableTemplateService';
import { useUserService } from './UserService';
import { useRoomService } from './RoomService';
import { useCampManagerService } from './CampManagerService';
import axios, { AxiosError } from 'axios';
import { useFileService } from './FileService';
import { useFeedbackService } from './FeedbackService';
import { useExpenseService } from './ExpenseService.ts';
import { usePublicFileService } from 'src/services/PublicFileService.ts';

export function useAPIService() {
  return {
    ...useAuthService(),
    ...useUserService(),
    ...useCampService(),
    ...useCampManagerService(),
    ...useRegistrationService(),
    ...useTableTemplateService(),
    ...useRoomService(),
    ...useFileService(),
    ...useFeedbackService(),
    ...useExpenseService(),
    ...usePublicFileService(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isAPIServiceError = <T = any, D = any>(
  error: unknown,
): error is AxiosError<T, D> => {
  return axios.isAxiosError(error);
};
