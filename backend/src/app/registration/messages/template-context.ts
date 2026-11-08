import type { Event, Registration } from '#generated/prisma/client.js';

/** What a template context is built from: one recipient's mail. */
export interface TemplateContextSource {
  event: Event;
  registration: Registration;
  /** The template's locale, for formatting. */
  locale: string;
  /** Per-mail values the sender passed (`RegistrationTemplatePayload.extra`). */
  extra: Readonly<Record<string, unknown>>;
}

/** Builds the tokens under one top-level name; `null` hides them. */
export type TemplateContextProvider = (
  source: TemplateContextSource,
) => Promise<object | null> | object | null;

const providers = new Map<string, TemplateContextProvider>();

/**
 * Lets another module add tokens to every registration template under `name`
 * (e.g. `payment.*`), so the template base needn't know what they mean.
 * Registered at boot; a second registration of a name is a wiring mistake.
 */
export function registerTemplateContext(
  name: string,
  provider: TemplateContextProvider,
): void {
  if (providers.has(name)) {
    throw new Error(`Duplicate template context '${name}'`);
  }

  providers.set(name, provider);
}

export async function resolveTemplateContexts(
  source: TemplateContextSource,
): Promise<Record<string, object | null>> {
  const entries = await Promise.all(
    [...providers].map(
      async ([name, provider]) => [name, await provider(source)] as const,
    ),
  );

  return Object.fromEntries(entries);
}

/** Test seam: the registry is a boot-time singleton. */
export function clearTemplateContexts(): void {
  providers.clear();
}
