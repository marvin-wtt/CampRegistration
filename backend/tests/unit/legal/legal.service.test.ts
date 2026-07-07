import { describe, expect, it, vi } from 'vitest';
import { Prisma } from '#generated/prisma/client';
import { LegalService } from '#app/legal/legal.service';

const prismaMock = {
  legalDocument: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    upsert: vi.fn(),
  },
};

const service = new LegalService(prismaMock as never);

describe('LegalService.getDocument', () => {
  it('looks up the document by its unique type', async () => {
    prismaMock.legalDocument.findUnique.mockResolvedValue({
      id: 'doc-1',
      type: 'IMPRINT',
      content: 'Hello',
      updatedAt: new Date('2024-01-01'),
    });

    const document = await service.getDocument('IMPRINT');

    expect(prismaMock.legalDocument.findUnique).toHaveBeenCalledWith({
      where: { type: 'IMPRINT' },
    });
    expect(document.content).toBe('Hello');
  });

  it('returns an empty placeholder when no row exists yet', async () => {
    prismaMock.legalDocument.findUnique.mockResolvedValue(null);

    const document = await service.getDocument('PRIVACY_POLICY');

    expect(document).toEqual({
      id: '',
      type: 'PRIVACY_POLICY',
      content: null,
      updatedAt: null,
    });
  });
});

describe('LegalService.getAllDocuments', () => {
  it('fills in a placeholder for any type without a stored row', async () => {
    prismaMock.legalDocument.findMany.mockResolvedValue([
      {
        id: 'doc-1',
        type: 'IMPRINT',
        content: 'Hello',
        updatedAt: new Date('2024-01-01'),
      },
    ]);

    const documents = await service.getAllDocuments();

    expect(documents).toEqual([
      {
        id: 'doc-1',
        type: 'IMPRINT',
        content: 'Hello',
        updatedAt: new Date('2024-01-01'),
      },
      { id: '', type: 'PRIVACY_POLICY', content: null, updatedAt: null },
    ]);
  });
});

describe('LegalService.upsertDocument', () => {
  it('passes the given content through on create and update', async () => {
    await service.upsertDocument('IMPRINT', { en: 'Hello' });

    expect(prismaMock.legalDocument.upsert).toHaveBeenCalledWith({
      where: { type: 'IMPRINT' },
      create: { type: 'IMPRINT', content: { en: 'Hello' } },
      update: { content: { en: 'Hello' } },
    });
  });

  it('translates an explicit null into Prisma.JsonNull so the column is cleared', async () => {
    await service.upsertDocument('PRIVACY_POLICY', null);

    expect(prismaMock.legalDocument.upsert).toHaveBeenCalledWith({
      where: { type: 'PRIVACY_POLICY' },
      create: { type: 'PRIVACY_POLICY', content: Prisma.JsonNull },
      update: { content: Prisma.JsonNull },
    });
  });
});
