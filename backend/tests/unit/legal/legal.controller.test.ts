import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { mock } from 'vitest-mock-extended';
import type { LegalDocument } from '#generated/prisma/client.js';
import { LegalService } from '#app/legal/legal.service';
import { LegalController } from '#app/legal/legal.controller';
import { LegalDocumentResource } from '#app/legal/legal.resource';

const legalService = mock<LegalService>();

const controller = new LegalController(legalService);

const buildDocument = (
  overrides: Partial<LegalDocument> = {},
): LegalDocument => ({
  id: 'legal-document-1',
  type: 'IMPRINT',
  content: 'Some imprint content',
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

interface FakeRequestOptions {
  validateResult?: unknown;
}

const fakeRequest = ({
  validateResult = {},
}: FakeRequestOptions = {}): Request =>
  ({
    validate: vi.fn().mockResolvedValue(validateResult),
  }) as unknown as Request;

const fakeResponse = (): Response & {
  resource: ReturnType<typeof vi.fn>;
} => {
  const res = {} as Response & { resource: ReturnType<typeof vi.fn> };
  res.resource = vi.fn().mockReturnValue(res);
  return res;
};

const resourceData = (res: ReturnType<typeof fakeResponse>): unknown =>
  (res.resource.mock.calls[0]?.[0] as LegalDocumentResource | undefined)?.[
    'data' as never
  ];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('LegalController.show', () => {
  it('returns the stored document as a resource', async () => {
    const document = buildDocument();
    legalService.getDocument.mockResolvedValue(document);
    const req = fakeRequest({
      validateResult: { params: { type: 'IMPRINT' } },
    });
    const res = fakeResponse();

    await controller.show(req, res);

    expect(legalService.getDocument).toHaveBeenCalledWith('IMPRINT');
    expect(resourceData(res)).toBe(document);
  });
});

describe('LegalController.index', () => {
  it('returns every document as a resource collection', async () => {
    const imprint = buildDocument({ type: 'IMPRINT' });
    const privacyPolicy = buildDocument({
      id: 'legal-document-2',
      type: 'PRIVACY_POLICY',
      content: null,
    });
    legalService.getAllDocuments.mockResolvedValue([imprint, privacyPolicy]);
    const req = fakeRequest();
    const res = fakeResponse();

    await controller.index(req, res);

    const collection = res.resource.mock.calls[0]?.[0] as {
      transform: () => unknown;
    };

    expect(collection.transform()).toEqual([
      {
        type: 'IMPRINT',
        content: imprint.content,
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        type: 'PRIVACY_POLICY',
        content: null,
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ]);
  });
});

describe('LegalController.update', () => {
  it('upserts the document with the validated type and content', async () => {
    const document = buildDocument({ content: { en: 'Updated' } });
    legalService.upsertDocument.mockResolvedValue(document);
    const req = fakeRequest({
      validateResult: {
        params: { type: 'IMPRINT' },
        body: { content: { en: 'Updated' } },
      },
    });
    const res = fakeResponse();

    await controller.update(req, res);

    expect(legalService.upsertDocument).toHaveBeenCalledWith('IMPRINT', {
      en: 'Updated',
    });
    expect(resourceData(res)).toBe(document);
  });
});
