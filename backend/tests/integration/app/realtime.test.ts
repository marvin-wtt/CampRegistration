import { describe, expect, it, onTestFinished } from 'vitest';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import type { RealtimeEvent } from '@camp-registration/common/realtime';
import {
  CampFactory,
  CampManagerFactory,
  RegistrationFactory,
  RoomFactory,
  UserFactory,
} from '../../../prisma/factories/index.js';
import { generateAccessToken } from './utils/token.js';
import { request } from '../utils/request.js';
import { app } from '../setup.js';
import type { Camp } from '#generated/prisma/client.js';

interface SseClient {
  status: number;
  events: RealtimeEvent[];
  /** Resolves when the server ends the stream (or the socket closes). */
  ended: Promise<void>;
  waitForEvent(
    predicate: (event: RealtimeEvent) => boolean,
    timeoutMs?: number,
  ): Promise<RealtimeEvent>;
  /** Asserts no matching event arrives within the window. */
  expectSilence(
    predicate: (event: RealtimeEvent) => boolean,
    windowMs?: number,
  ): Promise<void>;
  close(): void;
}

describe('/api/v1/camps/:campId/events (SSE)', () => {
  // supertest cannot consume open-ended SSE responses, so the suite runs the
  // booted app on a real ephemeral HTTP server and reads the stream raw.
  async function listen(): Promise<number> {
    const server = http.createServer(app!);
    await new Promise<void>((resolve) => server.listen(0, resolve));

    onTestFinished(
      () =>
        new Promise<void>((resolve) => {
          server.closeAllConnections();
          server.close(() => resolve());
        }),
    );

    return (server.address() as AddressInfo).port;
  }

  function openStream(
    port: number,
    campId: string,
    accessToken: string,
  ): Promise<SseClient> {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          host: '127.0.0.1',
          port,
          path: `/api/v1/camps/${campId}/events`,
          headers: {
            Accept: 'text/event-stream',
            Authorization: `Bearer ${accessToken}`,
          },
        },
        (res) => {
          const events: RealtimeEvent[] = [];
          const waiters: (() => void)[] = [];
          let buffer = '';

          let onEnd!: () => void;
          const ended = new Promise<void>((r) => (onEnd = r));

          res.setEncoding('utf8');
          res.on('data', (chunk: string) => {
            buffer += chunk;
            // SSE frames are separated by a blank line.
            let index;
            while ((index = buffer.indexOf('\n\n')) !== -1) {
              const frame = buffer.slice(0, index);
              buffer = buffer.slice(index + 2);
              for (const line of frame.split('\n')) {
                if (line.startsWith('data: ')) {
                  events.push(JSON.parse(line.slice(6)) as RealtimeEvent);
                }
              }
            }
            waiters.forEach((notify) => notify());
          });
          res.on('end', onEnd);
          res.on('close', onEnd);

          const client: SseClient = {
            status: res.statusCode ?? 0,
            events,
            ended,
            waitForEvent(predicate, timeoutMs = 2000) {
              return new Promise<RealtimeEvent>((resolveEvent, rejectEvent) => {
                const check = () => {
                  const match = events.find(predicate);
                  if (match) {
                    clearTimeout(timer);
                    resolveEvent(match);
                  }
                };
                const timer = setTimeout(() => {
                  rejectEvent(
                    new Error(
                      `Timed out waiting for event. Received: ${JSON.stringify(events)}`,
                    ),
                  );
                }, timeoutMs);
                waiters.push(check);
                check();
              });
            },
            async expectSilence(predicate, windowMs = 500) {
              await new Promise((r) => setTimeout(r, windowMs));
              expect(events.filter(predicate)).toEqual([]);
            },
            close() {
              res.destroy();
              req.destroy();
            },
          };

          onTestFinished(() => client.close());
          resolve(client);
        },
      );
      req.on('error', reject);
      req.end();
    });
  }

  const createManagerWithToken = async (camp: Camp, role: string) => {
    const user = await UserFactory.create();
    const manager = await CampManagerFactory.create({
      camp: { connect: { id: camp.id } },
      user: { connect: { id: user.id } },
      role,
    });

    return { user, manager, accessToken: generateAccessToken(user) };
  };

  it('rejects users who are not camp members', async () => {
    const port = await listen();
    const camp = await CampFactory.create();
    const outsider = await UserFactory.create();

    const client = await openStream(
      port,
      camp.id,
      generateAccessToken(outsider),
    );

    expect(client.status).toBe(403);
  });

  it('delivers task events to all roles', async () => {
    const port = await listen();
    const camp = await CampFactory.create();
    const director = await createManagerWithToken(camp, 'DIRECTOR');
    const viewer = await createManagerWithToken(camp, 'VIEWER');

    const directorStream = await openStream(
      port,
      camp.id,
      director.accessToken,
    );
    const viewerStream = await openStream(port, camp.id, viewer.accessToken);

    const { body } = await request()
      .post(`/api/v1/camps/${camp.id}/tasks`)
      .send({ title: 'Prepare campfire' })
      .auth(director.accessToken, { type: 'bearer' })
      .expect(201);

    const expected = (event: RealtimeEvent) =>
      event.resource === 'task' &&
      event.id === body.data.id &&
      event.operation === 'created';

    await expect(directorStream.waitForEvent(expected)).resolves.toMatchObject({
      requiredPermission: 'camp.tasks.view',
    });
    await expect(viewerStream.waitForEvent(expected)).resolves.toBeDefined();
  });

  it('stamps the originating client id for echo suppression', async () => {
    const port = await listen();
    const camp = await CampFactory.create();
    const director = await createManagerWithToken(camp, 'DIRECTOR');
    const stream = await openStream(port, camp.id, director.accessToken);

    await request()
      .post(`/api/v1/camps/${camp.id}/tasks`)
      .send({ title: 'Check tents' })
      .set('X-Client-Id', 'tab-1')
      .auth(director.accessToken, { type: 'bearer' })
      .expect(201);

    const event = await stream.waitForEvent((e) => e.resource === 'task');
    expect(event.origin).toBe('tab-1');
  });

  it('filters message events by permission, without disconnecting the stream', async () => {
    const port = await listen();
    const camp = await CampFactory.create();
    const director = await createManagerWithToken(camp, 'DIRECTOR');
    const coordinator = await createManagerWithToken(camp, 'COORDINATOR');
    const counselor = await createManagerWithToken(camp, 'COUNSELOR');
    const viewer = await createManagerWithToken(camp, 'VIEWER');
    const registration = await RegistrationFactory.create({
      camp: { connect: { id: camp.id } },
      emails: ['recipient@example.com'],
    });

    const coordinatorStream = await openStream(
      port,
      camp.id,
      coordinator.accessToken,
    );
    const counselorStream = await openStream(
      port,
      camp.id,
      counselor.accessToken,
    );
    const viewerStream = await openStream(port, camp.id, viewer.accessToken);

    await request()
      .post(`/api/v1/camps/${camp.id}/messages`)
      .send({
        registrationIds: [registration.id],
        subject: 'Welcome',
        body: 'Hello!',
      })
      .auth(director.accessToken, { type: 'bearer' })
      .expect(201);

    const isMessage = (event: RealtimeEvent) => event.resource === 'message';

    await expect(
      coordinatorStream.waitForEvent(isMessage),
    ).resolves.toMatchObject({ operation: 'created' });
    await counselorStream.expectSilence(isMessage);
    await viewerStream.expectSilence(isMessage);

    // The filtered streams are still connected: a permitted event arrives.
    await request()
      .post(`/api/v1/camps/${camp.id}/tasks`)
      .send({ title: 'After the message' })
      .auth(director.accessToken, { type: 'bearer' })
      .expect(201);

    await expect(
      counselorStream.waitForEvent((e) => e.resource === 'task'),
    ).resolves.toBeDefined();
    await expect(
      viewerStream.waitForEvent((e) => e.resource === 'task'),
    ).resolves.toBeDefined();
  });

  it('hides manager events from viewers but delivers them to counselors', async () => {
    const port = await listen();
    const camp = await CampFactory.create();
    const director = await createManagerWithToken(camp, 'DIRECTOR');
    const counselor = await createManagerWithToken(camp, 'COUNSELOR');
    const viewer = await createManagerWithToken(camp, 'VIEWER');

    const counselorStream = await openStream(
      port,
      camp.id,
      counselor.accessToken,
    );
    const viewerStream = await openStream(port, camp.id, viewer.accessToken);

    await request()
      .post(`/api/v1/camps/${camp.id}/managers`)
      .send({ email: 'new-manager@example.com', role: 'VIEWER' })
      .auth(director.accessToken, { type: 'bearer' })
      .expect(201);

    const isManager = (event: RealtimeEvent) => event.resource === 'manager';

    await expect(
      counselorStream.waitForEvent(isManager),
    ).resolves.toMatchObject({ operation: 'created' });
    await viewerStream.expectSilence(isManager);
  });

  it('re-evaluates permissions on the open stream after a role change', async () => {
    const port = await listen();
    const camp = await CampFactory.create();
    const director = await createManagerWithToken(camp, 'DIRECTOR');
    const victim = await createManagerWithToken(camp, 'COORDINATOR');

    const victimStream = await openStream(port, camp.id, victim.accessToken);

    // As COORDINATOR the victim sees manager events — including their own
    // downgrade (delivered with the pre-change permission set).
    await request()
      .patch(`/api/v1/camps/${camp.id}/managers/${victim.manager.id}`)
      .send({ role: 'VIEWER' })
      .auth(director.accessToken, { type: 'bearer' })
      .expect(200);

    await victimStream.waitForEvent(
      (e) => e.resource === 'manager' && e.operation === 'updated',
    );

    // Give the async permission refresh a moment to hit the database.
    await new Promise((r) => setTimeout(r, 300));
    victimStream.events.length = 0;

    // Further manager events are now hidden from the downgraded viewer …
    await request()
      .patch(`/api/v1/camps/${camp.id}/managers/${victim.manager.id}`)
      .send({ role: 'VIEWER' })
      .auth(director.accessToken, { type: 'bearer' })
      .expect(200);

    await victimStream.expectSilence((e) => e.resource === 'manager');

    // … while permitted resources keep flowing on the same connection.
    await request()
      .post(`/api/v1/camps/${camp.id}/tasks`)
      .send({ title: 'Still connected' })
      .auth(director.accessToken, { type: 'bearer' })
      .expect(201);

    await expect(
      victimStream.waitForEvent((e) => e.resource === 'task'),
    ).resolves.toBeDefined();
  });

  it('ends the stream when the subscriber is removed from the camp', async () => {
    const port = await listen();
    const camp = await CampFactory.create();
    const director = await createManagerWithToken(camp, 'DIRECTOR');
    const victim = await createManagerWithToken(camp, 'COORDINATOR');

    const victimStream = await openStream(port, camp.id, victim.accessToken);

    await request()
      .delete(`/api/v1/camps/${camp.id}/managers/${victim.manager.id}`)
      .auth(director.accessToken, { type: 'bearer' })
      .expect(204);

    await expect(victimStream.ended).resolves.toBeUndefined();
  });

  it('emits a room update when a bed changes', async () => {
    const port = await listen();
    const camp = await CampFactory.create();
    const director = await createManagerWithToken(camp, 'DIRECTOR');
    const room = await RoomFactory.create({
      camp: { connect: { id: camp.id } },
    });

    const stream = await openStream(port, camp.id, director.accessToken);

    await request()
      .post(`/api/v1/camps/${camp.id}/rooms/${room.id}/beds`)
      .send()
      .auth(director.accessToken, { type: 'bearer' })
      .expect(201);

    await expect(
      stream.waitForEvent((e) => e.resource === 'room'),
    ).resolves.toMatchObject({ id: room.id, operation: 'updated' });
  });

  it('emits a single collection invalidation for a bulk room update', async () => {
    const port = await listen();
    const camp = await CampFactory.create();
    const director = await createManagerWithToken(camp, 'DIRECTOR');
    const roomA = await RoomFactory.create({
      camp: { connect: { id: camp.id } },
    });
    const roomB = await RoomFactory.create({
      camp: { connect: { id: camp.id } },
    });

    const stream = await openStream(port, camp.id, director.accessToken);

    await request()
      .patch(`/api/v1/camps/${camp.id}/rooms/`)
      .send({
        rooms: [
          { id: roomA.id, sortOrder: 2 },
          { id: roomB.id, sortOrder: 1 },
        ],
      })
      .auth(director.accessToken, { type: 'bearer' })
      .expect(200);

    await expect(
      stream.waitForEvent((e) => e.resource === 'room'),
    ).resolves.toMatchObject({ id: null, operation: 'invalidated' });
    // Exactly one room event for the whole transaction.
    expect(
      stream.events.filter((event) => event.resource === 'room'),
    ).toHaveLength(1);
  });

  it('emits registration events on the stream', async () => {
    const port = await listen();
    const camp = await CampFactory.create();
    const director = await createManagerWithToken(camp, 'DIRECTOR');
    const registration = await RegistrationFactory.create({
      camp: { connect: { id: camp.id } },
    });

    const stream = await openStream(port, camp.id, director.accessToken);

    await request()
      .delete(`/api/v1/camps/${camp.id}/registrations/${registration.id}`)
      .auth(director.accessToken, { type: 'bearer' })
      .expect(204);

    await expect(
      stream.waitForEvent((e) => e.resource === 'registration'),
    ).resolves.toMatchObject({ id: registration.id, operation: 'deleted' });
  });
});
