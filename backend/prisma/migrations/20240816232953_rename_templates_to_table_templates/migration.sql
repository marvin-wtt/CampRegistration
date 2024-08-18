-- AlterTable
ALTER TABLE `templates` RENAME TO `table_templates`;

-- RenameIndex
ALTER TABLE `table_templates` DROP INDEX `templates_id_unique`, ADD UNIQUE INDEX `table_templates_id_unique` (`id`);

-- RenameIndex
ALTER TABLE `table_templates` DROP INDEX `templates_camp_id_foreign`, ADD INDEX `table_templates_camp_id_foreign` (`camp_id`);

-- DropForeignKey
ALTER TABLE `table_templates` DROP FOREIGN KEY `templates_camp_id_foreign`;

-- AddForeignKey
ALTER TABLE `table_templates` ADD CONSTRAINT `table_templates_camp_id_foreign` FOREIGN KEY (`camp_id`) REFERENCES `camps`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
