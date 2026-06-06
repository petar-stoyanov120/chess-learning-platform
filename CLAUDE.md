# Chess Club Management Platform

## Purpose

This is a **private management tool for Bulgarian chess clubs** running in-person lessons. It is not a public learning platform. There are no anonymous visitors, no public content, and no consumer-facing features.

Roles: **Admin**, **Club Admin**, **Coach**, **Student**. A **Parent** role will be added later (read-only access to their child's progress).

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express + TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Package manager | pnpm workspaces |

## Architecture Conventions

- Backend feature code lives under `backend/src/modules/<feature>/`. Each module follows the **routes → controller → service** triplet. No exceptions.
- Input validation uses **Zod** schemas (in `backend/src/schemas/`).
- Keep this pattern when adding new modules — do not introduce fat controllers or inline service logic.

## What Is Being Removed

The following were part of the old public learning platform and **must not be rebuilt or referenced**:

- Public blog and blog approval pipeline
- Public "Learn" hub / lesson discovery pages
- The **Collaborator** role and the submission/approval workflow it implies
- Lesson ratings, bookmarks, personal playlists
- Tags and the tagging system
- Public search
- Ads and free-tier access limits
- Comments/discussion on lessons

Corresponding modules to delete or gut: `blog`, `bookmarks`, `playlists`, `comments`, `search`, `tags`.

## What Is Kept — The Core Domain

These are the areas that matter:

- **Clubs** — top-level tenant; each club has its own admins, coaches, and students
- **Locations** — physical venues a club operates from
- **Classrooms** — a scheduled group of students meeting at a location
- **Classroom playlists** — ordered sets of lessons assigned to a classroom
- **Classroom lessons** — individual lesson assignments within a playlist
- **Puzzles / Homework** — assigned exercises with student submission and coach review
- **Members** — users with a role inside a specific club (Admin, Club Admin, Coach, Student)
- **Progress** — per-student tracking of lesson completion and puzzle results
- **Notice boards** — announcements scoped to a club or classroom
- **Global lesson library** — lessons remain in the system but are an **internal, coach-only** reusable content library. They are never surfaced publicly.

## Scale & Deployment

Bulgaria-only, single-server deployment. Do **not** add Redis, message queues, worker processes, or any horizontal-scaling infrastructure. Keep operational complexity minimal.

## Scheduled Jobs

Background jobs live in `backend/src/jobs/`. Each job is a standalone async function; `index.ts` schedules them with `node-cron` and starts them from `server.ts` on boot.

Current jobs:

| File | Schedule | Purpose |
|---|---|---|
| `expireNotices.ts` | Every hour | Sets pending `LocationNotice` records past their `expiresAt` to `"expired"` |
| `purgeRefreshTokens.ts` | Daily 02:00 | Deletes `RefreshToken` rows whose `expiresAt` has passed |
| `parentDigest.ts` | Daily 07:00 | **Stub (P3.6)** — weekly digest for parents; fill in when the Parent role is added |

All jobs are wrapped in try/catch; failures are logged via pino and do not crash the process. Do not add Redis, BullMQ, or external worker processes.

## Email

Send email through `sendMail()` exported from `backend/src/config/mailer.ts`. Always `await` the call. `sendMail` never throws — it logs failures and returns `false` when SMTP is unconfigured or the send fails.

## Database Conventions

- Schema changes: always use `prisma migrate dev --name <descriptive-name>`. Never use `prisma db push`.
- Migration names must be descriptive (e.g., `add_notice_board_table`, `rename_classroom_schedule_column`).
- Write a service-level test for every new piece of service logic.
