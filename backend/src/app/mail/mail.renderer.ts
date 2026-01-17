import { create, type ExpressHandlebars } from 'express-handlebars';
import i18n from '#core/i18n';
import path from 'path';
import config from '#config/index';
import { appBuildPath } from '#utils/paths';
import type { Envelope, Translator } from '#app/mail/mail.types';
import { addressLikeToString } from '#app/mail/mail.utils';

interface RenderContentOptions {
  envelope: Pick<Envelope, 'to' | 'subject'>;
  body: string;
  footer?: string | undefined;
}

interface RenderFileOptions {
  envelope: Pick<Envelope, 'to' | 'subject'>;
  template: string;
  context: Record<string, unknown>;
}

export class MailRenderer {
  private static readonly EXTENSION = '.hbs';

  private readonly viewEngine: ExpressHandlebars;
  private readonly viewsPath: string;

  constructor(t: Translator = i18n.t) {
    this.viewsPath = appBuildPath('views', 'emails');

    this.viewEngine = create({
      partialsDir: this.getViewDirectory('partials'),
      layoutsDir: this.getViewDirectory('layouts'),
      defaultLayout: undefined,
      helpers: { t },
    });
  }

  private getViewDirectory(subDir: string) {
    return path.join(this.viewsPath, subDir);
  }

  private getView(name: string) {
    return path.join(this.viewsPath, name + MailRenderer.EXTENSION);
  }

  async renderContent(options: RenderContentOptions): Promise<string> {
    return this.renderFile({
      template: 'default',
      envelope: options.envelope,
      context: {
        body: options.body,
        footer: options.footer,
        email: addressLikeToString(options.envelope.to),
      },
    });
  }

  async renderFile(options: RenderFileOptions): Promise<string> {
    const globalContext = {
      appName: config.appName,
      style: {
        primaryColor: '#338d8e', // TODO Import from config
      },
    };
    const filepath = this.getView(options.template);

    return this.viewEngine.render(filepath, {
      subject: options.envelope.subject,
      ...options.context,
      ...globalContext,
    });
  }
}
