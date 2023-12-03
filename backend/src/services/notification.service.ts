import config from "@/config";
import transport from "@/config/mail";
import { generateQueryString } from "@/utils/uri";
import Mail from "nodemailer/lib/mailer";
import { t } from "@/config/i18n";

type Options = Exclude<
  Mail.Options,
  "to" | "subject" | "template" | "context"
> & {
  replyTo?: string | string[];
};

const sendEmail = (
  to: string,
  subject: string,
  template: string,
  context: object,
  options: Options = {},
) => {
  const { from } = config.email;
  const appName = t("app-name");

  subject = `${subject} | ${appName}`;

  context = {
    ...context,
  };

  const replyTo =
    options.replyTo && Array.isArray(options.replyTo)
      ? options.replyTo.join(";")
      : options.replyTo;

  // TODO attachments
  // TODO alternatives
  transport
    .sendMail({
      ...options,
      to,
      from,
      replyTo,
      subject,
      template,
      context,
    })
    .catch((reason) => {
      console.error("Failed to send email: " + reason);
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

const sendCampManagerInvitation = (
  to: string,
  campId: string,
  managerId: string,
) => {
  const subject = t("email:camp.invitation");

  const url = generateUrl(`camp-management/`);

  sendEmail(to, subject, "", {});
};

export default {
  sendEmail,
  generateUrl,
  sendCampManagerInvitation,
};
