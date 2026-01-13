-- AlterTable
ALTER TABLE "conversation_members" ADD COLUMN     "is_hidden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'member';

-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "group_avatar" TEXT,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'direct';

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "forwarded_from" INTEGER,
ADD COLUMN     "reply_to_id" INTEGER,
ADD COLUMN     "voice_duration" INTEGER,
ADD COLUMN     "voice_url" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatar" TEXT;

-- CreateTable
CREATE TABLE "message_reactions" (
    "id" SERIAL NOT NULL,
    "message_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "emoji" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pinned_messages" (
    "id" SERIAL NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "message_id" INTEGER NOT NULL,
    "pinned_by" INTEGER NOT NULL,
    "pinned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pinned_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_details" (
    "id" SERIAL NOT NULL,
    "student_fact_id" TEXT,
    "student_uid" TEXT,
    "school_uid" TEXT,
    "record_id" TEXT,
    "province_id" INTEGER,
    "school_type_id" INTEGER,
    "school_level_id" INTEGER,
    "performance_category_id" INTEGER,
    "year" INTEGER,
    "grade" TEXT,
    "gpa_overall" DOUBLE PRECISION,
    "attendance_rate" DOUBLE PRECISION,
    "test_math" DOUBLE PRECISION,
    "test_literature" DOUBLE PRECISION,
    "test_average" DOUBLE PRECISION,
    "composite_score" DOUBLE PRECISION,
    "school_name" TEXT,
    "province_name" TEXT,
    "level_name" TEXT,
    "type_name" TEXT,
    "school_founding_year" INTEGER,
    "school_age" INTEGER,
    "academic_tier" TEXT,

    CONSTRAINT "student_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "province_summary" (
    "id" SERIAL NOT NULL,
    "province" TEXT,
    "level" TEXT,
    "total_students" INTEGER,
    "total_schools" INTEGER,
    "avg_gpa" DOUBLE PRECISION,
    "avg_attendance" DOUBLE PRECISION,
    "avg_test_score" DOUBLE PRECISION,
    "avg_composite_score" DOUBLE PRECISION,
    "excellent_count" INTEGER,
    "good_count" INTEGER,
    "average_count" INTEGER,
    "below_average_count" INTEGER,

    CONSTRAINT "province_summary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_summary" (
    "id" SERIAL NOT NULL,
    "school_id" TEXT,
    "school_name" TEXT,
    "province" TEXT,
    "level" TEXT,
    "type" TEXT,
    "founding_year" INTEGER,
    "school_age" INTEGER,
    "total_students" INTEGER,
    "avg_gpa" DOUBLE PRECISION,
    "avg_attendance" DOUBLE PRECISION,
    "avg_test_math" DOUBLE PRECISION,
    "avg_test_literature" DOUBLE PRECISION,
    "avg_composite_score" DOUBLE PRECISION,
    "top_performer_count" INTEGER,

    CONSTRAINT "school_summary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "message_reactions_message_id_user_id_emoji_key" ON "message_reactions"("message_id", "user_id", "emoji");

-- CreateIndex
CREATE UNIQUE INDEX "pinned_messages_conversation_id_message_id_key" ON "pinned_messages"("conversation_id", "message_id");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_reply_to_id_fkey" FOREIGN KEY ("reply_to_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pinned_messages" ADD CONSTRAINT "pinned_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pinned_messages" ADD CONSTRAINT "pinned_messages_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
