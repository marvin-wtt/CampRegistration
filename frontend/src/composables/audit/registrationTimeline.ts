import { computed, onMounted, ref } from 'vue';
import type {
  AuditLogEntry,
  Message,
  MessageDelivery,
} from '@camp-registration/common/entities';
import { useAPIService } from '@/services/APIService';

export interface ReceivedEmail {
  // Shaped as a message for MessageDetailsDialog: the rendered email, with
  // this registration's addresses as its only recipient.
  message: Message;
  trigger: string | null;
}

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

  const auditEntries = ref<AuditLogEntry[]>([]);
  const deliveries = ref<MessageDelivery[]>([]);
  const loading = ref(true);

  onMounted(async () => {
    // Either may fail on its own (e.g. no permission to view messages) — the
    // timeline then just shows what it could load.
    const [audit, received] = await Promise.allSettled([
      apiService.fetchRegistrationAuditLog(eventId, registrationId),
      apiService.fetchRegistrationMessages(eventId, registrationId),
    ]);
    auditEntries.value = audit.status === 'fulfilled' ? audit.value : [];
    deliveries.value = received.status === 'fulfilled' ? received.value : [];
    loading.value = false;
  });

  const emails = computed(() =>
    groupDeliveries(deliveries.value, registrationId),
  );

  return { auditEntries, emails, loading };
}
