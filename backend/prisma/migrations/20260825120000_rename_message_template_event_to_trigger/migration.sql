-- `message_templates.event` is the trigger-event type the template fires on
-- (e.g. REGISTRATION_CREATED). Renamed to `trigger` so the actual event
-- relation (formerly worked around as `eventRef`) can be named `event` like
-- every other model, instead of colliding with this pre-existing column.
ALTER TABLE `message_templates` RENAME COLUMN `event` TO `trigger`;
ALTER TABLE `message_templates` RENAME INDEX `message_templates_country_event_event_id_unique` TO `message_templates_country_trigger_event_id_unique`;