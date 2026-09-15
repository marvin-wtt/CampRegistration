import type {
  DefaultEmailProps,
  MessageBouncedProps,
  FeedbackProps,
  VerifyEmailProps,
  ResetPasswordProps,
  ActionCardProps,
  OrganizationRejectedProps,
  EventRetentionDueProps,
  RegistrationManagerNotificationProps,
  NewsletterProps,
  RegistrationMessageProps,
  LocalContext,
} from '#views/emails/types';
import { htmlToPreviewText } from '#utils/emailPreview';

export interface EmailFixture {
  template: string;
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
    subject: 'Message Undelivered | Summer Camp 2026',
    context: {
      preview: 'A message to jane@example.com could not be delivered',
      eventName: 'Summer Camp 2026',
      reason:
        'You are receiving this email because you are a contact email of this event.',
      title: 'Hello,',
      information:
        'Your message "Payment reminder" to jane@example.com for Summer Camp 2026 could not be delivered.',
      button: 'View Registrations',
      greeting: 'Best regards,',
      teamName: 'Camp Registration team',
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
        'You can reply to this email to contact the user directly if they provided an email address.',
      messageLabel: 'Message',
      locationLabel: 'Location',
      userAgentLabel: 'User Agent',
      message: 'Great app, but the export button is hard to find.',
      location: '/management/events/evt_01/participants',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    } satisfies LocalContext<FeedbackProps>,
  },
  {
    template: 'verify-email',
    subject: 'Verify your email',
    context: {
      preview: 'Verify your email to activate your account.',
      reason: 'You are receiving this email because you created an account.',
      title: 'Hey there,',
      information:
        'Please confirm your email to confirm the account belongs to you. You can login directly after confirmation',
      button: 'Confirm email',
      accidental:
        'If you did not create an account, please do not click the link and contact us.',
      greeting: 'Best regards,',
      teamName: 'Camp Registration team',
      url,
    } satisfies LocalContext<VerifyEmailProps>,
  },
  {
    template: 'reset-password',
    subject: 'Reset password',
    context: {
      preview: 'Reset your password now to regain access to your account.',
      reason:
        'You are receiving this email because you have requested a new password.',
      title: 'Hey there,',
      information:
        'You forgot your password? No problem. You can set a new one here.',
      button: 'Reset password',
      accidental:
        'If you did not request a password reset, you can ignore this email.',
      greeting: 'Best regards,',
      teamName: 'Camp Registration team',
      url,
    } satisfies LocalContext<ResetPasswordProps>,
  },
  {
    template: 'manager-invitation',
    subject: 'Event Invitation',
    context: {
      preview: 'You have been invited to manage Summer Camp 2026',
      reason:
        'You are receiving this email because you were invited by another user.',
      title: 'Hello,',
      information:
        'You have been invited to manage Summer Camp 2026. If you already have an account, the event will be available automatically. Otherwise, please create a free account first.',
      button: 'Manage Event',
      greeting: 'Best regards,',
      teamName: 'Camp Registration team',
      url,
    } satisfies LocalContext<ActionCardProps>,
  },
  {
    template: 'organization-review-pending',
    subject: 'Organization awaiting review: Adventure Org',
    context: {
      preview: 'Adventure Org is waiting to be verified',
      reason: 'You are receiving this email because you are an administrator.',
      title: 'A new organization needs review',
      information:
        'Adventure Org has been submitted for verification. Until it is verified it cannot publish events or send newsletters.',
      button: 'Review organizations',
      greeting: 'Best regards,',
      teamName: 'Camp Registration team',
      url,
    } satisfies LocalContext<ActionCardProps>,
  },
  {
    template: 'organization-verified',
    subject: 'Your organization has been verified',
    context: {
      preview: 'Adventure Org can now publish events',
      reason:
        'You are receiving this email because you administer this organization.',
      title: 'Your organization has been verified',
      information:
        'Adventure Org has been verified. You can now publish its events and send newsletters.',
      button: 'Open organization',
      greeting: 'Best regards,',
      teamName: 'Camp Registration team',
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
      title: 'Your organization could not be verified',
      information:
        'Adventure Org has not been verified. It cannot publish events or send newsletters until it is. Correcting its registered details puts it back into review.',
      reasonLabel: 'Reason',
      reviewNote:
        'The registered address could not be confirmed against the business registry.',
      button: 'Review the details',
      greeting: 'Best regards,',
      teamName: 'Camp Registration team',
      url,
    } satisfies LocalContext<OrganizationRejectedProps>,
  },
  {
    template: 'event-retention-due',
    subject: 'Retention period ending: Summer Camp 2026',
    context: {
      preview: 'The registration data of Summer Camp 2026 is due for review',
      reason: 'You are receiving this email because you can delete this event.',
      title: 'A retention period is running out',
      information:
        'The privacy information published for Summer Camp 2026 tells registrants their data is kept for 12 months after the event ends. For this event that period ends on January 15, 2026.',
      action:
        'Please review the event’s registrations and delete what is no longer needed. You are the one who can tell what still has to be kept.',
      hasExceptions: true,
      exceptions:
        'Your privacy information also declares exceptions that are kept beyond this period. Do not delete what those cover.',
      hasConsentBoundData: true,
      consentBound:
        'Some data is kept for as long as the consent behind it stands. It stays until the person withdraws that consent, and has to be deleted promptly once they do.',
      noAutomaticDeletion:
        'Nothing has been deleted automatically. This platform never erases event data on its own — the decision and the action are yours.',
      button: 'Open the event',
      greeting: 'Best regards,',
      teamName: 'Camp Registration team',
      url,
    } satisfies LocalContext<EventRetentionDueProps>,
  },
  {
    template: 'registration-manager-notification',
    subject: 'New Registration | Summer Camp 2026',
    context: {
      preview: 'New registration for the event: Summer Camp 2026',
      eventName: 'Summer Camp 2026',
      reason:
        'You are receiving this email because you are a contact email of this event.',
      title: 'Hello,',
      information: 'Jane Doe registered for Summer Camp 2026.',
      button: 'View Registrations',
      greeting: 'Best regards,',
      teamName: 'Camp Registration team',
      url,
    } satisfies LocalContext<RegistrationManagerNotificationProps>,
  },
  {
    template: 'newsletter',
    subject: 'Summer Camp Newsletter — March Update',
    context: {
      preview: htmlToPreviewText(newsletterBody),
      body: newsletterBody,
      reason:
        'You are receiving this email because you subscribed to our newsletter.',
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
