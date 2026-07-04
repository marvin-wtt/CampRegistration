-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_camp_id_foreign` FOREIGN KEY (`camp_id`) REFERENCES `camps`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
