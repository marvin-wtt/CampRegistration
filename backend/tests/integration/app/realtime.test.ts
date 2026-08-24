import { describe, expect, it, onTestFinished } from 'vitest';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import type { RealtimeEvent } from '@camp-registration/common/realtime';
import {
  EventFactory,
  EventManagerFactory,
  RegistrationFactory,
  RoomFactory,
  UserFactory,
} from '../../../prisma/factories/index.js';
import { generateAccessToken } from './utils/token.js';
import { request } from '../utils/request.js';
import { app } from '../setup.js';
import type { Event } from '#generated/prisma/client.js';

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

describe('/api/v1/events/:eventId/events (SSE)', () => {
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
    eventId: string,
    accessToken: string,
  ): Promise<SseClient> {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          host: '127.0.0.1',
          port,
          path: `/api/v1/events/${eventId}/events`,
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

  const createManagerWithToken = async (event: Event, role: string) => {
    const user = await UserFactory.create();
    const manager = await EventManagerFactory.create({
      event: { connect: { id: event.id } },
      user: { connect: { id: user.id } },
      role,
    });

    return { user, manager, accessToken: generateAccessToken(user) };
  };

  it('rejects users who are not event members', async () => {
    const port = await listen();
    const event = await EventFactory.create();
    const outsider = await UserFactory.create();

    const client = await openStream(
      port,
      event.id,
      generateAccessToken(outsider),
    );

    expect(client.status).toBe(403);
  });

  it('admits a system admin who is not a event manager and delivers permission-gated events', async () => {
    const port = await listen();
    const event = await EventFactory.create();
    const director = await createManagerWithToken(event, 'DIRECTOR');
    const admin = await UserFactory.create({ role: 'ADMIN' });

    // The admin is not a manager of this event, yet the stream opens (connect
    // bypass) and carries even the manager resource a VIEWER couldn't see —
    // admins hold every resource view permission.
    const adminStream = await openStream(
      port,
      event.id,
      generateAccessToken(admin),
    );
    expect(adminStream.status).toBe(200);

    await request()
      .post(`/api/v1/events/${event.id}/managers`)
      .send({ email: 'new-manager@example.com', role: 'VIEWER' })
      .auth(director.accessToken, { type: 'bearer' })
      .expect(201);

    await expect(
      adminStream.waitForEvent((e) => e.resource === 'manager'),
    ).resolves.toMatchObject({ operation: 'created' });
  });

  it('delivers task events to all roles', async () => {
    const port = await listen();
    const event = await EventFactory.create();
    const director = await createManagerWithToken(event, 'DIRECTOR');
    const viewer = await createManagerWithToken(event, 'VIEWER');

    const directorStream = await openStream(
      port,
      event.id,
      director.accessToken,
    );
    const viewerStream = await openStream(port, event.id, viewer.accessToken);

    const { body } = await request()
      .post(`/api/v1/events/${event.id}/tasks`)
      .send({ title: 'Prepare eventfire' })
      .auth(director.accessToken, { type: 'bearer' })
      .expect(201);

    const expected = (event: RealtimeEvent) =>
      event.resource === 'task' &&
      event.id === body.data.id &&
      event.operation === 'created';

    await expect(directorStream.waitForEvent(expected)).resolves.toMatchObject({
      requiredPermission: 'event.tasks.view',
    });
    await expect(viewerStream.waitForEvent(expected)).resolves.toBeDefined();
  });

  it('stamps the originating client id for echo suppression', async () => {
    const port = await listen();
    const event = await EventFactory.create();
    const director = await createManagerWithToken(event, 'DIRECTOR');
    const stream = await openStream(port, event.id, director.accessToken);

    await request()
      .post(`/api/v1/events/${event.id}/tasks`)
      .send({ title: 'Check tents' })
      .set('X-Client-Id', 'tab-1')
      .auth(director.accessToken, { type: 'bearer' })
      .expect(201);

    const event = await stream.waitForEvent((e) => e.resource === 'task');
    expect(event.origin).toBe('tab-1');
  });

  it('filters message events by permission, without disconnecting the stream', async () => {
    const port = await listen();
    const event = await EventFactory.create();
    const director = await createManagerWithToken(event, 'DIRECTOR');
    const coordinator = await createManagerWithToken(event, 'COORDINATOR');
    const counselor = await createManagerWithToken(event, 'COUNSELOR');
    const viewer = await createManagerWithToken(event, 'VIEWER');
    const registration = await RegistrationFactory.create({
      event: { connect: { id: event.id } },
      emails: ['recipient@example.com'],
    });

    const coordinatorStream = await openStream(
      port,
      event.id,
      coordinator.accessToken,
    );
    const counselorStream = await openStream(
      port,
      event.id,
      counselor.accessToken,
    );
    const viewerStream = await openStream(port, event.id, viewer.accessToken);

    await request()
      .post(`/api/v1/events/${event.id}/messages`)
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
      .post(`/api/v1/events/${event.id}/tasks`)
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

  it('delivers manager events to every event role', async () => {
    const port = await listen();
    const event = await EventFactory.create();
    const director = await createManagerWithToken(event, 'DIRECTOR');
    const counselor = await createManagerWithToken(event, 'COUNSELOR');
    const viewer = await createManagerWithToken(event, 'VIEWER');

    const counselorStream = await openStream(
      port,
      event.id,
      counselor.accessToken,
    );
    const viewerStream = await openStream(port, event.id, viewer.accessToken);

    await request()
      .post(`/api/v1/events/${event.id}/managers`)
      .send({ email: 'new-manager@example.com', role: 'VIEWER' })
      .auth(director.accessToken, { type: 'bearer' })
      .expect(201);

    const isManager = (event: RealtimeEvent) => event.resource === 'manager';

    await expect(
      counselorStream.waitForEvent(isManager),
    ).resolves.toMatchObject({ operation: 'created' });
    await expect(viewerStream.waitForEvent(isManager)).resolves.toMatchObject({
      operation: 'created',
    });
  });

  it('re-evaluates permissions on the open stream after a role change', async () => {
    const port = await listen();
    const event = await EventFactory.create();
    const director = await createManagerWithToken(event, 'DIRECTOR');
    const victim = await createManagerWithToken(event, 'COORDINATOR');
    const registration = await RegistrationFactory.create({
      event: { connect: { id: event.id } },
      emails: ['recipient@example.com'],
    });

    const victimStream = await openStream(port, event.id, victim.accessToken);

    const sendMessage = (subject: string) =>
      request()
        .post(`/api/v1/events/${event.id}/messages`)
        .send({
          registrationIds: [registration.id],
          subject,
          body: 'Hello!',
        })
        .auth(director.accessToken, { type: 'bearer' })
        .expect(201);

    // As COORDINATOR the victim holds `event.messages.view`.
    await sendMessage('Before the downgrade');
    await expect(
      victimStream.waitForEvent((e) => e.resource === 'message'),
    ).resolves.toBeDefined();

    await request()
      .patch(`/api/v1/events/${event.id}/managers/${victim.manager.id}`)
      .send({ role: 'VIEWER' })
      .auth(director.accessToken, { type: 'bearer' })
      .expect(200);

    // The event naming the victim's own manager record triggers the refresh.
    await victimStream.waitForEvent(
      (e) => e.resource === 'manager' && e.id === victim.manager.id,
    );

    // Give the async permission refresh a moment to hit the database.
    await new Promise((r) => setTimeout(r, 300));
    victimStream.events.length = 0;

    // A VIEWER no longer holds `event.messages.view` …
    await sendMessage('After the downgrade');
    await victimStream.expectSilence((e) => e.resource === 'message');

    // … while permitted resources keep flowing on the same connection.
    await request()
      .post(`/api/v1/events/${event.id}/tasks`)
      .send({ title: 'Still connected' })
      .auth(director.accessToken, { type: 'bearer' })
      .expect(201);

    await expect(
      victimStream.waitForEvent((e) => e.resource === 'task'),
    ).resolves.toBeDefined();
  });

  it('ends the stream when the subscriber is removed from the event', async () => {
    const port = await listen();
    const event = await EventFactory.create();
    const director = await createManagerWithToken(event, 'DIRECTOR');
    const victim = await createManagerWithToken(event, 'COORDINATOR');

    const victimStream = await openStream(port, event.id, victim.accessToken);

    await request()
      .delete(`/api/v1/events/${event.id}/managers/${victim.manager.id}`)
      .auth(director.accessToken, { type: 'bearer' })
      .expect(204);

    await expect(victimStream.ended).resolves.toBeUndefined();
  });

  it('emits a room update when a bed changes', async () => {
    const port = await listen();
    const event = await EventFactory.create();
    const director = await createManagerWithToken(event, 'DIRECTOR');
    const room = await RoomFactory.create({
      event: { connect: { id: event.id } },
    });

    const stream = await openStream(port, event.id, director.accessToken);

    await request()
      .post(`/api/v1/events/${event.id}/rooms/${room.id}/beds`)
      .send()
      .auth(director.accessToken, { type: 'bearer' })
      .expect(201);

    await expect(
      stream.waitForEvent((e) => e.resource === 'room'),
    ).resolves.toMatchObject({ id: room.id, operation: 'updated' });
  });

  it('emits a single collection invalidation for a bulk room update', async () => {
    const port = await listen();
    const event = await EventFactory.create();
    const director = await createManagerWithToken(event, 'DIRECTOR');
    const roomA = await RoomFactory.create({
      event: { connect: { id: event.id } },
    });
    const roomB = await RoomFactory.create({
      event: { connect: { id: event.id } },
    });

    const stream = await openStream(port, event.id, director.accessToken);

    await request()
      .patch(`/api/v1/events/${event.id}/rooms/`)
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
    const event = await EventFactory.create();
    const director = await createManagerWithToken(event, 'DIRECTOR');
    const registration = await RegistrationFactory.create({
      event: { connect: { id: event.id } },
    });

    const stream = await openStream(port, event.id, director.accessToken);

    await request()
      .delete(`/api/v1/events/${event.id}/registrations/${registration.id}`)
      .auth(director.accessToken, { type: 'bearer' })
      .expect(204);

    await expect(
      stream.waitForEvent((e) => e.resource === 'registration'),
    ).resolves.toMatchObject({ id: registration.id, operation: 'deleted' });
  });
});
