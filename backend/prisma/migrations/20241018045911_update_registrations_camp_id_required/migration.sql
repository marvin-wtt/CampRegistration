/*
  Warnings:

  - Made the column `camp_id` on table `registrations` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `registrations` DROP FOREIGN KEY `registrations_camp_id_foreign`;

-- AlterTable
ALTER TABLE `registrations` MODIFY `camp_id` CHAR(26) NOT NULL;

-- AddForeignKey
ALTER TABLE `registrations` ADD CONSTRAINT `registrations_camp_id_foreign` FOREIGN KEY (`camp_id`) REFERENCES `camps`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
