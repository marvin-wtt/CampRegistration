import { injectable } from 'inversify';
import httpStatus from 'http-status';
import { type PaymentAccount, Prisma } from '#generated/prisma/client.js';
import type { PaymentProviderName } from '@camp-registration/common/entities';
import { BaseService } from '#core/base/BaseService';
import { afterCommit } from '#core/database/transaction';
import { decryptSecret, encryptSecret, secretsAvailable } from '#core/secrets';
import logger from '#core/logger';
import ApiError from '#core/router/ApiError';
import { describeError } from '#utils/errors';
import { generateApiUrl } from '#utils/url';
import { ulid } from '#utils/ulid';
import {
  getPaymentProvider,
  isAvailableProvider,
} from './providers/payment.factory.js';
import {
  type ConnectResult,
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
 * it to a client. A replaced or disconnected account is retired, not deleted,
 * while payments were made through it: each payment is reconciled and
 * refunded through its own account (`resolveForPayment`).
 */
@injectable()
export class PaymentAccountService extends BaseService {
  /** The organization's current account. */
  async getByOrganization(organizationId: string) {
    return this.prisma.paymentAccount.findUnique({
      where: { activeOrganizationId: organizationId },
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

  /** The account a payment went through, retired or not; `null` for manual ones. */
  async resolveForPayment(payment: {
    paymentAccountId: string | null;
  }): Promise<ResolvedPaymentAccount | null> {
    const account = payment.paymentAccountId
      ? await this.getById(payment.paymentAccountId)
      : null;

    return account ? this.resolve(account) : null;
  }

  /**
   * Connects (or replaces) the organization's account. A new key for the
   * same provider account and mode is a rotation: the row stays, with its
   * payments and webhook URL. Any other account gets a new row, and the
   * replaced one is retired. The row id is fixed before talking to the
   * provider, so the webhook URL registered there belongs to it.
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
    const provider = getPaymentProvider(providerName);
    const key = apiKey.trim();

    // Tried as a rotation first; the result tells whether it is one.
    let id = existing?.provider === providerName ? existing.id : ulid();
    let result = await this.register(provider, key, id);
    const rotation = existing?.id === id && isSameAccount(existing, result);
    if (existing?.id === id && !rotation) {
      await this.teardown(provider, result.credentials, id);
      id = ulid();
      result = await this.register(provider, key, id);
    }

    const credentials = await encryptSecret(
      JSON.stringify(result.credentials),
      CREDENTIALS_PURPOSE,
    );
    const data = {
      provider: providerName,
      remoteAccountId: result.remoteAccountId,
      mode: result.mode,
      displayName: result.displayName,
      credentials,
    };

    try {
      return await this.transaction(async (tx) => {
        if (rotation) {
          return tx.paymentAccount.update({ where: { id }, data });
        }
        if (existing) {
          await this.retire(existing);
        }

        return tx.paymentAccount.create({
          data: {
            ...data,
            id,
            organizationId,
            activeOrganizationId: organizationId,
          },
        });
      });
    } catch (error) {
      // Nothing stored refers to what was just registered.
      await this.teardown(provider, result.credentials, id);
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ApiError(
          httpStatus.CONFLICT,
          'Another payment provider was connected at the same time',
          { code: 'PAYMENT_ACCOUNT_CONFLICT' },
        );
      }
      throw error;
    }
  }

  async disconnect(organizationId: string): Promise<void> {
    await this.transaction(async () => {
      const account = await this.getByOrganization(organizationId);
      if (account) {
        await this.retire(account);
      }
    });
  }

  /**
   * Removes retired accounts no payment refers to any more — their event's
   * ledger was released. Returns how many went.
   */
  async purgeRetired(): Promise<number> {
    const accounts = await this.prisma.paymentAccount.findMany({
      where: { activeOrganizationId: null, payments: { none: {} } },
    });
    for (const account of accounts) {
      await this.transaction(() => this.remove(account));
    }

    return accounts.length;
  }

  /** Inside an organization's deletion: it has no events, so no payments. */
  async removeForOrganization(organizationId: string): Promise<void> {
    const accounts = await this.db.paymentAccount.findMany({
      where: { organizationId },
    });
    for (const account of accounts) {
      await this.remove(account);
    }
  }

  private async register(
    provider: PaymentProvider,
    apiKey: string,
    id: string,
  ): Promise<ConnectResult> {
    try {
      return await provider.connect({
        apiKey,
        webhookUrl: paymentWebhookUrl({ id, provider: provider.name }),
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
  }

  /**
   * Takes an account out of use. Without payments it goes entirely; with
   * them it stays, keys and webhook included, so open checkouts still settle
   * and refunds still go through.
   */
  private async retire(account: PaymentAccount): Promise<void> {
    const payments = await this.db.payment.count({
      where: { paymentAccountId: account.id },
    });
    if (payments > 0) {
      await this.db.paymentAccount.update({
        where: { id: account.id },
        data: { activeOrganizationId: null, retiredAt: new Date() },
      });
      return;
    }

    await this.remove(account);
  }

  /** Deletes the row; its provider side is torn down once that committed. */
  private async remove(account: PaymentAccount): Promise<void> {
    await this.db.paymentAccount.delete({ where: { id: account.id } });
    await afterCommit(async () => {
      const { provider, credentials } = await this.resolve(account);
      await this.teardown(provider, credentials, account.id);
    });
  }

  /** Best effort: a provider-side leftover must not block disconnecting. */
  private async teardown(
    provider: PaymentProvider,
    credentials: ProviderCredentials,
    accountId: string,
  ): Promise<void> {
    try {
      await provider.disconnect?.(credentials);
    } catch (error) {
      logger.warn(
        `Could not tear down payment account ${accountId} at ${provider.name}: ${describeError(error)}`,
      );
    }
  }
}

/** Whether a new key reaches the account stored, in the same mode. */
function isSameAccount(
  account: PaymentAccount | null,
  result: ConnectResult,
): boolean {
  return (
    account !== null &&
    account.remoteAccountId !== null &&
    account.remoteAccountId === result.remoteAccountId &&
    account.mode === result.mode
  );
}
