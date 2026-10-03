import { api } from '@/services/api';
import type {
  AdminEventBill,
  BillingSummary,
  BillingSummaryQuery,
  CursorPaginated,
  EventBillExportQuery,
  EventBillCreateData,
  EventBillQuery,
  EventBillUpdateData,
  EventBilling,
  Invoice,
  InvoiceCreateData,
  OrganizationBilling,
  PendingPriceModelOffer,
  PriceModelAssignmentData,
  PriceModelChangeResult,
  PriceModelOffer,
  PriceModelOfferCreateData,
  PriceModel,
  PriceModelCreateData,
  PriceModelUpdateData,
} from '@camp-registration/common/entities';

export function useBillingService() {
  async function fetchPriceModels(): Promise<PriceModel[]> {
    const response = await api.get('price-models/');

    return response?.data?.data;
  }

  async function createPriceModel(
    data: PriceModelCreateData,
  ): Promise<PriceModel> {
    const response = await api.post('price-models/', data);

    return response?.data?.data;
  }

  async function updatePriceModel(
    id: string,
    data: PriceModelUpdateData,
  ): Promise<PriceModel> {
    const response = await api.patch(`price-models/${id}/`, data);

    return response?.data?.data;
  }

  async function setDefaultPriceModel(id: string): Promise<PriceModel> {
    const response = await api.put(`price-models/${id}/default/`);

    return response?.data?.data;
  }

  async function deletePriceModel(id: string): Promise<void> {
    await api.delete(`price-models/${id}/`);
  }

  /** Resolves to how many upcoming events were moved along. */
  async function assignOrganizationPriceModel(
    organizationId: string,
    data: PriceModelAssignmentData,
  ): Promise<void> {
    await api.put(`organizations/${organizationId}/price-model/`, data);
  }

  /** When its pending price change takes effect, without the prices. */
  async function fetchPendingPriceModelOffer(
    organizationId: string,
  ): Promise<PendingPriceModelOffer | null> {
    const response = await api.get(
      `organizations/${organizationId}/price-model-offers/pending`,
    );

    return response?.data?.data ?? null;
  }

  /** Applies a cheaper model at once; offers anything else for acceptance. */
  async function offerOrganizationPriceModel(
    organizationId: string,
    data: PriceModelOfferCreateData,
  ): Promise<PriceModelChangeResult> {
    const response = await api.post(
      `organizations/${organizationId}/price-model-offers/`,
      data,
    );

    return response?.data?.data;
  }

  async function withdrawPriceModelOffer(
    organizationId: string,
    offerId: string,
  ): Promise<void> {
    await api.delete(
      `organizations/${organizationId}/price-model-offers/${offerId}/`,
    );
  }

  async function acceptPriceModelOffer(
    organizationId: string,
    offerId: string,
  ): Promise<PriceModelOffer> {
    const response = await api.post(
      `organizations/${organizationId}/price-model-offers/${offerId}/accept`,
    );

    return response?.data?.data;
  }

  /** The model a new organization starts on, which its founder agrees to. */
  async function fetchDefaultPriceModel(): Promise<PriceModel> {
    const response = await api.get('price-models/default');

    return response?.data?.data;
  }

  async function assignEventPriceModel(
    eventId: string,
    priceModelId: string,
  ): Promise<{ id: string; priceModelId: string }> {
    const response = await api.put(`events/${eventId}/price-model/`, {
      priceModelId,
    });

    return response?.data?.data;
  }

  async function fetchBillsPaginated(
    params?: EventBillQuery,
  ): Promise<CursorPaginated<AdminEventBill>> {
    const response = await api.get('bills/', { params });

    return {
      data: response?.data?.data,
      meta: response?.data?.meta,
    };
  }

  async function createBill(
    data: EventBillCreateData,
  ): Promise<AdminEventBill> {
    const response = await api.post('bills/', data);

    return response?.data?.data;
  }

  async function updateBill(
    id: string,
    data: EventBillUpdateData,
  ): Promise<AdminEventBill> {
    const response = await api.patch(`bills/${id}/`, data);

    return response?.data?.data;
  }

  async function fetchOrganizationBilling(
    organizationId: string,
  ): Promise<OrganizationBilling> {
    const response = await api.get(`organizations/${organizationId}/billing/`);

    return response?.data?.data;
  }

  async function fetchEventBilling(eventId: string): Promise<EventBilling> {
    const response = await api.get(`events/${eventId}/billing/`);

    return response?.data?.data;
  }

  async function createInvoice(
    billId: string,
    data: InvoiceCreateData,
  ): Promise<Invoice> {
    const response = await api.post(`bills/${billId}/invoices/`, data);

    return response?.data?.data;
  }

  async function deleteInvoice(billId: string, invoiceId: string) {
    await api.delete(`bills/${billId}/invoices/${invoiceId}/`);
  }

  async function fetchBillingSummary(
    params?: BillingSummaryQuery,
  ): Promise<BillingSummary> {
    const response = await api.get('bills/summary', { params });

    return response?.data?.data;
  }

  /** A download link; the session cookie authenticates it like any request. */
  function billsExportUrl(query: EventBillExportQuery): string {
    const params = new URLSearchParams({ from: query.from, to: query.to });
    if (query.locale) {
      params.set('locale', query.locale);
    }

    return `${window.origin}/api/v1/bills/export?${params.toString()}`;
  }

  return {
    fetchPriceModels,
    createPriceModel,
    updatePriceModel,
    setDefaultPriceModel,
    deletePriceModel,
    assignOrganizationPriceModel,
    assignEventPriceModel,
    offerOrganizationPriceModel,
    fetchPendingPriceModelOffer,
    withdrawPriceModelOffer,
    acceptPriceModelOffer,
    fetchDefaultPriceModel,
    fetchBillsPaginated,
    createBill,
    updateBill,
    fetchOrganizationBilling,
    fetchEventBilling,
    createInvoice,
    deleteInvoice,
    fetchBillingSummary,
    billsExportUrl,
  };
}
