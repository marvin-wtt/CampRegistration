-- AlterTable
ALTER TABLE `camps`
  ADD COLUMN `retention_reminder_sent_at` DATETIME(3) NULL;

-- Every camp that is already over at the moment the column appears counts as
-- reminded. Their deadlines were never watched, so leaving them NULL would let
-- the first run mail out a backlog of reminders about camps whose retention
-- lapsed long ago. Camps that are still running keep NULL and are reminded
-- normally once they end.
UPDATE `camps` SET `retention_reminder_sent_at` = NOW() WHERE `end_at` <= NOW();
