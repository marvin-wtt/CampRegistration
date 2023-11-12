import config from "@/config";
import transport from "@/config/mail";
import { generateQueryString } from "@/utils/uri";
import i18n from "@/config/i18n";
import Mail from "nodemailer/lib/mailer";

const t = i18n.t;

type Options = Exclude<Mail.Options, "to" | "subject" | "template" | "context">;

const sendEmail = async (
  to: string,
  subject: string,
  template: string,
  context: object,
  options: Options = {},
) => {
  const { from, replyTo } = config.email;
  const appName = t("app-name");

  subject = `${subject} | ${appName}`;

  context = {
    ...context,
  };

  // TODO attachments
  // TODO alternatives
  await transport.sendMail({
    ...options,
    to,
    from,
    replyTo,
    subject,
    template,
    context,
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

const sendResetPasswordEmail = async (to: string, token: string) => {
  const template = "reset-password";
  const subject = t("email:auth.reset-password.subject");
  const url = generateUrl("reset-password", {
    email: to,
    token,
  });

  return sendEmail(to, subject, template, {
    url,
  });
};

const sendVerificationEmail = async (to: string, token: string) => {
  const subject = t("email:auth.email-verification.subject");

  const url = generateUrl("verify-email", {
    email: to,
    token,
  });

  const text = ""; // TODO
  const template = "verify-email";

  return sendEmail(to, subject, template, {});
};

const sendCampManagerInvitation = async (
  to: string,
  campId: string,
  managerId: string,
) => {
  const subject = t("email:camp.invitation");

  const url = generateUrl(`camp-management/`);

  return sendEmail(to, subject, "", {});
};

export default {
  transport,
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendCampManagerInvitation,
};
