import { api } from '@/services/api';
import type {
  AdminEventBill,
  CursorPaginated,
  EventBillCreateData,
  EventBillQuery,
  EventBillUpdateData,
  EventBilling,
  OrganizationBilling,
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

  async function assignOrganizationPriceModel(
    organizationId: string,
    priceModelId: string,
  ): Promise<PriceModel> {
    const response = await api.put(
      `organizations/${organizationId}/price-model/`,
      { priceModelId },
    );

    return response?.data?.data;
  }

  async function assignEventPriceModel(
    eventId: string,
    priceModelId: string | null,
  ): Promise<{ id: string; priceModelId: string | null }> {
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

  return {
    fetchPriceModels,
    createPriceModel,
    updatePriceModel,
    setDefaultPriceModel,
    deletePriceModel,
    assignOrganizationPriceModel,
    assignEventPriceModel,
    fetchBillsPaginated,
    createBill,
    updateBill,
    fetchOrganizationBilling,
    fetchEventBilling,
  };
}
