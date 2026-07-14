import { type z, ZodError } from 'zod';
import process from 'node:process';

export function validateEnv<T extends z.ZodType>(schema: T): z.output<T> {
  try {
    // Parse a shallow copy rather than `process.env` directly: `process.env`
    // is an exotic host object that cannot be frozen, so a schema ending in
    // `.readonly()` would throw when the parsed value still aliases it.
    return schema.parse({ ...process.env });
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('❌ Invalid environment variables:');
      error.issues.forEach((issue, index) => {
        console.error(
          ` ${(index + 1).toString()}. ${issue.path.join(' > ')}:  ${issue.message}`,
        );
      });

      process.exit(1);
    }
    throw error;
  }
}
