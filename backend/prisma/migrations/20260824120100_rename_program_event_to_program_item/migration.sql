-- ProgramEvent (schedule/agenda items within an event) is renamed to
-- ProgramItem, since "event" now refers to the top-level Camp/Event entity
-- renamed in the previous migration — "the event's events" was confusing.

RENAME TABLE `program_events` TO `program_items`;
ALTER TABLE `program_items` RENAME COLUMN `camp_id` TO `event_id`;
ALTER TABLE `program_items` RENAME INDEX `program_event_id_unique` TO `program_item_id_unique`;
ALTER TABLE `program_items` DROP FOREIGN KEY `program_events_camp_id_fkey`;
ALTER TABLE `program_items` ADD CONSTRAINT `program_items_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;