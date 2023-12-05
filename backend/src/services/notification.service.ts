import config from "@/config";
import transport from "@/config/mail";
import { generateQueryString } from "@/utils/uri";
import Mail from "nodemailer/lib/mailer";
import { t } from "@/config/i18n";
import logger from "@/config/logger";

type WithRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;

type RequireAtLeastOne<T, R extends keyof T = keyof T> = Omit<T, R> &
  { [P in R]: Required<Pick<T, P>> & Partial<Omit<T, P>> }[R];

type EmailOptions = RequireAtLeastOne<Mail.Options, "to" | "cc" | "bcc">;

type Options = WithRequired<EmailOptions, "subject"> & {
  template: string;
  context?: object;
};

const sendEmail = (options: Options) => {
  const { from } = config.email;
  const appName = t("app-name");

  options.from = {
    name: appName,
    address: from,
  };
  options.subject = `${options.subject} | ${appName}`;

  options.context = {
    ...options.context,
  };

  transport.sendMail(options).catch((reason) => {
    logger.warn("Failed to send email: " + reason);
  });
};

const generateUrl = (
  path: string,
  params: Record<string, string> = {},
): string => {
  const { origin } = config;
  const query = generateQueryString(params);

  return `${origin}/${path}?${query}`;
};

export default {
  sendEmail,
  generateUrl,
};
