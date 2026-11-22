import type {
  DefaultEmailProps,
  MessageBouncedProps,
  FeedbackProps,
  VerifyEmailProps,
  ResetPasswordProps,
  ActionCardProps,
  OrganizationRejectedProps,
  RegistrationManagerNotificationProps,
  NewsletterProps,
  RegistrationMessageProps,
  TaskReminderProps,
  LocalContext,
} from '#views/emails/types';
import { htmlToPreviewText } from '#core/mail/emailPreview';

export interface EmailFixture {
  template: string;
  name?: string;
  subject: string;
  context: Record<string, unknown>;
}

const url = 'https://example.com/management/events/evt_01/participants';

const defaultBody =
  '<p>Hi Jane,</p><p>Thanks for registering. We look forward to seeing you!</p><ul><li>Bring sunscreen</li><li>Arrive by 9am</li></ul>';
const newsletterBody =
  '<p>Hi Jane,</p><p>Here is what happened this month at Summer Camp 2026.</p><ul><li>New activity schedule published</li><li>Registration closes April 1st</li></ul>';
const registrationMessageBody =
  '<p>Hi Jane,</p><p>Your registration for Summer Camp 2026 is confirmed. See you soon!</p>';

export const fixtures: EmailFixture[] = [
  {
    template: 'default',
    subject: 'Welcome to Camp Registration',
    context: {
      preview: htmlToPreviewText(defaultBody),
      body: defaultBody,
      reason: 'You are receiving this because you subscribed.',
    } satisfies LocalContext<DefaultEmailProps>,
  },
  {
    template: 'message-bounced',
    subject: 'Message undelivered | Summer Camp 2026',
    context: {
      preview:
        'A message to jane@example.com could not be delivered for Summer Camp 2026',
      eventName: 'Summer Camp 2026',
      reason:
        'You are receiving this email because you are a contact email of this event.',
      title: 'Your message wasn’t delivered',
      information:
        '“Payment reminder” to jane@example.com for Summer Camp 2026 couldn’t be delivered. It’s worth checking the email address of this registration.',
      button: 'View registrations',
      url,
    } satisfies LocalContext<MessageBouncedProps>,
  },
  {
    template: 'feedback',
    subject: 'New Feedback',
    context: {
      preview: 'New feedback received: Great app!',
      reason: 'You are receiving this email because you are an administrator.',
      title: 'New Feedback',
      replyNote:
        'Reply to this email to reach the sender directly, if they left an address.',
      senderLabel: 'From',
      messageLabel: 'Message',
      sender: 'Jane Doe <jane@example.com>',
      message: 'Great app, but the export button is hard to find.',
    } satisfies LocalContext<FeedbackProps>,
  },
  {
    template: 'verify-email',
    subject: 'Confirm your email address',
    context: {
      preview: 'One click and your account is ready.',
      reason: 'You are receiving this email because you created an account.',
      title: 'Confirm your email address',
      information:
        'One last step: confirm that this address is yours. You can sign in right after.',
      button: 'Confirm email address',
      accidental: 'Didn’t create an account? Just ignore this email.',
      url,
    } satisfies LocalContext<VerifyEmailProps>,
  },
  {
    template: 'reset-password',
    subject: 'Reset your password',
    context: {
      preview: 'Choose a new password to get back into your account.',
      reason:
        'You are receiving this email because a new password was requested for your account.',
      title: 'Reset your password',
      information:
        'Forgot your password? No worries. Choose a new one with the button below.',
      button: 'Choose a new password',
      accidental:
        'Didn’t request this? Just ignore this email. Your password stays the same.',
      url,
    } satisfies LocalContext<ResetPasswordProps>,
  },
  {
    template: 'action-card',
    name: 'manager-invitation',
    subject: 'You’re invited to manage an event',
    context: {
      preview: 'Help manage Summer Camp 2026',
      reason:
        'You are receiving this email because you were invited by another user.',
      title: 'You’re invited to manage Summer Camp 2026',
      information:
        'If you already have an account, the event is waiting for you. Otherwise, create a free account first.',
      button: 'Open event',
      url,
    } satisfies LocalContext<ActionCardProps>,
  },
  {
    template: 'action-card',
    name: 'organization-review-pending',
    subject: 'Organization awaiting review: Adventure Org',
    context: {
      preview: 'Adventure Org is waiting to be verified',
      reason: 'You are receiving this email because you are an administrator.',
      title: 'New organization to review',
      information:
        'Adventure Org is waiting for verification. Until then, it can’t publish events or send newsletters.',
      button: 'Review organization',
      url,
    } satisfies LocalContext<ActionCardProps>,
  },
  {
    template: 'action-card',
    name: 'organization-verified',
    subject: 'Your organization is verified',
    context: {
      preview: 'Adventure Org can now publish events',
      reason:
        'You are receiving this email because you administer this organization.',
      title: 'Adventure Org is verified',
      information:
        'Good news: you can now publish events and send newsletters.',
      button: 'Open organization',
      url,
    } satisfies LocalContext<ActionCardProps>,
  },
  {
    template: 'action-card',
    name: 'newsletter-confirmation',
    subject: 'Confirm your newsletter subscription',
    context: {
      preview: 'One click to start receiving “Summer News”.',
      reason:
        'You are receiving this email because Adventure Org added you to their newsletter.',
      title: 'Confirm your subscription',
      information:
        'Adventure Org would like to add you to the newsletter “Summer News”. Confirm your subscription to receive news and updates by email.',
      button: 'Confirm subscription',
      accidental:
        'Didn’t sign up? Just ignore this email. You won’t be subscribed, and your address is deleted after 30 days.',
      url,
    } satisfies LocalContext<ActionCardProps>,
  },
  {
    template: 'organization-rejected',
    subject: 'Your organization could not be verified',
    context: {
      preview: 'Adventure Org needs your attention',
      reason:
        'You are receiving this email because you administer this organization.',
      title: 'We couldn’t verify Adventure Org',
      information:
        'Until it’s verified, it can’t publish events or send newsletters. Update its details and we’ll review it again.',
      reasonLabel: 'Reason',
      reviewNote:
        'The registered address could not be confirmed against the business registry.',
      button: 'Update details',
      url,
    } satisfies LocalContext<OrganizationRejectedProps>,
  },
  {
    template: 'registration-manager-notification',
    subject: 'New registration | Summer Camp 2026',
    context: {
      preview: 'New registration for Summer Camp 2026',
      eventName: 'Summer Camp 2026',
      reason:
        'You are receiving this email because you are a contact email of this event.',
      title: 'New registration',
      information: 'Jane Doe just registered for Summer Camp 2026.',
      button: 'View registrations',
      url,
    } satisfies LocalContext<RegistrationManagerNotificationProps>,
  },
  {
    template: 'task-reminder',
    name: 'task-reminder-single',
    subject: 'Due tomorrow: Pack the bus',
    context: {
      preview:
        'This task for Summer Camp 2026 is assigned to you and due tomorrow (22.11.2026).',
      reason:
        'You are receiving this email because this task is assigned to you.',
      title: 'Due tomorrow: Pack the bus',
      information:
        'This task for Summer Camp 2026 is assigned to you and due tomorrow (22.11.2026).',
      groups: [],
      groupLinkLabel: 'Open tasks',
      button: 'Open tasks',
      url,
    } satisfies LocalContext<TaskReminderProps>,
  },
  {
    template: 'task-reminder',
    name: 'task-reminder-digest',
    subject: '3 tasks due soon',
    context: {
      preview: 'Buy snacks · Pack the bus · Print name tags',
      reason:
        'You are receiving this email because these tasks are assigned to you.',
      title: '3 tasks due soon',
      information: 'These tasks are assigned to you and due today or tomorrow.',
      groups: [
        {
          eventName: 'Summer Camp 2026',
          url,
          tasks: [
            { title: 'Buy snacks', when: 'Due today · 21.11.2026' },
            { title: 'Pack the bus', when: 'Due tomorrow · 22.11.2026' },
          ],
        },
        {
          eventName: 'Winter Retreat 2027',
          url,
          tasks: [
            { title: 'Print name tags', when: 'Due tomorrow · 22.11.2026' },
          ],
        },
      ],
      groupLinkLabel: 'Open tasks',
      button: 'Open tasks',
      url,
    } satisfies LocalContext<TaskReminderProps>,
  },
  {
    template: 'newsletter',
    subject: 'Summer Camp Newsletter — March Update',
    context: {
      preview: htmlToPreviewText(newsletterBody),
      body: newsletterBody,
      reason:
        'You are receiving this email because you subscribed to this newsletter.',
      unsubscribeUrl: 'https://example.com/newsletters/unsubscribe/tok_01',
      unsubscribeLabel: 'Unsubscribe',
    } satisfies LocalContext<NewsletterProps>,
  },
  {
    template: 'registration-message',
    subject: 'Your registration is confirmed',
    context: {
      preview: htmlToPreviewText(registrationMessageBody),
      eventName: 'Summer Camp 2026',
      body: registrationMessageBody,
      reason:
        'You are receiving this because you are registered for Summer Camp 2026.',
      privacyUrl: 'https://example.com/events/evt_01/privacy',
      privacyLabel: 'Privacy information',
    } satisfies LocalContext<RegistrationMessageProps>,
  },
];
