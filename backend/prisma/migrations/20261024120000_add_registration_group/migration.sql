-- AlterTable
ALTER TABLE `registrations` ADD COLUMN `group` VARCHAR(191) NULL;

-- The stored countries are the groups: copied before the new code reads them.
-- `country` becomes the address's country as the form re-extracts it.
UPDATE `registrations` SET `group` = `country`;
