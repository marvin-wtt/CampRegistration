import { useAuthService } from '@/services/AuthService';
import { useEventService } from '@/services/EventService';
import { useRegistrationService } from '@/services/RegistrationService';
import { useTableTemplateService } from '@/services/TableTemplateService';
import { useEventSettingService } from '@/services/EventSettingService';
import { useUserService } from '@/services/UserService';
import { useRoomService } from '@/services/RoomService';
import { useEventManagerService } from '@/services/EventManagerService';
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
import { useProgramItemService } from '@/services/ProgramItemService';
import { useQueueService } from '@/services/QueueService';
import { useTaskService } from '@/services/TaskService';
import { useDutyService } from '@/services/DutyService';
import { useAdminService } from '@/services/AdminService';
import { useOrganizationService } from '@/services/OrganizationService';
import { useOrganizationMemberService } from '@/services/OrganizationMemberService';

export function useAPIService() {
  return {
    ...useAuthService(),
    ...useAdminService(),
    ...useProfileService(),
    ...useUserService(),
    ...useOrganizationService(),
    ...useOrganizationMemberService(),
    ...useEventService(),
    ...useEventManagerService(),
    ...useRegistrationService(),
    ...useTableTemplateService(),
    ...useEventSettingService(),
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
    ...useProgramItemService(),
    ...useQueueService(),
    ...useTaskService(),
    ...useDutyService(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isAPIServiceError = <T = any, D = any>(
  error: unknown,
): error is AxiosError<T, D> => {
  return axios.isAxiosError(error);
};
