import config from "@/config";
import transport from "@/config/mail";
import { generateQueryString } from "@/utils/uri";
import i18n from "@/config/i18n";
import Mail from "nodemailer/lib/mailer";

const t = i18n.t;

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

const sendResetPasswordEmail = (to: string, token: string) => {
  const template = "reset-password";
  const subject = t("email:auth.reset-password.subject");
  const url = generateUrl("reset-password", {
    email: to,
    token,
  });

  const context = {
    url,
  };

  const options = {};

  sendEmail(to, subject, template, context, options);
};

const sendVerificationEmail = (to: string, token: string) => {
  const subject = t("email:auth.email-verification.subject");

  const url = generateUrl("verify-email", {
    email: to,
    token,
  });

  const text = ""; // TODO
  const template = "verify-email";

  sendEmail(to, subject, template, {});
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
  transport,
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendCampManagerInvitation,
};
