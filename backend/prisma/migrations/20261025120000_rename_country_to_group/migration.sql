-- Settings made per group are named after the group, like `registrations.group`.
-- Renamed in place: Prisma's own diff drops and re-adds the columns, losing data.

-- AlterTable
ALTER TABLE `message_templates` RENAME COLUMN `country` TO `group`;
ALTER TABLE `message_templates` RENAME INDEX `message_templates_country_trigger_event_id_unique` TO `message_templates_group_trigger_event_id_unique`;

-- AlterTable
ALTER TABLE `chores` RENAME COLUMN `balance_countries` TO `balance_groups`;