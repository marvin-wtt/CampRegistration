-- The app now supports events beyond youth camps (seminars, workshops), so the
-- core domain noun is renamed from "camp" to "event" throughout the schema.
-- `program_events` (schedule/agenda items) is renamed separately in the next
-- migration, to `program_items`, to avoid colliding with this rename.

-- events (from camps)
RENAME TABLE `camps` TO `events`;
ALTER TABLE `events` RENAME INDEX `camps_id_unique` TO `events_id_unique`;
ALTER TABLE `events` RENAME INDEX `camps_organization_id_index` TO `events_organization_id_index`;
ALTER TABLE `events` DROP FOREIGN KEY `camps_organization_id_foreign`;
ALTER TABLE `events` ADD CONSTRAINT `events_organization_id_foreign` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- event_manager_invitations (from camp_manager_invitations) — renamed before
-- event_managers below, since that table's invitation_id FK references it
RENAME TABLE `camp_manager_invitations` TO `event_manager_invitations`;

-- event_managers (from camp_managers)
RENAME TABLE `camp_managers` TO `event_managers`;
ALTER TABLE `event_managers` RENAME COLUMN `camp_id` TO `event_id`;
ALTER TABLE `event_managers` RENAME INDEX `camp_managers_id_unique` TO `event_managers_id_unique`;
ALTER TABLE `event_managers` DROP FOREIGN KEY `camp_managers_camp_id_foreign`;
ALTER TABLE `event_managers` RENAME INDEX `camp_managers_camp_id_foreign` TO `event_managers_event_id_foreign`;
ALTER TABLE `event_managers` ADD CONSTRAINT `event_managers_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `event_managers` DROP FOREIGN KEY `camp_managers_user_id_foreign`;
ALTER TABLE `event_managers` RENAME INDEX `camp_managers_user_id_foreign` TO `event_managers_user_id_foreign`;
ALTER TABLE `event_managers` ADD CONSTRAINT `event_managers_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `event_managers` DROP FOREIGN KEY `camp_managers_invitation_id_foreign`;
ALTER TABLE `event_managers` RENAME INDEX `camp_manager_invitation_id_foreign` TO `event_manager_invitation_id_foreign`;
ALTER TABLE `event_managers` ADD CONSTRAINT `event_managers_invitation_id_foreign` FOREIGN KEY (`invitation_id`) REFERENCES `event_manager_invitations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- registrations
ALTER TABLE `registrations` RENAME COLUMN `camp_id` TO `event_id`;
ALTER TABLE `registrations` RENAME COLUMN `camp_privacy_notice_version_id` TO `event_privacy_notice_version_id`;
ALTER TABLE `registrations` DROP FOREIGN KEY `registrations_camp_id_foreign`;
ALTER TABLE `registrations` ADD CONSTRAINT `registrations_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `registrations` DROP FOREIGN KEY `registrations_camp_privacy_notice_version_id_foreign`;
ALTER TABLE `registrations` RENAME INDEX `registrations_camp_privacy_notice_version_id_index` TO `registrations_event_privacy_notice_version_id_index`;
ALTER TABLE `registrations` ADD CONSTRAINT `registrations_event_privacy_notice_version_id_foreign` FOREIGN KEY (`event_privacy_notice_version_id`) REFERENCES `privacy_notice_versions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- rooms
ALTER TABLE `rooms` RENAME COLUMN `camp_id` TO `event_id`;
ALTER TABLE `rooms` DROP FOREIGN KEY `rooms_camp_id_foreign`;
ALTER TABLE `rooms` ADD CONSTRAINT `rooms_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- table_templates
ALTER TABLE `table_templates` RENAME COLUMN `camp_id` TO `event_id`;
ALTER TABLE `table_templates` DROP FOREIGN KEY `table_templates_camp_id_foreign`;
ALTER TABLE `table_templates` RENAME INDEX `table_templates_camp_id_foreign` TO `table_templates_event_id_foreign`;
ALTER TABLE `table_templates` ADD CONSTRAINT `table_templates_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- event_settings (from camp_settings)
RENAME TABLE `camp_settings` TO `event_settings`;
ALTER TABLE `event_settings` RENAME COLUMN `camp_id` TO `event_id`;
ALTER TABLE `event_settings` RENAME INDEX `camp_settings_id_unique` TO `event_settings_id_unique`;
ALTER TABLE `event_settings` RENAME INDEX `camp_settings_camp_id_key_unique` TO `event_settings_event_id_key_unique`;
ALTER TABLE `event_settings` DROP FOREIGN KEY `camp_settings_camp_id_foreign`;
ALTER TABLE `event_settings` ADD CONSTRAINT `event_settings_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- files
ALTER TABLE `files` RENAME COLUMN `camp_id` TO `event_id`;
ALTER TABLE `files` DROP FOREIGN KEY `files_camp_id_fkey`;
ALTER TABLE `files` ADD CONSTRAINT `files_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- messages
ALTER TABLE `messages` RENAME COLUMN `camp_id` TO `event_id`;
ALTER TABLE `messages` DROP FOREIGN KEY `messages_camp_id_fkey`;
ALTER TABLE `messages` ADD CONSTRAINT `messages_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- message_templates (the `event` column is an unrelated pre-existing concept —
-- the trigger-event type this template fires on — and is left untouched)
ALTER TABLE `message_templates` RENAME COLUMN `camp_id` TO `event_id`;
ALTER TABLE `message_templates` DROP FOREIGN KEY `message_templates_camp_id_fkey`;
ALTER TABLE `message_templates` RENAME INDEX `message_templates_country_event_camp_id_unique` TO `message_templates_country_event_event_id_unique`;
ALTER TABLE `message_templates` ADD CONSTRAINT `message_templates_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- tasks (tasks_assignee_id_foreign -> camp_managers is updated automatically by
-- InnoDB when that table is renamed to event_managers above; no action needed)
ALTER TABLE `tasks` RENAME COLUMN `camp_id` TO `event_id`;
ALTER TABLE `tasks` DROP FOREIGN KEY `tasks_camp_id_foreign`;
ALTER TABLE `tasks` RENAME INDEX `tasks_camp_id_foreign` TO `tasks_event_id_foreign`;
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- PrivacyNoticeScope enum: CAMP -> EVENT (widen, backfill, narrow)
ALTER TABLE `privacy_notice_versions` MODIFY COLUMN `scope` ENUM('ORGANIZATION', 'CAMP', 'EVENT') NOT NULL;
UPDATE `privacy_notice_versions` SET `scope` = 'EVENT' WHERE `scope` = 'CAMP';
ALTER TABLE `privacy_notice_versions` MODIFY COLUMN `scope` ENUM('ORGANIZATION', 'EVENT') NOT NULL;