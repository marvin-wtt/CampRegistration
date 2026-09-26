import { computed, onMounted, ref } from 'vue';
import type {
  AuditLogEntry,
  Message,
  MessageDelivery,
} from '@camp-registration/common/entities';
import { useAPIService } from '@/services/APIService';
import { usePermissions } from '@/composables/permissions';

export interface ReceivedEmail {
  // Shaped as a message for MessageDetailsDialog: the rendered email, with
  // this registration's addresses as its only recipient.
  message: Message;
  trigger: string | null;
  // False once the message or template it was rendered from is deleted —
  // there is nothing left to render it again from.
  resendable: boolean;
}

export const normalizeEmail = (email: string): string =>
  email.trim().toLowerCase();

// Groups the per-address deliveries of one send into a single email.
export function groupDeliveries(
  deliveries: MessageDelivery[],
  registrationId: string,
): ReceivedEmail[] {
  const groups = new Map<string, MessageDelivery[]>();
  for (const delivery of deliveries) {
    // Rows from before `batchId` fall back to source plus minute.
    const key =
      delivery.batchId ??
      delivery.messageId ??
      `${delivery.trigger ?? ''}|${delivery.createdAt.slice(0, 16)}`;
    groups.set(key, [...(groups.get(key) ?? []), delivery]);
  }

  return [...groups.values()].flatMap(([first, ...rest]) => {
    if (!first) {
      return [];
    }
    return [
      {
        trigger: first.trigger,
        resendable: Boolean(first.messageId ?? first.trigger),
        message: {
          id: first.id,
          subject: first.subject,
          body: first.body,
          replyTo: first.replyTo,
          priority: first.priority,
          attachments: first.attachments,
          recipients: [
            {
              registrationId,
              deliveries: [first, ...rest].map(
                ({ to, bouncedAt, bounceReason }) => ({
                  to,
                  bouncedAt,
                  bounceReason,
                }),
              ),
            },
          ],
          sentBy: first.sentBy,
          createdAt: first.createdAt,
        },
      },
    ];
  });
}

// A registration's audit trail and the emails it received.
export function useRegistrationTimeline(
  eventId: string,
  registrationId: string,
) {
  const apiService = useAPIService();
  const { can } = usePermissions();

  const canViewAudit = computed(() => can('event.audit.view'));
  const canViewMessages = computed(() => can('event.messages.view'));
  // True once at least one side is hidden by permissions, so the viewer knows
  // the timeline isn't the full picture.
  const restricted = computed(
    () => !canViewAudit.value || !canViewMessages.value,
  );

  const auditEntries = ref<AuditLogEntry[]>([]);
  const deliveries = ref<MessageDelivery[]>([]);
  const loading = ref(true);

  const fetchDeliveries = (): Promise<MessageDelivery[]> =>
    canViewMessages.value
      ? apiService.fetchRegistrationMessages(eventId, registrationId)
      : Promise.resolve([]);

  onMounted(async () => {
    // A side without permission is never requested; allSettled here only
    // guards against a genuine failure on the side the viewer does have.
    const [audit, received] = await Promise.allSettled([
      canViewAudit.value
        ? apiService.fetchRegistrationAuditLog(eventId, registrationId)
        : Promise.resolve([]),
      fetchDeliveries(),
    ]);
    auditEntries.value = audit.status === 'fulfilled' ? audit.value : [];
    deliveries.value = received.status === 'fulfilled' ? received.value : [];
    loading.value = false;
  });

  // Refreshes only the emails, in place — e.g. after a resend.
  async function reloadEmails(): Promise<void> {
    try {
      deliveries.value = await fetchDeliveries();
    } catch {
      // Keep what is shown; the next open fetches again.
    }
  }

  const emails = computed(() =>
    groupDeliveries(deliveries.value, registrationId),
  );

  return { auditEntries, emails, loading, restricted, reloadEmails };
}
