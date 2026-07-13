export interface MaildevAddress {
  address: string;
  name: string;
}

export interface MaildevMessage {
  id: string;
  subject: string;
  html: string;
  text: string;
  to: MaildevAddress[];
}

const protocol = process.env.MAILDEV_PROTOCOL ?? "http";
const host = process.env.MAILDEV_HOST ?? "localhost";
const apiPort = process.env.MAILDEV_API_PORT ?? "1081";
const baseUrl = `${protocol}://${host}:${apiPort}`;

async function request<T>(method: string, path: string): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, { method });

  if (!res.ok) {
    throw new Error(
      `Maildev request failed: ${method} ${path} (${res.status})`,
    );
  }

  return res.json() as Promise<T>;
}

export function getAllMessages(): Promise<MaildevMessage[]> {
  return request<MaildevMessage[]>("GET", "/email");
}

export async function getMessageBySentTo(
  address: string,
): Promise<MaildevMessage | null> {
  const messages = await getAllMessages();

  for (const message of [...messages].reverse()) {
    if (message.to.some((to) => to.address === address)) {
      return message;
    }
  }

  return null;
}

export async function deleteAllMessages(): Promise<void> {
  await request<void>("DELETE", "/email/all");
}
