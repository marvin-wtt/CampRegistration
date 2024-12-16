import nodemailer, { SendMailOptions } from 'nodemailer';
import config from '#config/index';
import logger from '#core/logger';
import hbs from 'nodemailer-express-handlebars';
import { create } from 'express-handlebars';
import i18n from '#core/i18n';
import path from 'path';

const transportOptions = () => {
  const mailOptions: SendMailOptions = {
    from: config.email.from,
    replyTo: config.email.replyTo,
  };

  // SMTP
  if (config.email.smtp.host) {
    return {
      ...config.email.smtp,
      ...mailOptions,
    };
  }

  // Sendmail
  return {
    sendmail: true,
    newline: 'unix',
    ...mailOptions,
    smtp: undefined,
  };
};

const transport = nodemailer.createTransport(transportOptions());

/* c8 ignore next 10 */
if (config.env !== 'test') {
  transport
    .verify()
    .then(() => logger.info('Connected to email server'))
    .catch(() =>
      logger.warn(
        'Unable to connect to email server. Make sure you have configured the SMTP options in .env',
      ),
    );
}

const viewsPath = path.join(__dirname, '..', 'views', 'emails');

const options = {
  extName: '.hbs',
  viewEngine: create({
    partialsDir: path.join(viewsPath, 'partials'),
    layoutsDir: undefined,
    defaultLayout: false,
    helpers: {
      t: i18n.t,
    },
  }),
  viewPath: viewsPath,
};

transport.use('compile', hbs(options));

export default transport as hbs.HbsTransporter;
