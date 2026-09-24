import type {
  PaymentAccount,
  PaymentAccountConnectData,
  PaymentProviderOptions,
} from '@camp-registration/common/entities';
import { api } from '@/services/api';

export function usePaymentAccountService() {
  async function fetchPaymentAccount(
    organizationId: string,
  ): Promise<PaymentAccount | null> {
    const response = await api.get(
      `organizations/${organizationId}/payment-account/`,
    );

    return response?.data?.data ?? null;
  }

  async function fetchPaymentProviders(
    organizationId: string,
  ): Promise<PaymentProviderOptions> {
    const response = await api.get(
      `organizations/${organizationId}/payment-account/providers/`,
    );

    return response?.data?.data;
  }

  async function connectPaymentAccount(
    organizationId: string,
    data: PaymentAccountConnectData,
  ): Promise<PaymentAccount> {
    const response = await api.put(
      `organizations/${organizationId}/payment-account/`,
      data,
    );

    return response?.data?.data;
  }

  async function disconnectPaymentAccount(
    organizationId: string,
  ): Promise<void> {
    await api.delete(`organizations/${organizationId}/payment-account/`);
  }

  return {
    fetchPaymentAccount,
    fetchPaymentProviders,
    connectPaymentAccount,
    disconnectPaymentAccount,
  };
}
