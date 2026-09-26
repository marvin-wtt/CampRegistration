import path from 'path';
import { pathToFileURL } from 'node:url';
import type { Component } from 'vue';
import { createSSRApp } from 'vue';
import { renderToString } from '@vue/server-renderer';
import mjml2html from 'mjml';
import config from '#config/index';
import { appBuildPath } from '#utils/paths';
import type { Envelope, Translator } from '#core/mail/mail.types';
import { addressLikeToString } from '#core/mail/mail.utils.js';
import logger from '#core/logger';
import type { DefaultEmailProps, LocalContext } from '#views/emails/types';
import { htmlToPreviewText } from '#utils/emailPreview';

interface RenderContentOptions {
  envelope: Pick<Envelope, 'to' | 'subject'>;
  body: string;
  reason?: string | undefined;
}

interface RenderFileOptions {
  envelope: Pick<Envelope, 'to' | 'subject'>;
  template: string;
  context: Record<string, unknown>;
}

export class MailRenderer {
  private readonly viewsPath: string;

  constructor(private readonly tg: Translator) {
    this.viewsPath = appBuildPath('views', 'emails');
  }

  private getViewUrl(name: string): string {
    return pathToFileURL(path.join(this.viewsPath, `${name}.mjs`)).href;
  }

  async renderContent(options: RenderContentOptions): Promise<string> {
    return this.renderFile({
      template: 'default',
      envelope: options.envelope,
      context: {
        preview: htmlToPreviewText(options.body),
        body: options.body,
        reason: options.reason,
      } satisfies LocalContext<DefaultEmailProps>,
    });
  }

  async renderFile(options: RenderFileOptions): Promise<string> {
    const envelope = simplifyEnvelope(options.envelope);

    const props = {
      subject: options.envelope.subject,
      appName: config.appName,
      primaryColor: config.primaryColor,
      sentTo: this.tg('email:footer.sentTo', { envelope }),
      ...options.context,
    };

    const mod = (await import(this.getViewUrl(options.template))) as {
      default: Component;
    };

    const app = createSSRApp(mod.default, props);
    const markup = await renderToString(app);

    // `validationLevel: 'strict'` throws on any structural error instead of
    // returning it in `errors` — caught here only to attach which template
    // failed before the caller's own error handling (queue retry, etc.) takes
    // over; never silently degrades to unvalidated markup.
    try {
      const { html } = await mjml2html(markup, { validationLevel: 'strict' });
      return html;
    } catch (error) {
      logger.error(
        `MJML compile failed while rendering "${options.template}"`,
        {
          error,
        },
      );
      throw error;
    }
  }
}

function simplifyEnvelope(envelope: Envelope): {
  to: string;
  subject: string;
} {
  return {
    to: addressLikeToString(envelope.to),
    subject: envelope.subject,
  };
}
