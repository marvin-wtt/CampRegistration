import { v4 as uuidv4 } from 'uuid';

export function createUuid(): string {
  return typeof globalThis.crypto.randomUUID === 'function'
    ? globalThis.crypto.randomUUID()
    : uuidv4();
}
