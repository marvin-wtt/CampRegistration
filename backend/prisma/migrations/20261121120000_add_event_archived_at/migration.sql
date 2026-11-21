-- AlterTable
ALTER TABLE `events`
  ADD COLUMN `archived_at` DATETIME(3) NULL;

-- Backfill: archive what the old automatic rule showed as "past" — ended
-- more than six weeks ago with registration not open.
UPDATE `events`
SET `archived_at` = NOW()
WHERE `end_at` < NOW() - INTERVAL 6 WEEK
  AND (
    (`registration_opens_at` IS NULL AND `registration_closes_at` IS NULL)
    OR `registration_opens_at` > NOW()
    OR `registration_closes_at` < NOW()
  );
