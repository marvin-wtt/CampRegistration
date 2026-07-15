import { useAuthService } from '@/services/AuthService';
import { useCampService } from '@/services/CampService';
import { useRegistrationService } from '@/services/RegistrationService';
import { useTableTemplateService } from '@/services/TableTemplateService';
import { useCampSettingService } from '@/services/CampSettingService';
import { useUserService } from '@/services/UserService';
import { useRoomService } from '@/services/RoomService';
import { useCampManagerService } from '@/services/CampManagerService';
import axios, { type AxiosError } from 'axios';
import { useFileService } from '@/services/FileService';
import { useFeedbackService } from '@/services/FeedbackService';
import { useProfileService } from '@/services/ProfileService';
import { useTotpService } from '@/services/TotpService';
import { useMessageTemplateService } from '@/services/MessageTemplateService';
import { useMessageService } from '@/services/MessageService';
import { useNewsletterService } from '@/services/NewsletterService';
import { useNewsletterManagerService } from '@/services/NewsletterManagerService';
import { useNewsletterSubscriberService } from '@/services/NewsletterSubscriberService';
import { useNewsletterMessageService } from '@/services/NewsletterMessageService';
import { useProgramEventService } from '@/services/ProgramEventService';
import { useQueueService } from '@/services/QueueService';
import { useTaskService } from '@/services/TaskService';
import { useAdminService } from '@/services/AdminService';
import { useTranslationService } from '@/services/TranslationService';

export function useAPIService() {
  return {
    ...useAuthService(),
    ...useAdminService(),
    ...useProfileService(),
    ...useUserService(),
    ...useCampService(),
    ...useCampManagerService(),
    ...useRegistrationService(),
    ...useTableTemplateService(),
    ...useCampSettingService(),
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
    ...useTaskService(),
    ...useTranslationService(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isAPIServiceError = <T = any, D = any>(
  error: unknown,
): error is AxiosError<T, D> => {
  return axios.isAxiosError(error);
};
