import config from '#config/index';
import type { PaymentProvider, ProviderName } from './payment.provider.js';
import { MollieProvider } from './mollie/mollie.provider.js';
import { StripeProvider } from './stripe/stripe.provider.js';
import { FakeProvider } from './fake/fake.provider.js';

// Record<ProviderName, ...>, not Record<string, ...>: adding a provider to
// the union without registering it here is a compile error.
const providers: Record<ProviderName, new () => PaymentProvider> = {
  mollie: MollieProvider,
  stripe: StripeProvider,
  fake: FakeProvider,
};

const REAL_PROVIDERS: ProviderName[] = ['mollie', 'stripe'];

/** Providers an organization may connect in this deployment. */
export function availableProviders(): ProviderName[] {
  return config.payment.fakeProvider
    ? [...REAL_PROVIDERS, 'fake']
    : REAL_PROVIDERS;
}

export function isAvailableProvider(name: string): name is ProviderName {
  return (availableProviders() as string[]).includes(name);
}

const instances = new Map<ProviderName, PaymentProvider>();

/** Providers are stateless, so one instance per name serves every account. */
export function getPaymentProvider(name: string): PaymentProvider {
  if (!isAvailableProvider(name)) {
    throw new Error(
      `Invalid payment provider '${name}'. Available: ${availableProviders().join(',')}`,
    );
  }

  let provider = instances.get(name);
  if (!provider) {
    provider = new providers[name]();
    instances.set(name, provider);
  }

  return provider;
}
