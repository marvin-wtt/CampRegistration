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
  // Node's fetch (undici) pools keep-alive sockets. MailDev closes idle
  // connections on its side, so a reused socket can race into `ECONNRESET`
  // ("TypeError: fetch failed"). These calls are cheap and idempotent, so
  // retry transient connection failures a few times before giving up.
  const maxAttempts = 3;
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(`${baseUrl}${path}`, {
        method,
        // Avoid socket reuse, which is the source of the ECONNRESET races.
        headers: { connection: "close" },
      });

      if (!res.ok) {
        throw new Error(
          `Maildev request failed: ${method} ${path} (${res.status})`,
        );
      }

      return res.json() as Promise<T>;
    } catch (err) {
      const isConnReset =
        err instanceof TypeError && err.message === "fetch failed";
      if (!isConnReset || attempt >= maxAttempts) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
    }
  }
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
