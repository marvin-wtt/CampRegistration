-- CreateEnum
CREATE TYPE "AdminAccessScope" AS ENUM ('event', 'newsletter', 'organization');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ConfirmationMode" AS ENUM ('AUTOMATIC', 'MANUAL');

-- CreateEnum
CREATE TYPE "OrganizationVerificationStatus" AS ENUM ('DRAFT', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('ACCEPTED', 'PENDING', 'WAITLISTED');

-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('ACCESS', 'REFRESH', 'RESET_PASSWORD', 'VERIFY_EMAIL', 'RESTRICTED_ACCESS');

-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('PENDING', 'READY');

-- CreateEnum
CREATE TYPE "FinanceCategoryKind" AS ENUM ('EXPENSE', 'INCOME');

-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('EXPENSE', 'REFUND');

-- CreateEnum
CREATE TYPE "PayoutDirection" AS ENUM ('OUT', 'IN');

-- CreateEnum
CREATE TYPE "PaymentSource" AS ENUM ('MANUAL');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PAID');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER', 'CASH', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentSettlement" AS ENUM ('RETAINED');

-- CreateEnum
CREATE TYPE "PaymentRefundStatus" AS ENUM ('REFUNDED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ChoreRotationUnit" AS ENUM ('PERSON', 'ROOM');

-- CreateEnum
CREATE TYPE "ChoreEligibility" AS ENUM ('PARTICIPANTS', 'STAFF', 'EVERYONE');

-- CreateEnum
CREATE TYPE "ChoreEffort" AS ENUM ('LIGHT', 'NORMAL', 'HEAVY');

-- CreateEnum
CREATE TYPE "ChoreAssignmentStatus" AS ENUM ('PLANNED', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ChoreMemberRole" AS ENUM ('MEMBER', 'SUPERVISOR');

-- CreateEnum
CREATE TYPE "LegalDocumentType" AS ENUM ('IMPRINT', 'PRIVACY_POLICY');

-- CreateEnum
CREATE TYPE "PrivacyNoticeScope" AS ENUM ('ORGANIZATION', 'EVENT');

-- CreateEnum
CREATE TYPE "EventRetentionDeadlineKind" AS ENUM ('sensitive', 'registrations');

-- CreateTable
CREATE TABLE "users" (
    "id" CHAR(26) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "password" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "locale" VARCHAR(5) NOT NULL DEFAULT 'en-GB',
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "last_seen" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_access_grants" (
    "id" CHAR(26) NOT NULL,
    "user_id" CHAR(26) NOT NULL,
    "scope" "AdminAccessScope" NOT NULL,
    "scope_id" CHAR(26) NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_access_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_two_factor" (
    "user_id" CHAR(26) NOT NULL,
    "secret" CHAR(32) NOT NULL,
    "confirmed_at" TIMESTAMP(3),
    "failed_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "user_two_factor_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "two_factor_recovery_codes" (
    "id" CHAR(26) NOT NULL,
    "user_id" CHAR(26) NOT NULL,
    "code" VARCHAR(255) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "two_factor_recovery_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" CHAR(26) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "verification_status" "OrganizationVerificationStatus" NOT NULL DEFAULT 'DRAFT',
    "contact_email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "website" VARCHAR(255),
    "registration_number" VARCHAR(100),
    "address_street" VARCHAR(255) NOT NULL,
    "address_zip_code" VARCHAR(20) NOT NULL,
    "address_city" VARCHAR(255) NOT NULL,
    "country" CHAR(2) NOT NULL,
    "verification_note" TEXT,
    "review_note" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by_user_id" CHAR(26),
    "submitted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_members" (
    "id" CHAR(26) NOT NULL,
    "organization_id" CHAR(26) NOT NULL,
    "user_id" CHAR(26),
    "role" VARCHAR(50) NOT NULL DEFAULT 'MEMBER',
    "invitation_id" CHAR(26),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_invitations" (
    "id" CHAR(26) NOT NULL,
    "organization_id" CHAR(26) NOT NULL,
    "email" VARCHAR(255) NOT NULL,

    CONSTRAINT "organization_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" CHAR(26) NOT NULL,
    "organization_id" CHAR(26) NOT NULL,
    "listed" BOOLEAN NOT NULL,
    "registration_opens_at" TIMESTAMP(0),
    "registration_closes_at" TIMESTAMP(0),
    "confirmation_mode" "ConfirmationMode" NOT NULL DEFAULT 'AUTOMATIC',
    "countries" JSONB NOT NULL,
    "name" JSONB NOT NULL,
    "organizer" JSONB NOT NULL,
    "contactEmail" JSONB NOT NULL,
    "maxParticipants" JSONB NOT NULL,
    "min_age" INTEGER NOT NULL,
    "max_age" INTEGER NOT NULL,
    "start_at" TIMESTAMP(0) NOT NULL,
    "end_at" TIMESTAMP(0) NOT NULL,
    "timezone" VARCHAR(64) NOT NULL DEFAULT 'Europe/Berlin',
    "price" JSONB NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'EUR',
    "location" JSONB,
    "form" JSONB NOT NULL,
    "themes" JSONB NOT NULL DEFAULT '{}',
    "sensitive_data_purged_at" TIMESTAMP(0),
    "sensitive_data_cleared_at" TIMESTAMP(0),
    "registration_data_purged_at" TIMESTAMP(0),
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_finances" (
    "event_id" CHAR(26) NOT NULL,
    "payout_number_prefix" VARCHAR(8) NOT NULL DEFAULT 'P',
    "income_number_prefix" VARCHAR(8) NOT NULL DEFAULT 'I',
    "last_receipt_number" INTEGER NOT NULL DEFAULT 0,
    "last_payout_number" INTEGER NOT NULL DEFAULT 0,
    "last_income_number" INTEGER NOT NULL DEFAULT 0,
    "reference_code" CHAR(4) NOT NULL,
    "last_reference_number" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "event_finances_pkey" PRIMARY KEY ("event_id")
);

-- CreateTable
CREATE TABLE "event_managers" (
    "id" CHAR(26) NOT NULL,
    "event_id" CHAR(26) NOT NULL,
    "user_id" CHAR(26),
    "role" VARCHAR(50) NOT NULL,
    "invitation_id" CHAR(26),
    "expires_at" TIMESTAMP(0),

    CONSTRAINT "event_managers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_manager_invitations" (
    "id" CHAR(26) NOT NULL,
    "email" VARCHAR(255) NOT NULL,

    CONSTRAINT "event_manager_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registrations" (
    "id" CHAR(26) NOT NULL,
    "event_id" CHAR(26) NOT NULL,
    "data" JSONB NOT NULL,
    "custom_data" JSONB,
    "first_name" TEXT,
    "last_name" TEXT,
    "role" TEXT,
    "gender" TEXT,
    "date_of_birth" DATE,
    "emails" JSONB,
    "phone_numbers" JSONB,
    "street" TEXT,
    "city" TEXT,
    "zip_code" TEXT,
    "country" TEXT,
    "group" VARCHAR(2),
    "newsletter_consent" BOOLEAN,
    "locale" VARCHAR(5) NOT NULL DEFAULT 'en-GB',
    "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "quoted_amount" INTEGER,
    "currency" CHAR(3),
    "amount_due_override" INTEGER,
    "amount_due_note" VARCHAR(255),
    "amount_due_adjusted_at" TIMESTAMP(3),
    "payment_reference" VARCHAR(16) NOT NULL,
    "organization_privacy_notice_version_id" CHAR(26),
    "event_privacy_notice_version_id" CHAR(26),
    "platform_privacy_policy_updated_at" TIMESTAMP(3),
    "consent_texts" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" CHAR(26) NOT NULL,
    "event_id" CHAR(26) NOT NULL,
    "name" JSONB NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 999,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beds" (
    "id" CHAR(26) NOT NULL,
    "room_id" CHAR(26) NOT NULL,
    "registration_id" CHAR(26),

    CONSTRAINT "beds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "table_templates" (
    "id" CHAR(26) NOT NULL,
    "event_id" CHAR(26) NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "table_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_settings" (
    "id" CHAR(26) NOT NULL,
    "event_id" CHAR(26) NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "data" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "event_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens" (
    "id" SERIAL NOT NULL,
    "user_id" CHAR(26) NOT NULL,
    "token" CHAR(255) NOT NULL,
    "type" "TokenType" NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "blacklisted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files" (
    "id" CHAR(26) NOT NULL,
    "event_id" CHAR(26),
    "registration_id" CHAR(26),
    "message_id" CHAR(26),
    "message_delivery_id" CHAR(26),
    "message_template_id" CHAR(26),
    "newsletter_message_id" CHAR(26),
    "expense_id" CHAR(26),
    "payout_id" CHAR(26),
    "income_id" CHAR(26),
    "name" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "field" TEXT,
    "locale" TEXT,
    "group" VARCHAR(2),
    "type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "access_level" TEXT,
    "storage_location" TEXT NOT NULL,
    "upload_status" "UploadStatus" NOT NULL DEFAULT 'READY',
    "encryption" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_categories" (
    "id" CHAR(26) NOT NULL,
    "event_id" CHAR(26) NOT NULL,
    "kind" "FinanceCategoryKind" NOT NULL DEFAULT 'EXPENSE',
    "parent_id" CHAR(26),
    "name" JSONB NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "finance_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" CHAR(26) NOT NULL,
    "event_id" CHAR(26) NOT NULL,
    "receipt_number" INTEGER NOT NULL,
    "type" "ExpenseType" NOT NULL DEFAULT 'EXPENSE',
    "amount" INTEGER NOT NULL,
    "original_amount" INTEGER,
    "original_currency" CHAR(3),
    "date" CHAR(10),
    "description" VARCHAR(255) NOT NULL,
    "vendor" VARCHAR(255),
    "category_id" CHAR(26),
    "paid_by_user_id" CHAR(26),
    "paid_by_name" VARCHAR(255),
    "created_by_user_id" CHAR(26),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incomes" (
    "id" CHAR(26) NOT NULL,
    "event_id" CHAR(26) NOT NULL,
    "number" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "original_amount" INTEGER,
    "original_currency" CHAR(3),
    "received_on" CHAR(10),
    "description" VARCHAR(255) NOT NULL,
    "payer_name" VARCHAR(255),
    "category_id" CHAR(26),
    "created_by_user_id" CHAR(26),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "incomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" CHAR(26) NOT NULL,
    "event_id" CHAR(26) NOT NULL,
    "number" INTEGER NOT NULL,
    "recipient_user_id" CHAR(26),
    "recipient_name" VARCHAR(255) NOT NULL,
    "direction" "PayoutDirection" NOT NULL,
    "amount" INTEGER NOT NULL,
    "paid_on" CHAR(10),
    "note" VARCHAR(255),
    "bank_account_holder" VARCHAR(255),
    "bank_iban" VARCHAR(34),
    "bank_bic" VARCHAR(11),
    "signature" TEXT,
    "signed_at" TIMESTAMP(3),
    "statement" JSONB NOT NULL,
    "created_by_user_id" CHAR(26),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" CHAR(26) NOT NULL,
    "event_id" CHAR(26) NOT NULL,
    "registration_id" CHAR(26),
    "source" "PaymentSource" NOT NULL DEFAULT 'MANUAL',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PAID',
    "amount" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "paid_on" CHAR(10) NOT NULL,
    "note" VARCHAR(255),
    "payer_name" VARCHAR(255),
    "registration_ref" CHAR(26) NOT NULL,
    "settlement" "PaymentSettlement",
    "created_by_user_id" CHAR(26),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_refunds" (
    "id" CHAR(26) NOT NULL,
    "payment_id" CHAR(26) NOT NULL,
    "status" "PaymentRefundStatus" NOT NULL DEFAULT 'REFUNDED',
    "amount" INTEGER NOT NULL,
    "refunded_on" CHAR(10) NOT NULL,
    "reason" VARCHAR(255),
    "amount_due_reduction" INTEGER NOT NULL DEFAULT 0,
    "created_by_user_id" CHAR(26),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "payment_refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" CHAR(26) NOT NULL,
    "event_id" CHAR(26) NOT NULL,
    "sent_by_user_id" CHAR(26),
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "reply_to" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_deliveries" (
    "id" CHAR(26) NOT NULL,
    "message_template_id" CHAR(26),
    "message_id" CHAR(26),
    "registration_id" CHAR(26) NOT NULL,
    "batch_id" CHAR(26),
    "to" VARCHAR(255),
    "cc" VARCHAR(255),
    "bcc" VARCHAR(255),
    "reply_to" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bounce_correlation_id" TEXT,
    "bounced_at" TIMESTAMP(3),
    "bounce_reason" TEXT,

    CONSTRAINT "message_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_templates" (
    "id" CHAR(26) NOT NULL,
    "event_id" CHAR(26) NOT NULL,
    "group" TEXT,
    "trigger" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "reply_to" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" CHAR(26) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "queue" VARCHAR(255) NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "priority" SMALLINT NOT NULL DEFAULT 1,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TIMESTAMP(3),
    "run_at" TIMESTAMP(3),
    "reserved_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_rate_limits" (
    "queue" VARCHAR(255) NOT NULL,
    "tokens" DOUBLE PRECISION NOT NULL,
    "refilled_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_rate_limits_pkey" PRIMARY KEY ("queue")
);

-- CreateTable
CREATE TABLE "newsletters" (
    "id" CHAR(26) NOT NULL,
    "organization_id" CHAR(26) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "reply_to" CHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "newsletters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter_managers" (
    "id" CHAR(26) NOT NULL,
    "newsletter_id" CHAR(26) NOT NULL,
    "user_id" CHAR(26) NOT NULL,
    "role" VARCHAR(50) NOT NULL DEFAULT 'OWNER',

    CONSTRAINT "newsletter_managers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter_subscribers" (
    "id" CHAR(26) NOT NULL,
    "newsletter_id" CHAR(26) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255),
    "locale" VARCHAR(5),
    "unsubscribe_token" CHAR(64) NOT NULL,
    "consented_at" TIMESTAMP(3) NOT NULL,
    "confirmed_at" TIMESTAMP(3),
    "confirmation_token" CHAR(64),
    "confirmation_sent_at" TIMESTAMP(3),
    "subscribed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter_messages" (
    "id" CHAR(26) NOT NULL,
    "newsletter_id" CHAR(26) NOT NULL,
    "sent_by_user_id" CHAR(26),
    "subject" VARCHAR(255) NOT NULL,
    "body" TEXT NOT NULL,
    "recipient_count" INTEGER NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "newsletter_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_items" (
    "id" CHAR(26) NOT NULL,
    "event_id" CHAR(26) NOT NULL,
    "title" JSONB NOT NULL,
    "details" JSONB,
    "location" JSONB,
    "date" TEXT,
    "duration" INTEGER,
    "time" TEXT,
    "color" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'both',

    CONSTRAINT "program_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_published_days" (
    "id" CHAR(26) NOT NULL,
    "event_id" CHAR(26) NOT NULL,
    "date" CHAR(10) NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'both',

    CONSTRAINT "program_published_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" CHAR(26) NOT NULL,
    "event_id" CHAR(26) NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "due_date" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "assignee_id" CHAR(26),
    "reminder_sent_at" TIMESTAMP(3),

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chores" (
    "id" CHAR(26) NOT NULL,
    "event_id" CHAR(26) NOT NULL,
    "name" JSONB NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 999,
    "default_count" INTEGER,
    "supervisor_count" INTEGER NOT NULL DEFAULT 0,
    "eligibility" "ChoreEligibility" NOT NULL DEFAULT 'PARTICIPANTS',
    "effort" "ChoreEffort" NOT NULL DEFAULT 'NORMAL',
    "default_rotation_unit" "ChoreRotationUnit" NOT NULL DEFAULT 'PERSON',
    "balance_groups" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "chores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chore_slots" (
    "id" CHAR(26) NOT NULL,
    "chore_id" CHAR(26) NOT NULL,
    "name" JSONB NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "headcount" INTEGER,
    "supervisor_count" INTEGER,
    "effort" "ChoreEffort",

    CONSTRAINT "chore_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chore_assignments" (
    "id" CHAR(26) NOT NULL,
    "event_id" CHAR(26) NOT NULL,
    "chore_id" CHAR(26) NOT NULL,
    "slot_id" CHAR(26),
    "batch_id" CHAR(26),
    "rotation_unit" "ChoreRotationUnit" NOT NULL,
    "date" DATE NOT NULL,
    "slot" TEXT,
    "status" "ChoreAssignmentStatus" NOT NULL DEFAULT 'PLANNED',
    "note" VARCHAR(500),
    "headcount" INTEGER,
    "supervisor_count" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chore_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chore_assignment_members" (
    "id" CHAR(26) NOT NULL,
    "chore_assignment_id" CHAR(26) NOT NULL,
    "registration_id" CHAR(26) NOT NULL,
    "role" "ChoreMemberRole" NOT NULL DEFAULT 'MEMBER',
    "missed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "chore_assignment_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_documents" (
    "id" CHAR(26) NOT NULL,
    "type" "LegalDocumentType" NOT NULL,
    "content" JSONB,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "legal_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "privacy_notice_versions" (
    "id" CHAR(26) NOT NULL,
    "scope" "PrivacyNoticeScope" NOT NULL,
    "scope_id" CHAR(26) NOT NULL,
    "version" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "privacy_notice_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" CHAR(26) NOT NULL,
    "action" VARCHAR(64) NOT NULL,
    "entity_type" VARCHAR(64) NOT NULL,
    "entity_id" CHAR(26) NOT NULL,
    "event_id" CHAR(26),
    "actor_id" CHAR(26),
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_deleted_users" (
    "id" CHAR(26) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "deleted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_deleted_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_retention_states" (
    "id" CHAR(26) NOT NULL,
    "event_id" CHAR(26) NOT NULL,
    "kind" "EventRetentionDeadlineKind" NOT NULL,
    "postponed_until" CHAR(10),
    "postpone_reason" TEXT,
    "postponed_at" TIMESTAMP(0),
    "postponed_by_id" CHAR(26),
    "reminded_for" CHAR(10),
    "reminded_stage" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_retention_states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_id_key" ON "users"("id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admin_access_grants_id_key" ON "admin_access_grants"("id");

-- CreateIndex
CREATE INDEX "admin_access_grants_user_id_scope_scope_id_expires_at_idx" ON "admin_access_grants"("user_id", "scope", "scope_id", "expires_at");

-- CreateIndex
CREATE INDEX "admin_access_grants_scope_scope_id_created_at_idx" ON "admin_access_grants"("scope", "scope_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "two_factor_recovery_codes_id_key" ON "two_factor_recovery_codes"("id");

-- CreateIndex
CREATE INDEX "two_factor_recovery_codes_user_id_idx" ON "two_factor_recovery_codes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_id_key" ON "organizations"("id");

-- CreateIndex
CREATE INDEX "organizations_verification_status_idx" ON "organizations"("verification_status");

-- CreateIndex
CREATE INDEX "organizations_reviewed_by_user_id_idx" ON "organizations"("reviewed_by_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_id_key" ON "organization_members"("id");

-- CreateIndex
CREATE INDEX "organization_members_user_id_idx" ON "organization_members"("user_id");

-- CreateIndex
CREATE INDEX "organization_members_invitation_id_idx" ON "organization_members"("invitation_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_organization_id_user_id_key" ON "organization_members"("organization_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_invitations_id_key" ON "organization_invitations"("id");

-- CreateIndex
CREATE INDEX "organization_invitations_organization_id_idx" ON "organization_invitations"("organization_id");

-- CreateIndex
CREATE INDEX "organization_invitations_email_idx" ON "organization_invitations"("email");

-- CreateIndex
CREATE UNIQUE INDEX "events_id_key" ON "events"("id");

-- CreateIndex
CREATE INDEX "events_organization_id_idx" ON "events"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_finances_reference_code_key" ON "event_finances"("reference_code");

-- CreateIndex
CREATE UNIQUE INDEX "event_managers_id_key" ON "event_managers"("id");

-- CreateIndex
CREATE INDEX "event_managers_event_id_idx" ON "event_managers"("event_id");

-- CreateIndex
CREATE INDEX "event_managers_user_id_idx" ON "event_managers"("user_id");

-- CreateIndex
CREATE INDEX "event_managers_invitation_id_idx" ON "event_managers"("invitation_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_managers_event_id_user_id_key" ON "event_managers"("event_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_manager_invitations_id_key" ON "event_manager_invitations"("id");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_id_key" ON "registrations"("id");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_payment_reference_key" ON "registrations"("payment_reference");

-- CreateIndex
CREATE INDEX "registrations_organization_privacy_notice_version_id_idx" ON "registrations"("organization_privacy_notice_version_id");

-- CreateIndex
CREATE INDEX "registrations_event_privacy_notice_version_id_idx" ON "registrations"("event_privacy_notice_version_id");

-- CreateIndex
CREATE INDEX "registrations_event_id_group_idx" ON "registrations"("event_id", "group");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_id_key" ON "rooms"("id");

-- CreateIndex
CREATE UNIQUE INDEX "beds_id_key" ON "beds"("id");

-- CreateIndex
CREATE UNIQUE INDEX "beds_registration_id_key" ON "beds"("registration_id");

-- CreateIndex
CREATE UNIQUE INDEX "table_templates_id_key" ON "table_templates"("id");

-- CreateIndex
CREATE INDEX "table_templates_event_id_idx" ON "table_templates"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_settings_id_key" ON "event_settings"("id");

-- CreateIndex
CREATE UNIQUE INDEX "event_settings_event_id_key_key" ON "event_settings"("event_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "files_id_key" ON "files"("id");

-- CreateIndex
CREATE INDEX "files_expense_id_idx" ON "files"("expense_id");

-- CreateIndex
CREATE INDEX "files_payout_id_idx" ON "files"("payout_id");

-- CreateIndex
CREATE INDEX "files_income_id_idx" ON "files"("income_id");

-- CreateIndex
CREATE UNIQUE INDEX "finance_categories_id_key" ON "finance_categories"("id");

-- CreateIndex
CREATE INDEX "finance_categories_event_id_idx" ON "finance_categories"("event_id");

-- CreateIndex
CREATE INDEX "finance_categories_parent_id_idx" ON "finance_categories"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "expenses_id_key" ON "expenses"("id");

-- CreateIndex
CREATE INDEX "expenses_category_id_idx" ON "expenses"("category_id");

-- CreateIndex
CREATE INDEX "expenses_paid_by_user_id_idx" ON "expenses"("paid_by_user_id");

-- CreateIndex
CREATE INDEX "expenses_created_by_user_id_idx" ON "expenses"("created_by_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "expenses_event_id_receipt_number_key" ON "expenses"("event_id", "receipt_number");

-- CreateIndex
CREATE UNIQUE INDEX "incomes_id_key" ON "incomes"("id");

-- CreateIndex
CREATE INDEX "incomes_category_id_idx" ON "incomes"("category_id");

-- CreateIndex
CREATE INDEX "incomes_created_by_user_id_idx" ON "incomes"("created_by_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "incomes_event_id_number_key" ON "incomes"("event_id", "number");

-- CreateIndex
CREATE UNIQUE INDEX "payouts_id_key" ON "payouts"("id");

-- CreateIndex
CREATE INDEX "payouts_recipient_user_id_idx" ON "payouts"("recipient_user_id");

-- CreateIndex
CREATE INDEX "payouts_created_by_user_id_idx" ON "payouts"("created_by_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "payouts_event_id_number_key" ON "payouts"("event_id", "number");

-- CreateIndex
CREATE UNIQUE INDEX "payments_id_key" ON "payments"("id");

-- CreateIndex
CREATE INDEX "payments_event_id_idx" ON "payments"("event_id");

-- CreateIndex
CREATE INDEX "payments_registration_id_idx" ON "payments"("registration_id");

-- CreateIndex
CREATE INDEX "payments_registration_ref_idx" ON "payments"("registration_ref");

-- CreateIndex
CREATE INDEX "payments_created_by_user_id_idx" ON "payments"("created_by_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_refunds_id_key" ON "payment_refunds"("id");

-- CreateIndex
CREATE INDEX "payment_refunds_payment_id_idx" ON "payment_refunds"("payment_id");

-- CreateIndex
CREATE INDEX "payment_refunds_created_by_user_id_idx" ON "payment_refunds"("created_by_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "messages_id_key" ON "messages"("id");

-- CreateIndex
CREATE INDEX "messages_sent_by_user_id_idx" ON "messages"("sent_by_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "message_deliveries_id_key" ON "message_deliveries"("id");

-- CreateIndex
CREATE UNIQUE INDEX "message_deliveries_bounce_correlation_id_key" ON "message_deliveries"("bounce_correlation_id");

-- CreateIndex
CREATE UNIQUE INDEX "message_templates_id_key" ON "message_templates"("id");

-- CreateIndex
CREATE UNIQUE INDEX "message_templates_group_trigger_event_id_key" ON "message_templates"("group", "trigger", "event_id");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_id_key" ON "jobs"("id");

-- CreateIndex
CREATE INDEX "jobs_status_run_at_idx" ON "jobs"("status", "run_at");

-- CreateIndex
CREATE UNIQUE INDEX "job_rate_limits_queue_key" ON "job_rate_limits"("queue");

-- CreateIndex
CREATE UNIQUE INDEX "newsletters_id_key" ON "newsletters"("id");

-- CreateIndex
CREATE INDEX "newsletters_organization_id_idx" ON "newsletters"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_managers_id_key" ON "newsletter_managers"("id");

-- CreateIndex
CREATE INDEX "newsletter_managers_newsletter_id_idx" ON "newsletter_managers"("newsletter_id");

-- CreateIndex
CREATE INDEX "newsletter_managers_user_id_idx" ON "newsletter_managers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_managers_newsletter_id_user_id_key" ON "newsletter_managers"("newsletter_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscribers_id_key" ON "newsletter_subscribers"("id");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscribers_unsubscribe_token_key" ON "newsletter_subscribers"("unsubscribe_token");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscribers_confirmation_token_key" ON "newsletter_subscribers"("confirmation_token");

-- CreateIndex
CREATE INDEX "newsletter_subscribers_newsletter_id_idx" ON "newsletter_subscribers"("newsletter_id");

-- CreateIndex
CREATE INDEX "newsletter_subscribers_newsletter_id_confirmed_at_idx" ON "newsletter_subscribers"("newsletter_id", "confirmed_at");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscribers_newsletter_id_email_key" ON "newsletter_subscribers"("newsletter_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_messages_id_key" ON "newsletter_messages"("id");

-- CreateIndex
CREATE INDEX "newsletter_messages_newsletter_id_idx" ON "newsletter_messages"("newsletter_id");

-- CreateIndex
CREATE UNIQUE INDEX "program_items_id_key" ON "program_items"("id");

-- CreateIndex
CREATE UNIQUE INDEX "program_published_days_id_key" ON "program_published_days"("id");

-- CreateIndex
CREATE UNIQUE INDEX "program_published_days_event_id_date_key" ON "program_published_days"("event_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "tasks_id_key" ON "tasks"("id");

-- CreateIndex
CREATE INDEX "tasks_event_id_idx" ON "tasks"("event_id");

-- CreateIndex
CREATE INDEX "tasks_assignee_id_idx" ON "tasks"("assignee_id");

-- CreateIndex
CREATE INDEX "tasks_due_date_idx" ON "tasks"("due_date");

-- CreateIndex
CREATE UNIQUE INDEX "chores_id_key" ON "chores"("id");

-- CreateIndex
CREATE INDEX "chores_event_id_idx" ON "chores"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "chore_slots_id_key" ON "chore_slots"("id");

-- CreateIndex
CREATE INDEX "chore_slots_chore_id_idx" ON "chore_slots"("chore_id");

-- CreateIndex
CREATE UNIQUE INDEX "chore_assignments_id_key" ON "chore_assignments"("id");

-- CreateIndex
CREATE INDEX "chore_assignments_event_id_idx" ON "chore_assignments"("event_id");

-- CreateIndex
CREATE INDEX "chore_assignments_chore_id_idx" ON "chore_assignments"("chore_id");

-- CreateIndex
CREATE INDEX "chore_assignments_slot_id_idx" ON "chore_assignments"("slot_id");

-- CreateIndex
CREATE INDEX "chore_assignments_batch_id_idx" ON "chore_assignments"("batch_id");

-- CreateIndex
CREATE UNIQUE INDEX "chore_assignment_members_id_key" ON "chore_assignment_members"("id");

-- CreateIndex
CREATE INDEX "chore_assignment_members_registration_id_idx" ON "chore_assignment_members"("registration_id");

-- CreateIndex
CREATE UNIQUE INDEX "chore_assignment_members_chore_assignment_id_registration_i_key" ON "chore_assignment_members"("chore_assignment_id", "registration_id");

-- CreateIndex
CREATE UNIQUE INDEX "legal_documents_id_key" ON "legal_documents"("id");

-- CreateIndex
CREATE UNIQUE INDEX "legal_documents_type_key" ON "legal_documents"("type");

-- CreateIndex
CREATE UNIQUE INDEX "privacy_notice_versions_id_key" ON "privacy_notice_versions"("id");

-- CreateIndex
CREATE INDEX "privacy_notice_versions_scope_scope_id_idx" ON "privacy_notice_versions"("scope", "scope_id");

-- CreateIndex
CREATE UNIQUE INDEX "privacy_notice_versions_scope_scope_id_version_key" ON "privacy_notice_versions"("scope", "scope_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "audit_logs_id_key" ON "audit_logs"("id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_created_at_idx" ON "audit_logs"("entity_type", "entity_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_event_id_created_at_idx" ON "audit_logs"("event_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "audit_deleted_users_deleted_at_idx" ON "audit_deleted_users"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "event_retention_states_event_id_kind_key" ON "event_retention_states"("event_id", "kind");

-- AddForeignKey
ALTER TABLE "admin_access_grants" ADD CONSTRAINT "admin_access_grants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_two_factor" ADD CONSTRAINT "user_two_factor_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "two_factor_recovery_codes" ADD CONSTRAINT "two_factor_recovery_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_two_factor"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_invitation_id_fkey" FOREIGN KEY ("invitation_id") REFERENCES "organization_invitations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_finances" ADD CONSTRAINT "event_finances_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_managers" ADD CONSTRAINT "event_managers_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_managers" ADD CONSTRAINT "event_managers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_managers" ADD CONSTRAINT "event_managers_invitation_id_fkey" FOREIGN KEY ("invitation_id") REFERENCES "event_manager_invitations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_organization_privacy_notice_version_id_fkey" FOREIGN KEY ("organization_privacy_notice_version_id") REFERENCES "privacy_notice_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_event_privacy_notice_version_id_fkey" FOREIGN KEY ("event_privacy_notice_version_id") REFERENCES "privacy_notice_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beds" ADD CONSTRAINT "beds_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beds" ADD CONSTRAINT "beds_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "registrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_templates" ADD CONSTRAINT "table_templates_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_settings" ADD CONSTRAINT "event_settings_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "registrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_message_delivery_id_fkey" FOREIGN KEY ("message_delivery_id") REFERENCES "message_deliveries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_message_template_id_fkey" FOREIGN KEY ("message_template_id") REFERENCES "message_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_newsletter_message_id_fkey" FOREIGN KEY ("newsletter_message_id") REFERENCES "newsletter_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "payouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_income_id_fkey" FOREIGN KEY ("income_id") REFERENCES "incomes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_categories" ADD CONSTRAINT "finance_categories_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_categories" ADD CONSTRAINT "finance_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "finance_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "finance_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_paid_by_user_id_fkey" FOREIGN KEY ("paid_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_event_id_finance_foreign" FOREIGN KEY ("event_id") REFERENCES "event_finances"("event_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "finance_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_event_id_finance_foreign" FOREIGN KEY ("event_id") REFERENCES "event_finances"("event_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "registrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_refunds" ADD CONSTRAINT "payment_refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_refunds" ADD CONSTRAINT "payment_refunds_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sent_by_user_id_fkey" FOREIGN KEY ("sent_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_deliveries" ADD CONSTRAINT "message_deliveries_message_template_id_fkey" FOREIGN KEY ("message_template_id") REFERENCES "message_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_deliveries" ADD CONSTRAINT "message_deliveries_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_deliveries" ADD CONSTRAINT "message_deliveries_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "newsletters" ADD CONSTRAINT "newsletters_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "newsletter_managers" ADD CONSTRAINT "newsletter_managers_newsletter_id_fkey" FOREIGN KEY ("newsletter_id") REFERENCES "newsletters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "newsletter_managers" ADD CONSTRAINT "newsletter_managers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "newsletter_subscribers" ADD CONSTRAINT "newsletter_subscribers_newsletter_id_fkey" FOREIGN KEY ("newsletter_id") REFERENCES "newsletters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "newsletter_messages" ADD CONSTRAINT "newsletter_messages_newsletter_id_fkey" FOREIGN KEY ("newsletter_id") REFERENCES "newsletters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "newsletter_messages" ADD CONSTRAINT "newsletter_messages_sent_by_user_id_fkey" FOREIGN KEY ("sent_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_items" ADD CONSTRAINT "program_items_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_published_days" ADD CONSTRAINT "program_published_days_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "event_managers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chores" ADD CONSTRAINT "chores_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chore_slots" ADD CONSTRAINT "chore_slots_chore_id_fkey" FOREIGN KEY ("chore_id") REFERENCES "chores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chore_assignments" ADD CONSTRAINT "chore_assignments_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chore_assignments" ADD CONSTRAINT "chore_assignments_chore_id_fkey" FOREIGN KEY ("chore_id") REFERENCES "chores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chore_assignments" ADD CONSTRAINT "chore_assignments_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "chore_slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chore_assignment_members" ADD CONSTRAINT "chore_assignment_members_chore_assignment_id_fkey" FOREIGN KEY ("chore_assignment_id") REFERENCES "chore_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chore_assignment_members" ADD CONSTRAINT "chore_assignment_members_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_retention_states" ADD CONSTRAINT "event_retention_states_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_retention_states" ADD CONSTRAINT "event_retention_states_postponed_by_id_fkey" FOREIGN KEY ("postponed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
