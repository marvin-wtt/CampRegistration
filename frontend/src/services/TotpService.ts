import type {
  TotpData,
  TotpSetupData,
  TotpDisableData,
  TotpEnableData,
} from '@camp-registration/common/entities';
import { api } from 'boot/axios';

export function useTotpService() {
  async function generateTotp(data: TotpSetupData): Promise<TotpData> {
    const response = await api.post('totp/setup', data);

    return response?.data?.data;
  }

  async function enableTotp(data: TotpEnableData): Promise<void> {
    const response = await api.post('totp/enable', data);

    return response?.data;
  }

  async function disableTotp(data: TotpDisableData): Promise<void> {
    const response = await api.post('totp/disable', data);

    return response.data?.data;
  }

  return {
    generateTotp,
    enableTotp,
    disableTotp,
  };
}
