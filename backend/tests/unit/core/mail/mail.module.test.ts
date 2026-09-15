import { afterEach, describe, expect, it, vi } from 'vitest';
import type { IMailer } from '#core/mail/mailer.types';

const { resolveMock } = vi.hoisted(() => ({ resolveMock: vi.fn() }));

vi.mock('#core/ioc/container', () => ({
  resolve: resolveMock,
}));

const { MailModule } = await import('#core/mail/mail.module');
const { JobScheduler } = await import('#core/scheduler/JobScheduler');

function fakeMailService(mailer: Partial<IMailer>) {
  return {
    getMailer: () => mailer as IMailer,
  };
}

describe('MailModule.registerApiRoutes', () => {
  it("mounts a webhook the mailer describes under the shared '/webhooks' prefix", () => {
    const webhookHandler = vi.fn();
    resolveMock.mockReturnValue(
      fakeMailService({
        getBounceWebhook: () => ({
          path: '/mailjet/:secret',
          handler: webhookHandler,
        }),
      }),
    );
    const postMock = vi.fn();

    new MailModule().registerApiRoutes({ post: postMock } as never);

    expect(postMock).toHaveBeenCalledWith(
      '/webhooks/mailjet/:secret',
      webhookHandler,
    );
  });

  it('mounts nothing when the active mailer has no webhook to describe', () => {
    resolveMock.mockReturnValue(fakeMailService({}));
    const postMock = vi.fn();

    new MailModule().registerApiRoutes({ post: postMock } as never);

    expect(postMock).not.toHaveBeenCalled();
  });
});

describe('MailModule.registerJobs', () => {
  let scheduler: InstanceType<typeof JobScheduler>;

  afterEach(() => {
    scheduler?.stop();
  });

  it('schedules a running job under its own name and schedule, running the work the mailer describes', () => {
    resolveMock.mockReturnValue(
      fakeMailService({
        getBouncePollJob: () => vi.fn().mockResolvedValue(undefined),
      }),
    );
    scheduler = new JobScheduler();

    new MailModule().registerJobs(scheduler);

    const job = scheduler.findJob('bounce-mailbox-poll');
    expect(job?.isRunning()).toBeTruthy();
    expect(job?.getPattern()).toBe('*/5 * * * *');
  });

  it('schedules nothing when the active mailer has no poll job to describe', () => {
    resolveMock.mockReturnValue(fakeMailService({}));
    scheduler = new JobScheduler();

    new MailModule().registerJobs(scheduler);

    expect(scheduler.findJob('bounce-mailbox-poll')).toBeUndefined();
  });
});
