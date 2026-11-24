import type { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { BaseController } from '#core/base/BaseController';
import { FinanceService } from '#app/finance/finance.service';
import validator from '#app/finance/finance.validation';
import { FileService } from '#app/file/file.service';
import { PaymentService } from '#app/payment/payment.service';
import { hasEventPermission } from '#app/event/event.guard';
import {
  buildFinanceSheets,
  exportFileName,
  receiptFileNames,
  receiptGroupFolder,
} from '#app/finance/finance.export';
import { toCsv, toXlsx } from '#utils/spreadsheet';
import { streamZip } from '#utils/zip';
import { isClientDisconnect } from '#utils/stream';
import logger from '#core/logger';
import * as contentDisposition from 'content-disposition';

@injectable()
export class FinanceController extends BaseController {
  constructor(
    @inject(FinanceService) private readonly financeService: FinanceService,
    @inject(FileService) private readonly fileService: FileService,
    @inject(PaymentService) private readonly paymentService: PaymentService,
  ) {
    super();
  }

  /** Everyone's balance, or just one's own with `?view=own`. */
  async balances(req: Request, res: Response) {
    const { query } = await req.validate(validator.balances);
    const event = req.modelOrFail('event');

    const userId = query.view === 'own' ? req.authUserId() : undefined;
    const balances = await this.financeService.getBalances(event.id, userId);

    res.json({ data: balances });
  }

  async summary(req: Request, res: Response) {
    await req.validate(validator.summary);
    const event = req.modelOrFail('event');

    const summary = await this.financeService.getSummary(
      event.id,
      event.currency,
    );

    res.json({ data: summary });
  }

  async parties(req: Request, res: Response) {
    await req.validate(validator.parties);
    const event = req.modelOrFail('event');

    res.json({
      data: await this.financeService.getParties(event.id, req.authUserId()),
    });
  }

  /** XLSX with a sheet each for expenses, payouts and categories; CSV of the expenses. */
  async exportData(req: Request, res: Response) {
    const { query } = await req.validate(validator.exportData);
    const event = req.modelOrFail('event');
    const locale = req.preferredLocale();

    const data = await this.financeService.getExportData(event.id);
    // Payer names are payment data: only for those who may see payments.
    const fees = (await hasEventPermission('event.payments.view')(req))
      ? await this.paymentService.getExportData(event.id)
      : undefined;
    const sheets = buildFinanceSheets({ ...data, fees }, locale);

    res.setHeader(
      'Content-Disposition',
      contentDisposition.create(exportFileName(locale, query.format)),
    );
    if (query.format === 'csv') {
      // The expenses sheet; payouts and totals only fit the workbook.
      res.type('text/csv; charset=utf-8').send(toCsv(sheets[0]));
      return;
    }
    res
      .type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      .send(await toXlsx(sheets));
  }

  /** Every receipt file, named by receipt number; `?folders=group` sorts them into group folders. */
  async receipts(req: Request, res: Response) {
    const { query } = await req.validate(validator.receipts);
    const event = req.modelOrFail('event');
    const locale = req.preferredLocale();

    const { expenses, categories } = await this.financeService.getExportData(
      event.id,
    );
    const folder =
      query.folders === 'group'
        ? receiptGroupFolder(categories, locale)
        : undefined;
    const entries = receiptFileNames(expenses, folder).map(
      ({ file, name }) => ({
        name,
        open: () => this.fileService.getFileStream(file),
      }),
    );

    res.type('application/zip');
    res.setHeader(
      'Content-Disposition',
      contentDisposition.create(exportFileName(locale, 'zip')),
    );
    try {
      await streamZip(res, entries);
    } catch (error) {
      if (isClientDisconnect(error)) {
        return;
      }
      // Headers are out: only a cut-off connection can signal the failure.
      logger.error('Failed to stream the receipts ZIP', error);
      res.destroy();
    }
  }

  async showSettings(req: Request, res: Response) {
    await req.validate(validator.showSettings);
    const event = req.modelOrFail('event');

    res.json({ data: await this.financeService.getSettings(event.id) });
  }

  async updateSettings(req: Request, res: Response) {
    const { body } = await req.validate(validator.updateSettings);
    const event = req.modelOrFail('event');

    res.json({
      data: await this.financeService.updateSettings(event.id, body),
    });
  }
}
