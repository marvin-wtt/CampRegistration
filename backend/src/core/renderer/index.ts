import { create, type ExpressHandlebars } from 'express-handlebars';
import i18n from '#core/i18n';
import path from 'path';
import config from '#config/index';

interface RenderContentOptions {
  preview: string;
  subject: string;
  main: string;
  footer: string;
}

interface RenderFileOptions {
  fileName: string;
  subject: string;
  context: Record<string, unknown>;
}

export class EmailRenderer {
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
      defaultLayout: 'default',
      helpers: {
        t: i18n.t,
      },
    });
  }

  private getViewDirectory(subDir: string) {
    return path.join(this.viewsPath, subDir);
  }

  private getView(name: string) {
    return path.join(this.viewsPath, name + EmailRenderer.EXTENSION);
  }

  async renderContent(options: RenderContentOptions): Promise<string> {
    return this.renderFile({
      fileName: 'dynamic-content',
      subject: options.subject,
      context: {
        main: options.main,
        footer: options.footer,
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

export default new EmailRenderer();
