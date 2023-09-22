import config from "@/config";
import transport from "@/config/mail";
import { render } from "@/utils/render";
import { generateQueryString } from "@/utils/uri";

const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  html: string
) => {
  const { from, replyTo } = config.email;
  const { appName } = config;

  subject = `${subject} | ${appName}`;

  await transport.sendMail({
    from,
    replyTo,
    to,
    subject,
    text,
    html,
  });
};

const generateUrl = (
  path: string,
  params: Record<string, string> = {}
): string => {
  const { origin } = config;
  const query = generateQueryString(params);

  return `${origin}/${path}?${query}`;
};

const sendResetPasswordEmail = async (to: string, token: string) => {
  const subject = "Reset password ";
  const url = generateUrl("reset-password", {
    email: to,
    token,
  });

  const text = ""; // TODO
  const html = await render("emails/forgot_password", {
    url,
  });

  await sendEmail(to, subject, text, html);
};

const sendVerificationEmail = async (to: string, token: string) => {
  const subject = "Email Verification";

  const url = generateUrl("verify-email", {
    email: to,
    token,
  });

  const text = ""; // TODO
  const html = await render("emails/verify_email", {
    url,
  });

  await sendEmail(to, subject, text, html);
};

const sendCampManagerInvitation = async (
  to: string,
  campId: string,
  managerId: string,
  token: string
) => {
  const subject = "Camp Invitation";

  const url = generateUrl(
    `camp-management/${campId}/managers/${managerId}/accept`,
    {
      token,
    }
  );

  const text = ""; // TODO
  const html = await render("emails/camp_manager_invitation", {
    url,
  });

  await sendEmail(to, subject, text, html);
};

export default {
  transport,
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendCampManagerInvitation,
};
