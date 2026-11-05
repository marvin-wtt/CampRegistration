import config from '#config/index';

/**
 * Accounting records created before this instant are past their retention
 * period. The period runs from the end of the calendar year a record was made
 * in (HGB § 257(5), AO § 147(4)), so a record from 2026 is kept through 2036
 * with ten years' retention.
 */
export function retentionCutoff(now = new Date()): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear() - config.payment.recordRetentionYears, 0, 1),
  );
}
