import Handlebars from 'handlebars';
import {
  renderChangesHtml,
  renderChangesText,
} from '../registration.changes.js';
import { RegistrationEventMessage } from './event.mail.js';

export class RegistrationUpdatedMessage extends RegistrationEventMessage {
  static readonly trigger = 'registration_updated';
  static readonly type = 'registration:template:updated';

  protected renderChanges(
    format: 'html' | 'text',
  ): Handlebars.SafeString | string {
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

    // Values are escaped as the markup is built, so the result is safe to emit
    // through a double-stash and must not be escaped a second time.
    return new Handlebars.SafeString(renderChangesHtml(changes, labels));
  }
}
