-- Events charge in one currency; the price becomes minor units of it, one for
-- every group or one per group (`{"de": 15000, "pl": 12000}`). Every currency
-- so far has two decimal places. `price_from`, the lowest, keeps events
-- sortable by price.
ALTER TABLE `events` ADD COLUMN `currency` CHAR(3) NOT NULL DEFAULT 'EUR',
    ADD COLUMN `price_minor` JSON NULL,
    ADD COLUMN `price_from` INTEGER UNSIGNED NOT NULL DEFAULT 0;

UPDATE `events` SET
    `price_minor` = CAST(CAST(ROUND(`price` * 100) AS UNSIGNED) AS CHAR),
    `price_from` = CAST(ROUND(`price` * 100) AS UNSIGNED);

ALTER TABLE `events` DROP COLUMN `price`,
    CHANGE COLUMN `price_minor` `price` JSON NOT NULL;

-- What the form showed at submission, in minor units: what the person agreed
-- to. `null` on registrations from before.
ALTER TABLE `registrations` ADD COLUMN `quoted_amount` INTEGER UNSIGNED NULL;
