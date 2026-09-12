import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  connectMock,
  getMailboxLockMock,
  releaseLockMock,
  searchMock,
  messageFlagsAddMock,
  logoutMock,
  simpleParserMock,
  loggerErrorMock,
  loggerWarnMock,
} = vi.hoisted(() => ({
  connectMock: vi.fn(),
  getMailboxLockMock: vi.fn(),
  releaseLockMock: vi.fn(),
  searchMock: vi.fn(),
  messageFlagsAddMock: vi.fn(),
  logoutMock: vi.fn(),
  simpleParserMock: vi.fn(),
  loggerErrorMock: vi.fn(),
  loggerWarnMock: vi.fn(),
}));

// Each fetched message, set per-test via `fetchMessages`.
let fetchMessages: { uid: number; source?: Buffer }[] = [];

vi.mock('imapflow', () => ({
  ImapFlow: class {
    connect = connectMock;
    logout = logoutMock;
    search = searchMock;
    messageFlagsAdd = messageFlagsAddMock;

    async getMailboxLock(...args: unknown[]) {
      return getMailboxLockMock(...args);
    }

    // eslint-disable-next-line @typescript-eslint/require-await -- matches ImapFlow's async generator signature
    async *fetch() {
      for (const message of fetchMessages) {
        yield message;
      }
    }
  },
}));

vi.mock('mailparser', () => ({
  simpleParser: simpleParserMock,
}));

vi.mock('#config/index', () => ({
  default: {
    email: {
      bounce: {
        host: 'imap.example.com',
        port: 993,
        secure: true,
        auth: { user: 'bounce-user@example.com', pass: 'secret' },
      },
    },
  },
}));

vi.mock('#core/logger', () => ({
  default: {
    warn: loggerWarnMock,
    error: loggerErrorMock,
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

const { BounceReader, extractBounce } =
  await import('#core/mail/bounce.reader');

describe('extractBounce', () => {
  it('extracts the action and Original-Envelope-Id from a delivery-status block', () => {
    const text = [
      'Reporting-MTA: dns; relay.example.com',
      'Original-Envelope-Id: abc123ulid@ourapp.example.com',
      'Final-Recipient: rfc822; someone@example.com',
      'Action: failed',
      'Status: 5.1.1',
    ].join('\n');

    expect(extractBounce(text)).toEqual({
      action: 'failed',
      correlationId: 'abc123ulid@ourapp.example.com',
    });
  });

  it('trims angle brackets some servers wrap the envelope id in', () => {
    const text =
      'Original-Envelope-Id: <abc123@ourapp.example.com>\nAction: delayed\n';

    expect(extractBounce(text)?.correlationId).toBe(
      'abc123@ourapp.example.com',
    );
  });

  it('returns undefined when the action is not failed/delayed', () => {
    const text =
      'Original-Envelope-Id: abc123@ourapp.example.com\nAction: delivered\n';

    expect(extractBounce(text)).toBeUndefined();
  });

  it('returns undefined when either field is missing', () => {
    expect(extractBounce('Action: failed\n')).toBeUndefined();
    expect(
      extractBounce('Original-Envelope-Id: abc123@ourapp.example.com\n'),
    ).toBeUndefined();
  });
});

describe('BounceReader.pollOnce', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMessages = [];
    getMailboxLockMock.mockResolvedValue({
      path: 'INBOX',
      release: releaseLockMock,
    });
    searchMock.mockResolvedValue([1, 2]);
    messageFlagsAddMock.mockResolvedValue(true);
  });

  it('returns nothing and never connects when bounce reading is not configured', async () => {
    const config = (await import('#config/index')).default;
    config.email.bounce = undefined;

    const results = await new BounceReader().pollOnce();

    expect(results).toEqual([]);
    expect(connectMock).not.toHaveBeenCalled();

    config.email.bounce = {
      host: 'imap.example.com',
      port: 993,
      secure: true,
      auth: { user: 'bounce-user@example.com', pass: 'secret' },
    };
  });

  it('parses matched messages, skips unmatched ones, and marks every fetched uid seen', async () => {
    fetchMessages = [
      { uid: 1, source: Buffer.from('bounce report') },
      { uid: 2, source: Buffer.from('unrelated mail') },
    ];
    simpleParserMock
      .mockResolvedValueOnce({
        text: 'Original-Envelope-Id: abc123@ourapp.example.com\nAction: failed\n',
      })
      .mockResolvedValueOnce({ text: 'just a normal reply, nothing to see' });

    const results = await new BounceReader().pollOnce();

    expect(results).toEqual([
      { action: 'failed', correlationId: 'abc123@ourapp.example.com' },
    ]);
    expect(messageFlagsAddMock).toHaveBeenCalledWith([1, 2], ['\\Seen'], {
      uid: true,
    });
    expect(releaseLockMock).toHaveBeenCalled();
    expect(logoutMock).toHaveBeenCalled();
  });

  it('logs and continues when a single message fails to parse', async () => {
    searchMock.mockResolvedValue([1]);
    fetchMessages = [{ uid: 1, source: Buffer.from('broken') }];
    simpleParserMock.mockRejectedValueOnce(new Error('bad mime'));

    const results = await new BounceReader().pollOnce();

    expect(results).toEqual([]);
    expect(messageFlagsAddMock).toHaveBeenCalledWith([1], ['\\Seen'], {
      uid: true,
    });
  });

  it('skips messages with no fetched source', async () => {
    fetchMessages = [{ uid: 1 }];

    const results = await new BounceReader().pollOnce();

    expect(results).toEqual([]);
    expect(simpleParserMock).not.toHaveBeenCalled();
  });

  it('does nothing further when the mailbox has no unseen messages', async () => {
    searchMock.mockResolvedValue([]);

    const results = await new BounceReader().pollOnce();

    expect(results).toEqual([]);
    expect(messageFlagsAddMock).not.toHaveBeenCalled();
    expect(logoutMock).toHaveBeenCalled();
  });

  it('logs a specific message and rethrows when connecting fails, without touching the mailbox', async () => {
    const connectError = new Error('ECONNREFUSED');
    connectMock.mockRejectedValueOnce(connectError);

    await expect(new BounceReader().pollOnce()).rejects.toThrow(connectError);

    expect(loggerErrorMock).toHaveBeenCalledWith(
      expect.stringContaining(
        'Failed to connect to bounce mailbox imap.example.com:993',
      ),
    );
    expect(getMailboxLockMock).not.toHaveBeenCalled();
    expect(logoutMock).not.toHaveBeenCalled();
  });

  it('rethrows the real error, releases the lock, and logs out even when a mailbox operation fails', async () => {
    const searchError = new Error('server hung up');
    searchMock.mockRejectedValueOnce(searchError);

    await expect(new BounceReader().pollOnce()).rejects.toThrow(searchError);

    expect(loggerErrorMock).toHaveBeenCalledWith(
      expect.stringContaining('Bounce mailbox poll failed while reading INBOX'),
    );
    expect(releaseLockMock).toHaveBeenCalled();
    expect(logoutMock).toHaveBeenCalled();
  });

  it('surfaces the original error, not a cleanup failure, when both fail', async () => {
    const searchError = new Error('server hung up');
    searchMock.mockRejectedValueOnce(searchError);
    releaseLockMock.mockImplementationOnce(() => {
      throw new Error('lock already released');
    });
    logoutMock.mockRejectedValueOnce(new Error('socket already closed'));

    await expect(new BounceReader().pollOnce()).rejects.toThrow(searchError);

    expect(loggerWarnMock).toHaveBeenCalledWith(
      expect.stringContaining('Failed to release bounce mailbox lock'),
    );
    expect(loggerWarnMock).toHaveBeenCalledWith(
      expect.stringContaining('Failed to log out of bounce mailbox'),
    );
  });

  it('logs but does not fail the poll when logout fails after a successful run', async () => {
    logoutMock.mockRejectedValueOnce(new Error('socket already closed'));

    const results = await new BounceReader().pollOnce();

    expect(results).toEqual([]);
    expect(loggerWarnMock).toHaveBeenCalledWith(
      expect.stringContaining('Failed to log out of bounce mailbox'),
    );
  });
});
