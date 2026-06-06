# Chess Club Management Platform

A full-stack web application for **chess clubs that run in-person lessons** — managing locations, coaches, classroom groups, homework puzzles, student progress, and notice boards, backed by an internal, coach-only lesson library. Built as a **personal side project for fun** by a data engineer who wanted to build something outside the data world.

> This is a private management tool, **not** a public learning site. There are no anonymous visitors, no public blog, and no consumer-facing content. It started life as a public learning platform and was deliberately pivoted to a club-management tool — the old public modules (blog, public lesson hub, tags, search, bookmarks, comments, personal playlists, the Collaborator role) have been removed.

---

## What It Does

A club operates from one or more physical **locations**. Each location runs **classroom groups** of students led by **coaches**. Coaches assign ordered **playlists** of lessons, set **puzzles/homework**, review student submissions, track **progress**, and post to a per-location **notice board**. Lessons live in a shared, coach-only **library** that is reused across classrooms — never surfaced publicly.

### User Roles
| Role | Assigned by | Permissions |
|---|---|---|
| **Admin** | Seeded | Full platform control; restore/hard-delete; user management |
| **Club Admin** | Global Admin | Manage one club's locations and coaches |
| **Coach** | Club Admin | Own classroom groups, playlists, puzzles, notices at assigned locations |
| **Student** (Member) | Self-register / invite | Join a classroom by invite code; see only their own group's materials |

> A **Parent** role (read-only access to a child's progress) is planned but not yet implemented.

### Key Features
- **Clubs** — top-level tenant; each club owns its locations, coaches, and students
- **Locations** — physical venues with address/schedule visibility controls
- **Classroom groups** — age-bracketed or named groups, joined via invite code
- **Classroom playlists** — ordered sets of library lessons assigned to a group
- **Classroom lessons** — private, rich-text lessons scoped to a single classroom
- **Puzzles / Homework** — assigned exercises with student submission and coach review/feedback
- **Progress tracking** — per-student lesson completion across a classroom's playlists
- **Location notice board** — coach announcements, with a substitute-coach approval workflow and auto-expiry
- **Internal lesson library** — coach-only reusable lessons with diagrams, variations, FEN/PGN
- **Soft delete + restore** for shared content (see below)
- Drag-and-drop chess board editor (FEN and PGN input), clickable variations panel
- JWT auth (access + refresh), account lockout, CSRF protection, rate limiting
- Scheduled background jobs (notice expiry, refresh-token purge) via `node-cron`
- Responsive, mobile-friendly UI

### Soft Delete & Data Safety
Deleting shared content (`Lesson`, `Classroom`, `User`) is **reversible by default**. Instead of a hard cascade — which previously wiped a lesson out of every classroom playlist and erased every student's progress record — a delete now sets a `deletedAt` timestamp and the row is hidden from all normal reads. Nested content (playlist links, `LessonProgress`) is preserved.

- **Soft delete** — the default `DELETE` for lessons, classrooms, and users.
- **Restore** — admin-only, for lessons and classrooms.
- **Hard delete** — admin-only, explicit, irreversible (cascades) — for genuine data removal / GDPR erasure.
- A soft-deleted user can no longer log in or use an existing token.

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + TypeScript** | Runtime and type safety |
| **Express.js** | HTTP server and routing |
| **PostgreSQL** | Primary database |
| **Prisma ORM** | Schema, migrations, queries |
| **JWT** | Authentication (access + refresh tokens) |
| **Zod** | Runtime input validation |
| **Multer** | File uploads |
| **Helmet + CORS** | Security headers |
| **express-rate-limit** | Rate limiting |
| **node-cron** | Scheduled background jobs |
| **pino** | Structured logging |
| **bcryptjs** | Password hashing |
| **Jest + Supertest** | Integration tests |

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 14** | React framework (App Router) |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Styling |
| **Tiptap** | Rich text editor |
| **react-chessboard** | Interactive and display chess boards |
| **chess.js** | Move validation and FEN/PGN logic |

### Infrastructure
| Technology | Purpose |
|---|---|
| **Docker Compose** | Local PostgreSQL setup |
| **pnpm** | Package manager (workspaces) |

---

## Project Structure

```
chess-learning-platform/
├── backend/                    Node.js + Express API (TypeScript)
│   ├── src/
│   │   ├── config/            App setup, Prisma client, JWT, mailer, logger
│   │   ├── middleware/        Auth (JWT), RBAC, CSRF, upload, error handling
│   │   ├── policy/            Central authorization: can() decision table + async guards
│   │   ├── schemas/           Zod input-validation schemas
│   │   ├── jobs/              node-cron background jobs (notice expiry, token purge)
│   │   ├── modules/           Feature modules (routes → controller → service):
│   │   │   ├── auth/          Register, login, refresh, logout, password change
│   │   │   ├── users/         Admin user management + soft/hard delete
│   │   │   ├── lessons/       Internal lesson library + soft delete/restore
│   │   │   ├── categories/    Categories and difficulty levels
│   │   │   ├── classrooms/    Groups, playlists, puzzles, progress + soft delete/restore
│   │   │   ├── locations/     Venues, coaches, notice board
│   │   │   ├── club-admin/    Coach promotion/demotion by a Club Admin
│   │   │   ├── profile/       Own profile + avatar
│   │   │   ├── uploads/       Image uploads
│   │   │   └── admin/         Dashboard stats, club CRUD, role assignment
│   │   ├── utils/             Pagination, HTML sanitize, helpers
│   │   └── tests/             Jest + Supertest integration tests
│   └── prisma/
│       ├── schema.prisma      Database schema (source of truth)
│       ├── seed.ts            Seeds roles, categories, levels, admin (env-driven)
│       └── migrations/        SQL migration history
│
├── frontend/                  Next.js 14 + Tailwind CSS
└── docker-compose.yml         PostgreSQL for local development
```

---

## Local Setup

### Prerequisites
- **Node.js v20 LTS** — [nodejs.org](https://nodejs.org)
- **pnpm** — `npm install -g pnpm`
- **PostgreSQL** — [postgresql.org](https://www.postgresql.org/download/) or via Docker

### 1. Backend

```bash
cd backend
pnpm install
cp .env.example .env
```

Edit `.env` with your own values (the file ships with placeholders only — never commit real secrets):

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/chess_platform"
JWT_ACCESS_SECRET="any-long-random-string-32-chars"
JWT_REFRESH_SECRET="a-different-long-random-string"
PORT=4000
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"

# Required to seed the initial admin; if unset, admin seeding is skipped
SEED_ADMIN_EMAIL=you@example.com
SEED_ADMIN_PASSWORD=choose-a-strong-password
```

Apply migrations and seed:

```bash
pnpm prisma migrate deploy   # apply the migration history
pnpm db:seed                 # roles, categories, levels, admin user
```

> **Schema changes** use `pnpm db:migrate` (`prisma migrate dev --name <descriptive-name>`). The project standard is `migrate`, **not** `db push`.

### 2. Frontend

```bash
cd frontend
pnpm install
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

### 3. Run both servers

```bash
# Terminal 1 — backend
cd backend && pnpm dev

# Terminal 2 — frontend
cd frontend && pnpm dev
```

Open **http://localhost:3000**

### Tests

```bash
cd backend
pnpm test     # Jest + Supertest (uses TEST_DATABASE_URL)
pnpm build    # type-check / compile
```

---

## Club & Location Model (Overview)

```
Club: "Chess Knights"
 ├── Location: Springfield Primary School
 │    ├── Group: Under 8s         (invite code: ABC123)
 │    └── Group: Year 5 Beginners (invite code: XYZ789)
 └── Location: Riverside Community Hall
      └── Group: Advanced U12s    (invite code: DEF456)
```

1. Global Admin creates a club and assigns a **Club Admin**
2. Club Admin creates locations and promotes users to **Coach**, assigning them to locations
3. Coaches create classroom groups, assign playlists, set puzzles, and post notices
4. A substitute coach can post a pending notice to another location — the assigned coach has a window to approve it, or it auto-expires
5. Students join via invite code and see only their own group

---

## API Overview

All routes are prefixed with `/api/v1`. Mounted route groups:
`auth`, `users`, `lessons`, `categories`, `uploads`, `admin`, `profile`, `classrooms`, `locations`, `club-admin`.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` · `/auth/login` · `/auth/refresh` | Auth (rate-limited) |
| `GET` | `/lessons` · `/lessons/:id` | Lesson library (coach/admin) |
| `POST` | `/lessons` | Create lesson (coach/club_admin/admin) |
| `DELETE` | `/lessons/:id` | Soft delete (admin) |
| `GET` | `/lessons/deleted` | List soft-deleted lessons (admin) |
| `POST` | `/lessons/:id/restore` | Restore a soft-deleted lesson (admin) |
| `DELETE` | `/lessons/:id/hard` | Permanent delete (admin) |
| `GET`/`POST` | `/classrooms` | List my classrooms / create a group |
| `DELETE` | `/classrooms/:id` | Soft delete (owner or admin) |
| `POST` | `/classrooms/:id/restore` · `DELETE /classrooms/:id/hard` | Restore / permanent delete (admin) |
| `POST` | `/classrooms/join` | Join a group by invite code |
| `GET`/`POST` | `/classrooms/:id/playlists` · `/.../puzzles` | Playlists and puzzles |
| `GET`/`POST` | `/locations` · `/locations/:id/notices` | Venues and notice board |
| `GET`/`POST` | `/club-admin/coaches` · `/club-admin/users/:id/promote` | Coach management (club_admin) |
| `GET`/`POST` | `/admin/clubs` · `/admin/stats` · `/admin/classrooms/deleted` | Admin: clubs, stats, deleted classrooms |
| `GET`/`DELETE` | `/users` · `/users/deleted` · `/users/:id` · `/users/:id/hard` | Admin user management |

---

## About

Built by a **data engineer** as a fun side project — an excuse to build a full-stack TypeScript app from scratch and learn the Node.js ecosystem properly. Chess was the chosen domain because it has a nice structured data model and interesting UI challenges (interactive boards, notation formats, position management).

No frameworks were hurt in the making of this project. (Except maybe pnpm, which was installed four times.)

---

## License

MIT
