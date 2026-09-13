import { describe, expect, it } from 'vitest';
import type { Request } from 'express';
import { programPublicSubscriber } from '#app/programPublic/program-public.guard';

const fakeReq = (verificationStatus: string): Request =>
  ({
    modelOrFail: () => ({
      organization: { id: 'org-1', verificationStatus },
    }),
  }) as unknown as Request;

describe('programPublicSubscriber', () => {
  it('grants the anonymous public permission set when the organization is verified', async () => {
    const subscriber = await programPublicSubscriber(fakeReq('VERIFIED'));

    expect(subscriber).toEqual({
      managerId: '',
      permissions: new Set(['event.program_items.view', 'event.view']),
      expiresAt: null,
      revalidate: true,
    });
  });

  it.each(['PENDING', 'REJECTED'] as const)(
    'refuses the stream when the organization is %s',
    async (verificationStatus) => {
      const subscriber = await programPublicSubscriber(
        fakeReq(verificationStatus),
      );

      expect(subscriber).toBeNull();
    },
  );
});
