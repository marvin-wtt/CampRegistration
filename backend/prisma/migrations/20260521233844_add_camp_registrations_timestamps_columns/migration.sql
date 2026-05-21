-- Add new columns before dropping active to allow data migration
ALTER TABLE `camps`
  ADD COLUMN `registration_closes_at` DATETIME(0) NULL,
    ADD COLUMN `registration_opens_at` DATETIME(0) NULL;

-- Migrate data: active=true → registrationOpensAt=NOW(), active=false → registrationClosesAt=NOW()
UPDATE `camps` SET `registrations_opens_at` = NOW() WHERE `active` = 1;
UPDATE `camps` SET `registrations_closes_at` = NOW() WHERE `active` = 0;

-- Drop active column
ALTER TABLE `camps` DROP COLUMN `active`;
