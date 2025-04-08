-- AlterTable
ALTER TABLE `files` ADD COLUMN `message_template_id` CHAR(36) NULL;

-- AddForeignKey
ALTER TABLE `files` ADD CONSTRAINT `files_message_template_id_fkey` FOREIGN KEY (`message_template_id`) REFERENCES `message_templates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
