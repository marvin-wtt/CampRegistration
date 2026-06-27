-- Split the overloaded `message_templates` table into three tables WITHOUT data loss:
--   * `message_templates`  -> reusable automated templates only (event NOT NULL)
--   * `messages`           -> ad-hoc sends (backfilled from event-less templates)
--   * `message_deliveries` -> per-recipient rendered emails (renamed from `messages`)
--
-- Prisma's auto-diff would ALTER the existing `messages` table into the ad-hoc
-- shape (destroying every delivery) and create an empty `message_deliveries`.
-- This migration instead RENAMEs the per-recipient table out of the way and
-- backfills the ad-hoc table, preserving all rows and ids. It is hand-authored
-- and must stay in sync with the target schema (verified via `prisma migrate diff`).

-- 1. Detach the foreign keys that block the restructuring.
ALTER TABLE `files` DROP FOREIGN KEY `files_message_id_fkey`;
ALTER TABLE `messages` DROP FOREIGN KEY `messages_message_template_id_fkey`;
ALTER TABLE `messages` DROP FOREIGN KEY `messages_registration_id_fkey`;

-- 2. Rename the per-recipient table out of the way (preserves every delivery row).
ALTER TABLE `messages` RENAME TO `message_deliveries`;

-- 3. Align indexes/columns of the renamed table with the target schema.
ALTER TABLE `message_deliveries` RENAME INDEX `message_id_unique` TO `message_delivery_id_unique`;
DROP INDEX `messages_message_template_id_fkey` ON `message_deliveries`;
DROP INDEX `messages_registration_id_fkey` ON `message_deliveries`;
ALTER TABLE `message_deliveries`
  ADD COLUMN `message_id` CHAR(26) NULL;

-- 4. Move existing delivery-attachment links into the new column and free `message_id`
--    on `files` so it can carry ad-hoc message attachments instead.
ALTER TABLE `files`
  ADD COLUMN `message_delivery_id` CHAR(26) NULL;
UPDATE `files`
SET `message_delivery_id` = `message_id`,
    `message_id`          = NULL
WHERE `message_id` IS NOT NULL;

-- 5. Create the new ad-hoc messages table.
CREATE TABLE `messages`
(
  `id`         CHAR(26)     NOT NULL,
  `camp_id`    CHAR(26)     NOT NULL,
  `priority`   VARCHAR(191) NOT NULL DEFAULT 'normal',
  `reply_to`   VARCHAR(191) NULL,
  `subject`    TEXT         NOT NULL,
  `body`       LONGTEXT     NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `message_id_unique`(`id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 6. Backfill ad-hoc messages from the event-less templates, preserving ids so
--    that delivery and attachment references can be repointed by id.
INSERT INTO `messages` (`id`, `camp_id`, `priority`, `reply_to`, `subject`, `body`, `created_at`, `updated_at`)
SELECT `id`,
       `camp_id`,
       `priority`,
       `reply_to`,
       `subject`,
       `body`,
       `created_at`,
       `updated_at`
FROM `message_templates`
WHERE `event` IS NULL;

-- 7. Repoint deliveries that originated from an ad-hoc send onto the new table.
UPDATE `message_deliveries`
SET `message_id`          = `message_template_id`,
    `message_template_id` = NULL
WHERE `message_template_id` IN (SELECT `id` FROM `messages`);

-- 8. Repoint ad-hoc attachments from the template column onto the new message column.
UPDATE `files`
SET `message_id`          = `message_template_id`,
    `message_template_id` = NULL
WHERE `message_template_id` IN (SELECT `id` FROM `messages`);

-- 9. Drop the migrated ad-hoc rows; every remaining template now has an event.
DELETE
FROM `message_templates`
WHERE `event` IS NULL;
ALTER TABLE `message_templates` MODIFY `event` VARCHAR (191) NOT NULL;

-- 10. Re-create the foreign keys with the names the target schema expects.
ALTER TABLE `files`
  ADD CONSTRAINT `files_message_id_fkey` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `files`
  ADD CONSTRAINT `files_message_delivery_id_fkey` FOREIGN KEY (`message_delivery_id`) REFERENCES `message_deliveries` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_camp_id_fkey` FOREIGN KEY (`camp_id`) REFERENCES `camps` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `message_deliveries`
  ADD CONSTRAINT `message_deliveries_message_template_id_fkey` FOREIGN KEY (`message_template_id`) REFERENCES `message_templates` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `message_deliveries`
  ADD CONSTRAINT `message_deliveries_message_id_fkey` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `message_deliveries`
  ADD CONSTRAINT `message_deliveries_registration_id_fkey` FOREIGN KEY (`registration_id`) REFERENCES `registrations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
