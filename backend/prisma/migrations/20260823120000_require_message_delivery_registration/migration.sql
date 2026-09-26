-- Rows orphaned by a registration that was deleted while the foreign key still
-- severed the link instead of removing the row. They are unreachable through
-- the application and hold personal data past the deletion meant to remove it.
DELETE FROM `message_deliveries` WHERE `registration_id` IS NULL;

-- DropForeignKey
ALTER TABLE `message_deliveries` DROP FOREIGN KEY `message_deliveries_registration_id_fkey`;

-- AlterTable
ALTER TABLE `message_deliveries` MODIFY `registration_id` CHAR(26) NOT NULL;

-- AddForeignKey
-- A delivery now lives exactly as long as the registration it was rendered for,
-- and dies with the camp through it.
ALTER TABLE `message_deliveries` ADD CONSTRAINT `message_deliveries_registration_id_fkey` FOREIGN KEY (`registration_id`) REFERENCES `registrations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;