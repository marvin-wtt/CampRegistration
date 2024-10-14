import { catchRequestAsync } from './catchAsync';
import { Response } from 'express';
import { authUserId } from './authUserId';

interface Client {
  userId?: string;
  res: Response;
}

const clients = new Set<Client>();

const removeClient = (res: Response) => {
  for (const client of clients) {
    if (client.res === res) {
      clients.delete(client);
      break;
    }
  }
};

export function disconnectUserClients(userId: string) {
  clients.forEach((client) => {
    if (client.userId === userId) {
      client.res.end();
    }
  });
}

const eventStream = <T>() => {
  const handler = catchRequestAsync(async (req, res) => {
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Clean up when the client closes the connection
    req.on('close', () => {
      removeClient(res);
    });

    const userId = req.isAuthenticated() ? authUserId(req) : undefined;

    clients.add({ res, userId });
  });

  const broadcast = (eventName: string, value: T) => {
    const event = `event: ${eventName}\n`;
    const data = `data: ${JSON.stringify(value)}\n\n`;
    for (const client of clients) {
      client.res.write(event);
      client.res.write(data);
    }
  };

  return {
    handler,
    broadcast,
  };
};

export default eventStream;
