-- AlterTable
ALTER TABLE "lessons" ADD COLUMN     "view_count" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "last_puzzle_solved_at" TIMESTAMP(3),
ADD COLUMN     "puzzle_streak" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "classrooms" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "invite_code" TEXT NOT NULL,
    "owner_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "tier" TEXT NOT NULL DEFAULT 'free',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classrooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classroom_members" (
    "id" SERIAL NOT NULL,
    "classroom_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "classroom_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classroom_playlists" (
    "id" SERIAL NOT NULL,
    "classroom_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "teacher_intro" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classroom_playlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classroom_playlist_lessons" (
    "id" SERIAL NOT NULL,
    "classroom_playlist_id" INTEGER NOT NULL,
    "lesson_id" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "teacher_note" TEXT,

    CONSTRAINT "classroom_playlist_lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "puzzles" (
    "id" SERIAL NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "fen" TEXT NOT NULL,
    "side_to_move" TEXT NOT NULL,
    "solution" TEXT[],
    "difficulty" INTEGER NOT NULL DEFAULT 3,
    "themes" TEXT[],
    "estimated_rating" INTEGER NOT NULL DEFAULT 1200,
    "featured_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "puzzles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "puzzle_attempts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "puzzle_id" INTEGER NOT NULL,
    "solved" BOOLEAN NOT NULL,
    "tries_count" INTEGER NOT NULL DEFAULT 1,
    "solved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "puzzle_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_ratings" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "lesson_id" INTEGER NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "lesson_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" SERIAL NOT NULL,
    "lesson_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "classrooms_invite_code_key" ON "classrooms"("invite_code");

-- CreateIndex
CREATE INDEX "classrooms_owner_id_idx" ON "classrooms"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "classroom_members_classroom_id_user_id_key" ON "classroom_members"("classroom_id", "user_id");

-- CreateIndex
CREATE INDEX "classroom_playlists_classroom_id_idx" ON "classroom_playlists"("classroom_id");

-- CreateIndex
CREATE UNIQUE INDEX "classroom_playlist_lessons_classroom_playlist_id_lesson_id_key" ON "classroom_playlist_lessons"("classroom_playlist_id", "lesson_id");

-- CreateIndex
CREATE INDEX "puzzles_featured_date_idx" ON "puzzles"("featured_date");

-- CreateIndex
CREATE INDEX "puzzles_difficulty_idx" ON "puzzles"("difficulty");

-- CreateIndex
CREATE UNIQUE INDEX "puzzle_attempts_user_id_puzzle_id_key" ON "puzzle_attempts"("user_id", "puzzle_id");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_ratings_user_id_lesson_id_key" ON "lesson_ratings"("user_id", "lesson_id");

-- CreateIndex
CREATE INDEX "comments_lesson_id_idx" ON "comments"("lesson_id");

-- AddForeignKey
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_members" ADD CONSTRAINT "classroom_members_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_members" ADD CONSTRAINT "classroom_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_playlists" ADD CONSTRAINT "classroom_playlists_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_playlist_lessons" ADD CONSTRAINT "classroom_playlist_lessons_classroom_playlist_id_fkey" FOREIGN KEY ("classroom_playlist_id") REFERENCES "classroom_playlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_playlist_lessons" ADD CONSTRAINT "classroom_playlist_lessons_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "puzzle_attempts" ADD CONSTRAINT "puzzle_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "puzzle_attempts" ADD CONSTRAINT "puzzle_attempts_puzzle_id_fkey" FOREIGN KEY ("puzzle_id") REFERENCES "puzzles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_ratings" ADD CONSTRAINT "lesson_ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_ratings" ADD CONSTRAINT "lesson_ratings_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
