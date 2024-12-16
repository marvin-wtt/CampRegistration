import config from '#config/index';
import transport from '#config/mail';
import { generateQueryString } from '#utils/uri';
import Mail from 'nodemailer/lib/mailer';
import { t } from '#config/i18n';
import logger from '#config/logger';

type WithRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;

type RequireAtLeastOne<T, R extends keyof T = keyof T> = Omit<T, R> &
  { [P in R]: Required<Pick<T, P>> & Partial<Omit<T, P>> }[R];

type EmailOptions = RequireAtLeastOne<Mail.Options, 'to' | 'cc' | 'bcc'>;

type MailOptions = WithRequired<EmailOptions, 'subject'> & {
  template: string;
  context?: object;
};

const sendEmail = async (options: MailOptions) => {
  const { from } = config.email;
  const appName = t('appName');

  // Remove duplicate emails
  options = removeDuplicateEmails(options);

  options.from = {
    name: appName,
    address: from,
  };
  options.subject = `${options.subject} | ${appName}`;

  options.context = {
    meta: {
      ...options,
    },
    ...options.context,
  };

  await transport.sendMail(options).catch((reason) => {
    logger.warn('Failed to send email: ' + reason);
  });
};

type Address = Mail.Address;
type Emails = string | Address | (string | Address)[] | undefined;

/**
 * Filter for unique emails across all fields.
 * If an emails is unique, the original address or email is kept.
 * If an emails is not unique, only the first occurrence is used.
 * If it is an address in this case, the address is converted into a string.
 * The emails are in the following priority: to -> cc -> bcc
 * @param options The mail options
 * @return The mails options with unique recipients
 */
const removeDuplicateEmails = (options: MailOptions): MailOptions => {
  type LookupMap = Record<string, true>;
  const extractEmail = (item: string | Address) =>
    typeof item === 'string' ? item : item.address;

  const collectEmails = (...fields: Emails[]) => {
    return fields
      .filter((field): field is Exclude<Emails, undefined> => !!field)
      .flatMap((field) => (Array.isArray(field) ? field : [field]))
      .map(extractEmail)
      .reduce((acc, email) => {
        acc[email] = true;
        return acc;
      }, {} as LookupMap);
  };

  // Collect all
  const allEmails: LookupMap = collectEmails(
    options.to,
    options.cc,
    options.bcc,
  );

  const uniqueEmails: LookupMap = {};
  const removeDuplicates = (field: Emails): Emails => {
    if (!field) {
      return undefined;
    }
    const filterDuplicates = (
      value: string | Address,
    ): string | Address | undefined => {
      const email = extractEmail(value);
      if (!email || uniqueEmails[email]) {
        return undefined;
      }

      if (allEmails[email]) {
        uniqueEmails[email] = true;
        return email;
      }

      return value;
    };

    if (Array.isArray(field)) {
      return field
        .map(filterDuplicates)
        .filter((value): value is string | Address => !!value);
    }

    return filterDuplicates(field);
  };

  return {
    ...options,
    to: removeDuplicates(options.to),
    cc: removeDuplicates(options.cc),
    bcc: removeDuplicates(options.bcc),
  } as MailOptions;
};

/**
 * Generates a URL with the given path and query parameters.
 * @param {string} path - The path of the URL.
 * @param {Record<string, string>} params - The query parameters as key-value pairs.
 * @returns {string} - The generated URL.
 */
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
