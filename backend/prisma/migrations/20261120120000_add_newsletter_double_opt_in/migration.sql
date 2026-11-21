-- AlterTable
ALTER TABLE `newsletter_subscribers` ADD COLUMN `locale` VARCHAR(5) NULL,
    ADD COLUMN `consented_at` DATETIME(3) NULL,
    ADD COLUMN `confirmed_at` DATETIME(3) NULL,
    ADD COLUMN `confirmation_token` CHAR(64) NULL,
    ADD COLUMN `confirmation_sent_at` DATETIME(3) NULL;

-- Existing subscribers were added before double opt-in and stay confirmed.
UPDATE `newsletter_subscribers`
SET `consented_at` = `subscribed_at`,
    `confirmed_at` = `subscribed_at`;

ALTER TABLE `newsletter_subscribers` MODIFY `consented_at` DATETIME(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `newsletter_subscribers_confirmation_token_unique` ON `newsletter_subscribers`(`confirmation_token`);

-- CreateIndex
CREATE INDEX `newsletter_subscribers_newsletter_id_confirmed_at_index` ON `newsletter_subscribers`(`newsletter_id`, `confirmed_at`);
