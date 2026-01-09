import { type ZodObject, type z, ZodError } from 'zod';
import { type ZodReadonly } from 'zod';
import process from 'node:process';

export function validateEnv<R extends ZodObject, T extends ZodReadonly<R>>(
  schema: T,
): z.infer<T> {
  try {
    return schema.parse(process.env);
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
