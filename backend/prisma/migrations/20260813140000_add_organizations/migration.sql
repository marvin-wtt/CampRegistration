-- Introduces organizations as the owner of every camp and newsletter.
--
-- HAND-EDITED, DELIBERATELY. The generated DDL adds `organization_id` as
-- NOT NULL, which cannot work on a populated database. The backfill cannot live
-- in a co-located `migration.ts` either: `prisma/data-migrations/runner.ts` runs
-- only after `prisma migrate deploy` has applied *all* pending schema
-- migrations, so the NOT NULL constraint would be enforced before the data
-- existed. Each column is therefore added nullable, backfilled to the legacy
-- organization, and only then tightened.
--
-- The legacy organization owns everything that existed before organizations did.
-- It is pre-verified so nothing goes dark on deploy, and deliberately
-- member-less: system administrators already bypass every guard, and adding the
-- existing user base as members would hand them organization-derived permissions
-- over each other's camps. Administrators reassign camps to real organizations
-- over time via `PATCH /camps/:campId/organization`.
--
-- `00000000000000000000000000` is a valid Crockford base32 ULID (a mnemonic such
-- as `...LEGACY` is not: `L` is excluded from the alphabet), so it satisfies the
-- `z.ulid()` validation used on every id in the API.

-- CreateTable
CREATE TABLE `organizations`
(
  `id`                  CHAR(26)     NOT NULL,
  `name`                VARCHAR(255) NOT NULL,
  `verification_status` ENUM('PENDING', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  `contact_email`       VARCHAR(255) NOT NULL,
  `phone`               VARCHAR(50) NULL,
  `website`             VARCHAR(255) NULL,
  `country`             CHAR(2)      NOT NULL,
  `address_street`      VARCHAR(255) NOT NULL,
  `address_zip_code`    VARCHAR(20)  NOT NULL,
  `address_city`        VARCHAR(255) NOT NULL,
  `registration_number` VARCHAR(100) NOT NULL,
  `verification_note`   TEXT NULL,
  `review_note`         TEXT NULL,
  `reviewed_at`         DATETIME(3) NULL,
  `reviewed_by_user_id` CHAR(26) NULL,
  `submitted_at`        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `created_at`          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`          DATETIME(3) NULL,

  UNIQUE INDEX `organizations_id_unique`(`id`),
  INDEX                 `organizations_verification_status_index`(`verification_status`),
  INDEX                 `organizations_reviewed_by_user_id_index`(`reviewed_by_user_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `organization_invitations`
(
  `id`              CHAR(26)     NOT NULL,
  `organization_id` CHAR(26)     NOT NULL,
  `email`           VARCHAR(255) NOT NULL,

  UNIQUE INDEX `organization_invitations_id_unique`(`id`),
  INDEX             `organization_invitations_organization_id_index`(`organization_id`),
  INDEX             `organization_invitations_email_index`(`email`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `organization_members`
(
  `id`              CHAR(26)    NOT NULL,
  `organization_id` CHAR(26)    NOT NULL,
  `user_id`         CHAR(26) NULL,
  `role`            VARCHAR(50) NOT NULL DEFAULT 'MEMBER',
  `invitation_id`   CHAR(26) NULL,
  `created_at`      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `organization_members_id_unique`(`id`),
  INDEX             `organization_members_user_id_index`(`user_id`),
  INDEX             `organization_members_invitation_id_index`(`invitation_id`),
  UNIQUE INDEX `organization_members_organization_id_user_id_unique`(`organization_id`, `user_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Backfill: the legacy organization, created ONLY when there is something to
-- adopt. A fresh install has no camps or newsletters and therefore gets no
-- Legacy organization at all — new deployments start clean, and no application
-- code may assume this row exists.
--
-- `FROM DUAL` is required: MariaDB rejects a bare `SELECT ... WHERE`. The
-- NOT EXISTS guard keeps a re-run on a partially migrated database a no-op.
INSERT INTO `organizations`
(`id`, `name`, `verification_status`, `contact_email`, `country`,
 `address_street`, `address_zip_code`, `address_city`,
 `registration_number`, `verification_note`, `submitted_at`, `created_at`)
SELECT '00000000000000000000000000',
       'Legacy',
       'VERIFIED',
       '',
       'de',
       '',
       '',
       '',
       '',
       'Auto-created by the organization migration.',
       NOW(3),
       NOW(3)
FROM DUAL
WHERE (EXISTS (SELECT 1 FROM `camps`) OR EXISTS (SELECT 1 FROM `newsletters`))
  AND NOT EXISTS (SELECT 1
                  FROM `organizations`
                  WHERE `id` = '00000000000000000000000000');

-- AlterTable: add nullable, backfill, then tighten.
ALTER TABLE `camps`
  ADD COLUMN `organization_id` CHAR(26) NULL;
UPDATE `camps`
SET `organization_id` = '00000000000000000000000000'
WHERE `organization_id` IS NULL;
ALTER TABLE `camps` MODIFY `organization_id` CHAR (26) NOT NULL;

-- AlterTable
ALTER TABLE `newsletters`
  ADD COLUMN `organization_id` CHAR(26) NULL;
UPDATE `newsletters`
SET `organization_id` = '00000000000000000000000000'
WHERE `organization_id` IS NULL;
ALTER TABLE `newsletters` MODIFY `organization_id` CHAR (26) NOT NULL;

-- CreateIndex
CREATE INDEX `camps_organization_id_index` ON `camps` (`organization_id`);

-- CreateIndex
CREATE INDEX `newsletters_organization_id_index` ON `newsletters` (`organization_id`);

-- AddForeignKey
ALTER TABLE `organizations`
  ADD CONSTRAINT `organizations_reviewed_by_user_id_foreign` FOREIGN KEY (`reviewed_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `organization_invitations`
  ADD CONSTRAINT `organization_invitations_organization_id_foreign` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `organization_members`
  ADD CONSTRAINT `organization_members_organization_id_foreign` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `organization_members`
  ADD CONSTRAINT `organization_members_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `organization_members`
  ADD CONSTRAINT `organization_members_invitation_id_foreign` FOREIGN KEY (`invitation_id`) REFERENCES `organization_invitations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `camps`
  ADD CONSTRAINT `camps_organization_id_foreign` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `newsletters`
  ADD CONSTRAINT `newsletters_organization_id_foreign` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
