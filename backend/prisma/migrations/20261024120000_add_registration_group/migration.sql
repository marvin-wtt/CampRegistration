-- AlterTable
ALTER TABLE `registrations` ADD COLUMN `group` VARCHAR(2) NULL;

-- CreateIndex
CREATE INDEX `registrations_event_id_group_index` ON `registrations`(`event_id`, `group`);

-- The stored countries are the groups: copied before the new code reads them.
-- `country` becomes the address's country as the form re-extracts it. Only
-- country codes were ever groups.
UPDATE `registrations` SET `group` = `country` WHERE CHAR_LENGTH(`country`) = 2;

-- A single-country event's registrations all belong to its only group, which
-- new ones store too — also those copied above from an address abroad. Any
-- other group would go uncounted by a per-country limit.
UPDATE `registrations` r
JOIN `events` e ON e.`id` = r.`event_id`
SET r.`group` = LOWER(JSON_UNQUOTE(JSON_EXTRACT(e.`countries`, '$[0]')))
WHERE JSON_LENGTH(e.`countries`) = 1;