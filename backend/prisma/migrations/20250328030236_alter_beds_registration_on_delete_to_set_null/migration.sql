-- DropForeignKey
ALTER TABLE `beds` DROP FOREIGN KEY `beds_registration_id_foreign`;

-- AddForeignKey
ALTER TABLE `beds` ADD CONSTRAINT `beds_registration_id_foreign` FOREIGN KEY (`registration_id`) REFERENCES `registrations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
