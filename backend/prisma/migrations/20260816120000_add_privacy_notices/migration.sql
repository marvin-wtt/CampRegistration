-- CreateTable
CREATE TABLE `privacy_notice_versions`
(
  `id`           CHAR(26) NOT NULL,
  `scope`        ENUM('ORGANIZATION', 'CAMP') NOT NULL,
  `scope_id`     CHAR(26) NOT NULL,
  `version`      INTEGER  NOT NULL,
  `content`      JSON     NOT NULL,
  `published_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `privacy_notice_versions_id_unique`(`id`),
  INDEX          `privacy_notice_versions_scope_scope_id_index`(`scope`, `scope_id`),
  UNIQUE INDEX `privacy_notice_versions_scope_scope_id_version_unique`(`scope`, `scope_id`, `version`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `registrations`
  ADD COLUMN `camp_privacy_notice_version_id` CHAR(26) NULL,
    ADD COLUMN `organization_privacy_notice_version_id` CHAR(26) NULL,
    ADD COLUMN `platform_privacy_policy_updated_at` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `registrations_organization_privacy_notice_version_id_index` ON `registrations` (`organization_privacy_notice_version_id`);

-- CreateIndex
CREATE INDEX `registrations_camp_privacy_notice_version_id_index` ON `registrations` (`camp_privacy_notice_version_id`);

-- AddForeignKey
ALTER TABLE `registrations`
  ADD CONSTRAINT `registrations_organization_privacy_notice_version_id_foreign` FOREIGN KEY (`organization_privacy_notice_version_id`) REFERENCES `privacy_notice_versions` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registrations`
  ADD CONSTRAINT `registrations_camp_privacy_notice_version_id_foreign` FOREIGN KEY (`camp_privacy_notice_version_id`) REFERENCES `privacy_notice_versions` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
