import httpStatus from 'http-status';
import { inject, injectable } from 'inversify';
import type { Invoice } from '#generated/prisma/client.js';
import { isUniqueViolation } from '#utils/db';
import { BaseService } from '#core/base/BaseService';
import ApiError from '#utils/ApiError';
import { FileService } from '#app/file/file.service';
import logger from '#core/logger';

/**
 * Invoice files are reachable only through the invoice routes: this field
 * matches no session, and no file guard is registered for invoices.
 */
const INVOICE_FILE_FIELD = 'invoice';

@injectable()
export class InvoiceService extends BaseService {
  constructor(@inject(FileService) private readonly fileService: FileService) {
    super();
  }

  async getInvoiceById(id: string) {
    return this.prisma.invoice.findUnique({
      where: { id },
      include: { files: true, eventBill: true },
    });
  }

  /**
   * Claims a PDF the session uploaded as a temporary file. Moving it to the
   * invoice field means no session can claim or open it as a temporary file
   * again.
   */
  async createUploadedInvoice(
    eventBillId: string,
    fileId: string,
    sessionId: string,
  ) {
    return this.transaction(async (tx) => {
      const invoice = await tx.invoice
        .create({ data: { eventBillId, source: 'UPLOADED' } })
        .catch((error: unknown) => {
          // One invoice per bill: a wrong one is deleted and uploaded again.
          if (isUniqueViolation(error)) {
            throw new ApiError(
              httpStatus.CONFLICT,
              'The bill already has an invoice',
            );
          }
          throw error;
        });

      const { count } = await tx.file.updateMany({
        where: {
          ...this.fileService.getUnreferencedModelArgs(),
          id: fileId,
          field: sessionId,
          type: 'application/pdf',
        },
        data: { invoiceId: invoice.id, field: INVOICE_FILE_FIELD },
      });
      if (count === 0) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'The file must be a PDF uploaded in this session',
        );
      }

      return tx.invoice.findUniqueOrThrow({
        where: { id: invoice.id },
        include: { files: true },
      });
    });
  }

  /** Only uploaded invoices: an issued one is cancelled, never deleted. */
  async deleteInvoice(invoice: Invoice & { files: { id: string }[] }) {
    if (invoice.source !== 'UPLOADED') {
      throw new ApiError(
        httpStatus.CONFLICT,
        'An issued invoice cannot be deleted',
      );
    }
    const cancellations = await this.prisma.invoice.count({
      where: { cancelsInvoiceId: invoice.id },
    });
    if (cancellations > 0) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'A cancelled invoice cannot be deleted',
      );
    }

    // The row first: its files are detached by the FK, and any left behind
    // here is removed by the unassigned-file cleanup job.
    await this.prisma.invoice.delete({ where: { id: invoice.id } });
    for (const file of invoice.files) {
      await this.fileService.deleteFile(file.id).catch((error: unknown) => {
        logger.error(`Failed to delete invoice file ${file.id}:`, error);
      });
    }
  }
}
