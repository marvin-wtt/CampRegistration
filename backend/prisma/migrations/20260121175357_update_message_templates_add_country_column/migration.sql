/*
  Warnings:

  - A unique constraint covering the columns `[country,event,camp_id]` on the table `message_templates` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `message_templates` ADD COLUMN `country` VARCHAR(191) NULL,
    MODIFY `subject` TEXT NOT NULL,
    MODIFY `body` LONGTEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `message_templates_country_event_camp_id_unique` ON `message_templates`(`country`, `event`, `camp_id`);
