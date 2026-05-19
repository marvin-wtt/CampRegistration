-- AlterTable
ALTER TABLE `files` ADD COLUMN `newsletter_message_id` CHAR(26) NULL;

-- AddForeignKey
ALTER TABLE `files` ADD CONSTRAINT `files_newsletter_message_id_fkey` FOREIGN KEY (`newsletter_message_id`) REFERENCES `newsletter_messages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
