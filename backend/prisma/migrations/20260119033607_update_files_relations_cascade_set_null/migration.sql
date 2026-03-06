/*
  Warnings:

  - You are about to alter the column `camp_id` on the `files` table. The data in that column could be lost. The data in that column will be cast from `Char(36)` to `Char(26)`.
  - You are about to alter the column `registration_id` on the `files` table. The data in that column could be lost. The data in that column will be cast from `Char(36)` to `Char(26)`.
  - You are about to alter the column `message_id` on the `files` table. The data in that column could be lost. The data in that column will be cast from `Char(36)` to `Char(26)`.
  - You are about to alter the column `message_template_id` on the `files` table. The data in that column could be lost. The data in that column will be cast from `Char(36)` to `Char(26)`.
  - You are about to alter the column `camp_id` on the `message_templates` table. The data in that column could be lost. The data in that column will be cast from `Char(36)` to `Char(26)`.
  - You are about to alter the column `message_template_id` on the `messages` table. The data in that column could be lost. The data in that column will be cast from `Char(36)` to `Char(26)`.
  - You are about to alter the column `registration_id` on the `messages` table. The data in that column could be lost. The data in that column will be cast from `Char(36)` to `Char(26)`.
  - A unique constraint covering the columns `[queue]` on the table `job_rate_limits` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `files` DROP FOREIGN KEY `files_camp_id_fkey`;

-- DropForeignKey
ALTER TABLE `files` DROP FOREIGN KEY `files_message_id_fkey`;

-- DropForeignKey
ALTER TABLE `files` DROP FOREIGN KEY `files_message_template_id_fkey`;

-- DropForeignKey
ALTER TABLE `files` DROP FOREIGN KEY `files_registration_id_fkey`;

-- DropForeignKey
ALTER TABLE `message_templates` DROP FOREIGN KEY `message_templates_camp_id_fkey`;

-- DropForeignKey
ALTER TABLE `messages` DROP FOREIGN KEY `messages_message_template_id_fkey`;

-- DropForeignKey
ALTER TABLE `messages` DROP FOREIGN KEY `messages_registration_id_fkey`;

-- DropIndex
DROP INDEX `files_camp_id_fkey` ON `files`;

-- DropIndex
DROP INDEX `files_message_id_fkey` ON `files`;

-- DropIndex
DROP INDEX `files_message_template_id_fkey` ON `files`;

-- DropIndex
DROP INDEX `files_registration_id_fkey` ON `files`;

-- DropIndex
DROP INDEX `message_templates_camp_id_fkey` ON `message_templates`;

-- DropIndex
DROP INDEX `messages_message_template_id_fkey` ON `messages`;

-- DropIndex
DROP INDEX `messages_registration_id_fkey` ON `messages`;

-- AlterTable
ALTER TABLE `files` MODIFY `camp_id` CHAR(26) NULL,
    MODIFY `registration_id` CHAR(26) NULL,
    MODIFY `message_id` CHAR(26) NULL,
    MODIFY `message_template_id` CHAR(26) NULL;

-- AlterTable
ALTER TABLE `job_rate_limits` MODIFY `refilled_at` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `jobs` MODIFY `run_at` DATETIME(3) NULL,
    MODIFY `reserved_at` DATETIME(3) NULL,
    MODIFY `finished_at` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `message_templates` MODIFY `camp_id` CHAR(26) NOT NULL;

-- AlterTable
ALTER TABLE `messages` ADD COLUMN `bcc` TINYTEXT NULL,
    ADD COLUMN `cc` TINYTEXT NULL,
    ADD COLUMN `to` TINYTEXT NULL,
    MODIFY `message_template_id` CHAR(26) NULL,
    MODIFY `registration_id` CHAR(26) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `queue_unique` ON `job_rate_limits`(`queue`);

-- AddForeignKey
ALTER TABLE `files` ADD CONSTRAINT `files_camp_id_fkey` FOREIGN KEY (`camp_id`) REFERENCES `camps`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `files` ADD CONSTRAINT `files_registration_id_fkey` FOREIGN KEY (`registration_id`) REFERENCES `registrations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `files` ADD CONSTRAINT `files_message_id_fkey` FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `files` ADD CONSTRAINT `files_message_template_id_fkey` FOREIGN KEY (`message_template_id`) REFERENCES `message_templates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_message_template_id_fkey` FOREIGN KEY (`message_template_id`) REFERENCES `message_templates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_registration_id_fkey` FOREIGN KEY (`registration_id`) REFERENCES `registrations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message_templates` ADD CONSTRAINT `message_templates_camp_id_fkey` FOREIGN KEY (`camp_id`) REFERENCES `camps`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
