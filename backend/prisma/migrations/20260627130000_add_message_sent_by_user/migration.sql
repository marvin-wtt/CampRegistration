-- AlterTable
ALTER TABLE `messages` ADD COLUMN `sent_by_user_id` CHAR(26) NULL;

-- CreateIndex
CREATE INDEX `messages_sent_by_user_id_index` ON `messages`(`sent_by_user_id`);

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_sent_by_user_id_foreign` FOREIGN KEY (`sent_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
