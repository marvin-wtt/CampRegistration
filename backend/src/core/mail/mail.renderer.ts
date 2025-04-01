import { create, type ExpressHandlebars } from 'express-handlebars';
import i18n from '#core/i18n.js';
import path from 'path';
import config from '#config/index.js';

interface RenderContentOptions {
  subject: string;
  body: string;
  footer: string;
  email: string;
}

interface RenderFileOptions {
  fileName: string;
  subject: string;
  context: Record<string, unknown>;
}

export class MailRenderer {
  private static readonly EXTENSION = '.hbs';

  private readonly viewEngine: ExpressHandlebars;
  private readonly viewsPath: string;

  constructor() {
    this.viewsPath = path.join(
      import.meta.dirname,
      '..',
      '..',
      'views',
      'emails',
    ); // TODO

    this.viewEngine = create({
      partialsDir: this.getViewDirectory('partials'),
      layoutsDir: this.getViewDirectory('layouts'),
      defaultLayout: undefined,
      helpers: {
        t: i18n.t,
      },
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
      fileName: 'default',
      subject: options.subject,
      context: {
        body: options.body,
        footer: options.footer,
        email: options.email,
      },
    });
  }

  async renderFile(options: RenderFileOptions): Promise<string> {
    const globalContext = {
      appName: config.appName,
      style: {
        primaryColor: '#338d8e',
      },
    };
    const filepath = this.getView(options.fileName);

    return this.viewEngine.render(filepath, {
      subject: options.subject,
      ...options.context,
      ...globalContext,
    });
  }
}

export default new MailRenderer();
