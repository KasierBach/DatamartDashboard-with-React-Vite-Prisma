-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "edited_at" TIMESTAMP(3),
ADD COLUMN     "is_edited" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_recalled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "message_deletes" (
    "id" SERIAL NOT NULL,
    "message_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "deleted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_deletes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "message_deletes_message_id_user_id_key" ON "message_deletes"("message_id", "user_id");

-- AddForeignKey
ALTER TABLE "message_deletes" ADD CONSTRAINT "message_deletes_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
