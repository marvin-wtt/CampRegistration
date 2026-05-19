-- AlterTable
ALTER TABLE `files` ADD COLUMN `upload_status` ENUM('PENDING', 'READY') NOT NULL DEFAULT 'READY';
