import { SafeHtml } from '#core/mail/templating';
import { renderChangesHtml, renderChangesText } from './changes.markup.js';
import { RegistrationEventMessage } from './event.mail.js';

export class RegistrationUpdatedMessage extends RegistrationEventMessage {
  static readonly trigger = 'registration_updated';
  static readonly type = 'registration:template:updated';

  protected renderChanges(format: 'html' | 'text'): SafeHtml | string {
    // Absent for a job enqueued before this field existed, and for any caller
    // that supplied none. Nothing to list is not an error worth failing a send
    // over — the participant still learns they were edited.
    const changes = this.payload.changes;
    if (!changes?.length) {
      return '';
    }

    const t = this.getTg();
    const labels = {
      cleared: t('registration:email.changes.cleared'),
      file: t('registration:email.changes.file'),
    };

    if (format === 'text') {
      return renderChangesText(changes, labels);
    }

    // Values are escaped as the markup is built; escaping again would show tags.
    return new SafeHtml(renderChangesHtml(changes, labels));
  }
}
