import type {
  TotpData,
  TotpSetupData,
  TotpDisableData,
  TotpEnableData,
} from '@camp-registration/common/entities';
import { useApi } from 'src/composables/api';

export function useTotpService() {
  const api = useApi();

  async function setupTotp(data: TotpSetupData): Promise<TotpData> {
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
    setupTotp,
    enableTotp,
    disableTotp,
  };
}
