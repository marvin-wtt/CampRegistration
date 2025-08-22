import { useAuthService } from './AuthService';
import { useCampService } from './CampService';
import { useRegistrationService } from './RegistrationService';
import { useTableTemplateService } from './TableTemplateService';
import { useUserService } from './UserService';
import { useRoomService } from './RoomService';
import { useCampManagerService } from './CampManagerService';
import axios, { type AxiosError } from 'axios';
import { useFileService } from './FileService';
import { useFeedbackService } from './FeedbackService';
import { useExpenseService } from './ExpenseService.ts';
import { usePublicFileService } from 'src/services/PublicFileService.ts';
import { api } from 'boot/axios';
import { convertNullToEmptyString } from 'src/services/convertNullToEmptyString.ts';

// Load middleware
convertNullToEmptyString(api);
import { useProfileService } from 'src/services/ProfileService';
import { useTotpService } from 'src/services/TotpService';
import { useMessageTemplateService } from 'src/services/MessageTemplateService';
import { useMessageService } from 'src/services/MessageService';

export function useAPIService() {
  return {
    ...useAuthService(),
    ...useProfileService(),
    ...useUserService(),
    ...useCampService(),
    ...useCampManagerService(),
    ...useRegistrationService(),
    ...useTableTemplateService(),
    ...useRoomService(),
    ...useFileService(),
    ...useFeedbackService(),
    ...useTotpService(),
    ...useMessageService(),
    ...useMessageTemplateService(),
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
