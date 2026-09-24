import { injectable } from 'inversify';
import httpStatus from 'http-status';
import type { PaymentAccount } from '#generated/prisma/client.js';
import type { PaymentProviderName } from '@camp-registration/common/entities';
import { BaseService } from '#core/base/BaseService';
import { decryptSecret, encryptSecret, secretsAvailable } from '#core/secrets';
import logger from '#core/logger';
import ApiError from '#utils/ApiError';
import { describeError } from '#utils/errors';
import { generateApiUrl } from '#utils/url';
import { ulid } from '#utils/ulid';
import {
  getPaymentProvider,
  isAvailableProvider,
} from './providers/payment.factory.js';
import {
  InvalidCredentialsError,
  type PaymentProvider,
  type ProviderCredentials,
} from './providers/payment.provider.js';

const CREDENTIALS_PURPOSE = 'payment-credentials';

export interface ResolvedPaymentAccount {
  account: PaymentAccount;
  provider: PaymentProvider;
  credentials: ProviderCredentials;
}

/** The URL a provider posts payment updates for this account to. */
export function paymentWebhookUrl(account: {
  id: string;
  provider: string;
}): string {
  return generateApiUrl(['webhooks', 'payments', account.provider, account.id]);
}

/**
 * An organization's connection to a payment provider. The API key is only
 * ever held encrypted at rest and decrypted per use; nothing in here returns
 * it to a client.
 */
@injectable()
export class PaymentAccountService extends BaseService {
  async getByOrganization(organizationId: string) {
    return this.prisma.paymentAccount.findUnique({
      where: { organizationId },
    });
  }

  async getById(id: string) {
    return this.prisma.paymentAccount.findUnique({ where: { id } });
  }

  /** The account with its provider and decrypted credentials, ready to call. */
  async resolve(account: PaymentAccount): Promise<ResolvedPaymentAccount> {
    const credentials = JSON.parse(
      await decryptSecret(account.credentials, CREDENTIALS_PURPOSE),
    ) as ProviderCredentials;

    return {
      account,
      provider: getPaymentProvider(account.provider),
      credentials,
    };
  }

  async resolveForOrganization(
    organizationId: string,
  ): Promise<ResolvedPaymentAccount | null> {
    const account = await this.getByOrganization(organizationId);

    return account ? this.resolve(account) : null;
  }

  /**
   * Connects (or replaces) the organization's account. The row id is fixed
   * before talking to the provider so the webhook URL registered there
   * stays valid for this account.
   */
  async connect(
    organizationId: string,
    providerName: PaymentProviderName,
    apiKey: string,
  ): Promise<PaymentAccount> {
    if (!secretsAvailable()) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'Payment credentials cannot be stored: encryption keys are not configured.',
        { code: 'PAYMENT_SECRETS_UNAVAILABLE' },
      );
    }
    if (!isAvailableProvider(providerName)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Unknown payment provider');
    }

    const existing = await this.getByOrganization(organizationId);
    const id = existing?.id ?? ulid();
    const provider = getPaymentProvider(providerName);

    let result;
    try {
      result = await provider.connect({
        apiKey: apiKey.trim(),
        webhookUrl: paymentWebhookUrl({ id, provider: providerName }),
      });
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, error.message, {
          code: 'PAYMENT_INVALID_CREDENTIALS',
        });
      }
      throw new ApiError(
        httpStatus.BAD_GATEWAY,
        'The payment provider could not be reached',
        { cause: error, fault: false },
      );
    }

    if (existing) {
      await this.teardown(existing);
    }

    const data = {
      provider: providerName,
      mode: result.mode,
      displayName: result.displayName,
      credentials: await encryptSecret(
        JSON.stringify(result.credentials),
        CREDENTIALS_PURPOSE,
      ),
    };

    return this.prisma.paymentAccount.upsert({
      where: { organizationId },
      create: { id, organizationId, ...data },
      update: data,
    });
  }

  async disconnect(organizationId: string): Promise<void> {
    const account = await this.getByOrganization(organizationId);
    if (!account) {
      return;
    }

    await this.teardown(account);
    await this.prisma.paymentAccount.delete({ where: { id: account.id } });
  }

  /** Best effort: a provider-side leftover must not block disconnecting. */
  private async teardown(account: PaymentAccount): Promise<void> {
    try {
      const { provider, credentials } = await this.resolve(account);
      await provider.disconnect?.(credentials);
    } catch (error) {
      logger.warn(
        `Could not tear down payment account ${account.id} at ${account.provider}: ${describeError(error)}`,
      );
    }
  }
}
