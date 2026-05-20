-- Add new columns before dropping active to allow data migration
ALTER TABLE `camps`
    ADD COLUMN `registration_close_at` DATETIME(0) NULL,
    ADD COLUMN `registration_open_at` DATETIME(0) NULL;

-- Migrate data: active=true → registrationOpenAt=NOW(), active=false → registrationCloseAt=NOW()
UPDATE `camps` SET `registration_open_at` = NOW() WHERE `active` = 1;
UPDATE `camps` SET `registration_close_at` = NOW() WHERE `active` = 0;

-- Drop active column
ALTER TABLE `camps` DROP COLUMN `active`;
