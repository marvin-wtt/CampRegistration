/*
 A default is created first to ensure migration. The default is dropped right after
*/

-- AlterTable
ALTER TABLE `camp_managers` ADD COLUMN `role` VARCHAR(50) NOT NULL DEFAULT 'DIRECTOR';

-- AlterTable
ALTER TABLE `camp_managers` ALTER COLUMN `role` DROP DEFAULT;
