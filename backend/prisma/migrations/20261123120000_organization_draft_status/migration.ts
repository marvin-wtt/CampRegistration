import type { Prisma } from '#generated/prisma/client.js';

// A pending organization without a published privacy notice can't be
// verified, so it goes back to draft until it publishes one.
export async function up(tx: Prisma.TransactionClient): Promise<void> {
  const published = await tx.privacyNoticeVersion.findMany({
    where: { scope: 'ORGANIZATION' },
    select: { scopeId: true },
    distinct: ['scopeId'],
  });

  await tx.organization.updateMany({
    where: {
      verificationStatus: 'PENDING',
      id: { notIn: published.map((notice) => notice.scopeId) },
    },
    data: { verificationStatus: 'DRAFT', submittedAt: null },
  });
}
