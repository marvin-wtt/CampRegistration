-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `camps`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
