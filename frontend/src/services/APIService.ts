import { useAuthService } from 'src/services/AuthService';
import { useCampService } from 'src/services/CampService';
import { useRegistrationService } from 'src/services/RegistrationService';
import { useTableTemplateService } from 'src/services/TableTemplateService';
import { useUserService } from 'src/services/UserService';
import { useRoomService } from 'src/services/RoomService';
import { useCampManagerService } from 'src/services/CampManagerService';
import axios, { type AxiosError } from 'axios';
import { useFileService } from 'src/services/FileService';
import { useFeedbackService } from 'src/services/FeedbackService';
import { useProfileService } from 'src/services/ProfileService';
import { useTotpService } from 'src/services/TotpService';
import { useMessageTemplateService } from 'src/services/MessageTemplateService';
import { useMessageService } from 'src/services/MessageService';
import { useNewsletterService } from 'src/services/NewsletterService';
import { useNewsletterManagerService } from 'src/services/NewsletterManagerService';
import { useNewsletterSubscriberService } from 'src/services/NewsletterSubscriberService';
import { useNewsletterMessageService } from 'src/services/NewsletterMessageService';
import { useProgramEventService } from 'src/services/ProgramEventService';
import { useQueueService } from 'src/services/QueueService';
import { useAuditService } from 'src/services/AuditService';

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
    ...useNewsletterService(),
    ...useNewsletterManagerService(),
    ...useNewsletterSubscriberService(),
    ...useNewsletterMessageService(),
    ...useProgramEventService(),
    ...useQueueService(),
    ...useAuditService(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isAPIServiceError = <T = any, D = any>(
  error: unknown,
): error is AxiosError<T, D> => {
  return axios.isAxiosError(error);
};
