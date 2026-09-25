-- Deduplicate any pre-existing rows the race condition in
-- EventManagerService#resolveManagerInvitations could have produced before
-- the unique constraint below can be added: keep the lowest id per
-- (event_id, user_id) pair. Pending invitations (user_id IS NULL) are left
-- untouched -- MySQL/InnoDB unique indexes already treat multiple NULLs as
-- distinct, so they were never at risk.
DELETE em1 FROM event_managers em1
INNER JOIN event_managers em2
  ON em1.event_id = em2.event_id
  AND em1.user_id = em2.user_id
  AND em1.id > em2.id
WHERE em1.user_id IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `event_managers_event_id_user_id_unique` ON `event_managers`(`event_id`, `user_id`);
