-- AlterTable
ALTER TABLE "classrooms" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "lessons" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "classrooms_deleted_at_idx" ON "classrooms"("deleted_at");

-- CreateIndex
CREATE INDEX "lessons_deleted_at_idx" ON "lessons"("deleted_at");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");
