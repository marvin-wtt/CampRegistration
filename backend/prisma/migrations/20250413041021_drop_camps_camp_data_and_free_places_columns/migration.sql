/*
  Warnings:

  - You are about to drop the column `free_places` on the `camps` table. All the data in the column will be lost.
  - You are about to drop the column `version` on the `camps` table. All the data in the column will be lost.
  - You are about to drop the column `camp_data` on the `registrations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `camps` DROP COLUMN `free_places`,
    DROP COLUMN `version`;

-- AlterTable
ALTER TABLE `registrations` DROP COLUMN `camp_data`,
    ADD COLUMN `city` VARCHAR(191) NULL,
    ADD COLUMN `country` VARCHAR(191) NULL,
    ADD COLUMN `date_of_birth` DATE NULL,
    ADD COLUMN `emails` JSON NULL,
    ADD COLUMN `first_name` VARCHAR(191) NULL,
    ADD COLUMN `gender` VARCHAR(191) NULL,
    ADD COLUMN `last_name` VARCHAR(191) NULL,
    ADD COLUMN `role` VARCHAR(191) NULL,
    ADD COLUMN `street` VARCHAR(191) NULL,
    ADD COLUMN `zip_code` VARCHAR(191) NULL;
