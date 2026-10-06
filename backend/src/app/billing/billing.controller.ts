import httpStatus from 'http-status';
import type { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { BaseController } from '#core/base/BaseController';
import ApiError from '#utils/ApiError';
import validator from './billing.validation.js';
import { billsToCsv } from './billing.export.js';
import { BILLING_TIME_ZONE } from './billing.utils.js';
import { monthOf } from '#utils/date';
import type { BillingSummary } from '@camp-registration/common/entities';
import { BillingService } from './billing.service.js';
import { BillingQueryService } from './billing-query.service.js';
import { PriceModelService } from '#app/priceModel/price-model.service';
import { PriceModelOfferService } from '#app/priceModel/price-model-offer.service';
import { FileService } from '#app/file/file.service';
import { sendFile } from '#app/file/file.response';
import { OrganizationService } from '#app/organization/organization.service';
import { OrganizationMemberService } from '#app/organizationMember/organization-member.service';
import type { EventBill, File } from '#generated/prisma/client.js';
import { money } from '#utils/money';
import { InvoiceService } from './invoice.service.js';
import { RealtimeService } from '#core/realtime/RealtimeService';
import { InvoiceIssuedMessage } from './billing.messages.js';
import {
  AdminEventBillResource,
  EventBillingResource,
  InvoiceResource,
  OrganizationBillingResource,
} from './billing.resource.js';

@injectable()
export class BillingController extends BaseController {
  constructor(
    @inject(BillingService) private readonly billingService: BillingService,
    @inject(BillingQueryService)
    private readonly billingQueryService: BillingQueryService,
    @inject(PriceModelService)
    private readonly priceModelService: PriceModelService,
    @inject(InvoiceService) private readonly invoiceService: InvoiceService,
    @inject(FileService) private readonly fileService: FileService,
    @inject(OrganizationService)
    private readonly organizationService: OrganizationService,
    @inject(OrganizationMemberService)
    private readonly organizationMemberService: OrganizationMemberService,
    @inject(RealtimeService) private readonly realtimeService: RealtimeService,
    @inject(PriceModelOfferService)
    private readonly priceModelOfferService: PriceModelOfferService,
  ) {
    super();
  }

  async index(req: Request, res: Response) {
    const { query } = await req.validate(validator.index);

    const { bills, nextCursor, limit, total } =
      await this.billingQueryService.queryBills(
        {
          status: query?.status,
          organizationId: query?.organizationId,
          search: query?.search,
          month: query?.month,
        },
        { cursor: query?.cursor, limit: query?.limit },
      );

    res.resource(
      AdminEventBillResource.collection(bills).withCursor(
        nextCursor,
        limit,
        total,
      ),
    );
  }

  async summary(req: Request, res: Response) {
    const { query } = await req.validate(validator.summary);
    const year =
      query?.year ?? Number(monthOf(new Date(), BILLING_TIME_ZONE).slice(0, 4));
    const summary: BillingSummary =
      await this.billingQueryService.getYearSummary(year);

    res.json({ data: summary });
  }

  /** CSV for the platform's bookkeeping, one line per finalized bill. */
  async export(req: Request, res: Response) {
    const { query } = await req.validate(validator.exportBills);
    const bills = await this.billingQueryService.getBillsForExport(
      query.from,
      query.to,
    );
    const csv = billsToCsv(
      bills,
      BILLING_TIME_ZONE,
      query.locale ?? req.preferredLocale(),
    );

    res
      .type('text/csv; charset=utf-8')
      .attachment(`bills-${query.from}_${query.to}.csv`)
      .send(csv);
  }

  /** Bills an ended event by hand, or again after its bill was voided. */
  async store(req: Request, res: Response) {
    const { body } = await req.validate(validator.store);
    const bill = await this.billingService.createManualBill(body);
    this.emitBillChange(bill, 'created');

    res.status(httpStatus.CREATED).resource(new AdminEventBillResource(bill));
  }

  async update(req: Request, res: Response) {
    const { body } = await req.validate(validator.update);
    const bill = req.modelOrFail('eventBill');

    const updatedBill = await this.billingService.updateBill(bill, body);

    this.emitBillChange(updatedBill, 'updated');

    res.resource(new AdminEventBillResource(updatedBill));
  }

  /** What the organization pays and what it has been billed. */
  async organization(req: Request, res: Response) {
    await req.validate(validator.organization);
    const organization = req.modelOrFail('organization');

    const [priceModel, offer, bills] = await Promise.all([
      this.priceModelService.getPriceModelById(organization.priceModelId),
      this.priceModelOfferService.getOpenOffer(organization.id),
      this.billingQueryService.getBillsForOrganization(organization.id),
    ]);
    if (!priceModel) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Price model not found');
    }

    res.resource(new OrganizationBillingResource({ priceModel, offer, bills }));
  }

  /** The model the event is priced with. */
  async event(req: Request, res: Response) {
    await req.validate(validator.event);
    const event = req.modelOrFail('event');
    const [billing, bill, acceptedRegistrationCount] = await Promise.all([
      this.priceModelService.getForEvent(event.id),
      this.billingQueryService.getLiveBillForEvent(
        event.id,
        event.organizationId,
      ),
      this.billingQueryService.countAccepted(event.id),
    ]);

    res.resource(
      new EventBillingResource({ ...billing, bill, acceptedRegistrationCount }),
    );
  }

  /** Attaches an invoice PDF to a finalized bill. */
  async storeInvoice(req: Request, res: Response) {
    const { body } = await req.validate(validator.storeInvoice);
    const bill = req.modelOrFail('eventBill');
    if (bill.status === 'DRAFT' || bill.status === 'VOID') {
      throw new ApiError(
        httpStatus.CONFLICT,
        'Only an open or paid bill can have an invoice',
      );
    }

    const invoice = await this.invoiceService.createUploadedInvoice(
      bill.id,
      body.fileId,
      req.sessionId,
    );

    // Nothing to pay, nothing to announce: a paid bill's invoice is a receipt.
    if (bill.status === 'OPEN' && bill.grossAmount?.gt(0)) {
      await this.notifyInvoiceIssued(bill);
    }

    this.emitBillChange(bill, 'updated');

    res.status(httpStatus.CREATED).resource(new InvoiceResource(invoice));
  }

  async destroyInvoice(req: Request, res: Response) {
    await req.validate(validator.destroyInvoice);
    const bill = req.modelOrFail('eventBill');
    const invoice = this.invoiceOf(req, ({ id }) => id === bill.id);

    await this.invoiceService.deleteInvoice(invoice);
    this.emitBillChange(bill, 'updated');

    res.status(httpStatus.NO_CONTENT).send();
  }

  /** The administrators' download, which works after the organization is gone. */
  async showInvoice(req: Request, res: Response) {
    await req.validate(validator.showInvoice);
    const bill = req.modelOrFail('eventBill');
    const invoice = this.invoiceOf(req, ({ id }) => id === bill.id);

    await this.sendInvoice(res, invoice);
  }

  async organizationInvoice(req: Request, res: Response) {
    await req.validate(validator.organizationInvoice);
    const organization = req.modelOrFail('organization');
    const invoice = this.invoiceOf(
      req,
      (bill) => bill.organizationId === organization.id,
    );

    await this.sendInvoice(res, invoice);
  }

  async eventInvoice(req: Request, res: Response) {
    await req.validate(validator.eventInvoice);
    const event = req.modelOrFail('event');
    const invoice = this.invoiceOf(
      req,
      (bill) =>
        bill.eventId === event.id &&
        bill.organizationId === event.organizationId,
    );

    await this.sendInvoice(res, invoice);
  }

  /**
   * Refreshes the event's billing for its managers. A bill whose event was
   * deleted has no stream to notify.
   */
  private emitBillChange(bill: EventBill, operation: 'created' | 'updated') {
    if (bill.eventId) {
      void this.realtimeService.emit(
        bill.eventId,
        'billing',
        bill.id,
        operation,
      );
    }
  }

  /** The bound invoice, if it belongs to the subject the route is scoped to. */
  private invoiceOf(req: Request, belongs: (bill: EventBill) => boolean) {
    const invoice = req.modelOrFail('invoice');
    if (!belongs(invoice.eventBill)) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Invoice not found');
    }

    return invoice;
  }

  private async sendInvoice(res: Response, invoice: { files: File[] }) {
    const file = invoice.files.at(0);
    if (!file) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Invoice file not found');
    }

    await sendFile(res, this.fileService, file, true);
  }

  private async notifyInvoiceIssued(bill: EventBill) {
    const { grossAmount, currency } = bill;
    if (!grossAmount || !currency) {
      return;
    }
    const { organizationId } = bill;
    if (!organizationId) {
      return;
    }
    const [organization, recipients] = await Promise.all([
      this.organizationService.getOrganizationById(organizationId),
      this.organizationMemberService.getAdministratorRecipients(organizationId),
    ]);
    if (!organization) {
      return;
    }

    await InvoiceIssuedMessage.enqueueBulk(
      recipients.map((recipient) => ({
        organization: { id: organization.id, name: organization.name },
        bill: {
          eventName: bill.eventName,
          grossAmount: money(grossAmount),
          currency,
        },
        recipient,
      })),
    );
  }
}
