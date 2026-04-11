# Chess Learning Platform

A full-stack web application for learning chess — structured lessons, a blog system, classroom management for chess clubs, and a role-based content management system. Built as a **personal side project for fun** by a data engineer who wanted to build something outside the data world.

> This is not a production product — it's an exploratory project to learn full-stack Node.js/TypeScript development while building something chess-related. Feedback and contributions welcome!

---

## What It Does

The platform lets chess learners study through organized content, lets admins and contributors publish lessons and blog posts, and supports **chess clubs running lessons at multiple physical locations** — each with their own coaches, student groups, and notice boards.

### Learning Structure
```
Openings
    Beginner / Intermediate / Advanced
Concepts
    Beginner / Intermediate / Advanced
Endgames
    Beginner / Intermediate / Advanced
```

### User Roles
| Role | Display name | Assigned by | Permissions |
|---|---|---|---|
| **Admin** | Admin | Seeded | Full platform control |
| **Club Admin** | _[Club]_ Admin | Global Admin only | Manage one club's locations, coaches, lessons, blog |
| **Collaborator** | Collaborator | Self-register | Submit lessons and blog posts for review |
| **Coach** | _[Club]_ Coach | Club Admin | Manage assigned locations and classroom groups |
| **User** | Member | Self-register | Read published lessons, blog posts, and class materials |

> Role display names are scoped to the club: e.g. "Chess Knights Admin" and "Chess Knights Coach".

### Key Features
- Structured chess lessons with rich text, images, and interactive chess boards
- Blog system with approval workflow (collaborators submit → admin approves)
- **Chess club model** — named clubs (e.g. "Chess Knights") own locations and coaches
- **Locations** — physical venues (schools, community halls) with address/schedule visibility controls
- **Classroom groups** — multiple age-bracketed or skill-level groups at each location
- **Location Notice Board** — shared bulletin board visible to all students across a location
- **Substitute notice workflow** — substitute coaches submit notices for approval (48 h window or auto-expires)
- **Group privacy** — students see only their own group, not others at the same location
- Drag-and-drop chess board editor — set up any position by moving pieces
- FEN and PGN notation support — paste either format into the board editor
- Two-column layout on lesson/blog pages — content on the left, chess board on the right
- Clickable variations panel — switch between position variations on published pages
- Classroom puzzles with student submission and review workflow
- Custom classroom lessons (private, rich-text, with optional end-of-lesson puzzles)
- Rate limiting on auth endpoints
- JWT authentication with refresh tokens
- SEO-friendly slugs for all content
- Responsive design (mobile friendly)

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + TypeScript** | Runtime and type safety |
| **Express.js** | HTTP server and routing |
| **PostgreSQL** | Primary database |
| **Prisma ORM** | Database schema, migrations, queries |
| **JWT** | Authentication (access + refresh tokens) |
| **Zod** | Runtime input validation |
| **Multer** | File uploads |
| **Helmet + CORS** | Security headers |
| **express-rate-limit** | Rate limiting |
| **pino** | Structured logging |
| **bcryptjs** | Password hashing |
| **Jest + Supertest** | Integration tests |

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 14** | React framework (App Router) |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Styling |
| **Tiptap** | Rich text editor (lessons and blog posts) |
| **react-chessboard** | Interactive and display chess boards |
| **chess.js** | Chess move validation and FEN/PGN logic |

### Infrastructure
| Technology | Purpose |
|---|---|
| **Docker Compose** | Local PostgreSQL setup |
| **pnpm** | Package manager (workspaces) |

---

## Current Status

### Done
- [x] Full authentication system (register, login, refresh tokens, logout)
- [x] Role-based access control (5 roles with scoped permissions)
- [x] Lesson system with categories and difficulty levels
- [x] Blog system with approval workflow
- [x] Rich text editor with image support
- [x] Interactive drag-and-drop chess board editor (FEN + PGN input)
- [x] Published lesson/blog pages with static chess board and variations
- [x] Two-column layout — text left, board right (mobile stacks board first)
- [x] Admin dashboard: lessons, blog, users, approvals, categories, clubs
- [x] Collaborator dashboard: create lessons/posts, view submission status
- [x] Club Admin dashboard: manage locations, coaches, club overview
- [x] Coach dashboard: view assigned locations and groups
- [x] **Club model** — global admin creates clubs; assigns Club Admins scoped to one club
- [x] **Locations** — venues with address/schedule visibility toggles (school policy support)
- [x] **Classroom groups** — multiple groups per location (age range or custom name)
- [x] **Location Notice Board** — coaches post notices; visible to all students at that location
- [x] **Substitute notices** — cross-coach posting with 48 h approval window
- [x] Classroom puzzles with solution submission and review
- [x] Custom classroom lessons (private, rich-text)
- [x] Student progress tracking per playlist
- [x] Invite-code system for students to join classrooms
- [x] Tag system for blog posts
- [x] Rate limiting on auth routes
- [x] File upload for images
- [x] SEO-friendly slugs
- [x] Docker Compose for local database
- [x] Email notifications on approval/rejection (nodemailer, SMTP configurable)
- [x] Password change with token revocation (increments `tokenVersion`, invalidates all refresh tokens)
- [x] Reading time estimates on lessons and blog posts
- [x] Account lockout after 5 failed login attempts (30-minute lockout, persisted in DB)
- [x] Security hardening: Content-Security-Policy + HSTS via Helmet, HTML-escaped email bodies, path-traversal protection on avatar deletion, MIME-derived file extensions on upload

### Planned / Considering
- [ ] Full-text search across lessons and blog posts
- [ ] Comment / discussion threads on lessons

---

## Project Structure

```
chess-learning-platform/
├── backend/                    Node.js + Express API (TypeScript)
│   ├── src/
│   │   ├── config/            App setup, Prisma client, JWT config
│   │   ├── middleware/        Auth (JWT), RBAC, file upload, CSRF, error handling
│   │   ├── modules/           Feature modules:
│   │   │   ├── auth/          Register, login, refresh, logout
│   │   │   ├── users/         User management
│   │   │   ├── lessons/       Lesson CRUD + approval
│   │   │   ├── blog/          Blog post CRUD + approval
│   │   │   ├── classrooms/    Classroom groups, playlists, puzzles, progress
│   │   │   ├── locations/     Venues, coaches, notice board
│   │   │   ├── club-admin/    Coach promotion/demotion by Club Admin
│   │   │   ├── categories/    Categories and difficulty levels
│   │   │   ├── tags/          Blog post tags
│   │   │   └── admin/         Dashboard stats, pending submissions, club CRUD
│   │   └── utils/             Slug, pagination, location access helpers
│   └── prisma/
│       ├── schema.prisma      Database schema (source of truth)
│       ├── seed.ts            Seeds roles, categories, levels, admin user
│       └── migrations/        SQL migration history
│
├── frontend/                  Next.js 14 + Tailwind CSS
│   └── src/
│       ├── app/
│       │   ├── (public)/      Home, /learn, /blog, /classrooms, login, register
│       │   └── (dashboard)/
│       │       ├── admin/     Global admin pages (lessons, users, clubs, approvals)
│       │       ├── club-admin/  Club Admin dashboard + coach management
│       │       └── collaborator/  Lessons, blog, classrooms, locations
│       ├── components/
│       │   ├── chess/         InteractiveBoard, PuzzleBoard, BoardSetupEditor
│       │   ├── classrooms/    PlaylistCard, StudentProgress, PuzzleForms
│       │   ├── locations/     LocationCard, LocationNoticeList, LocationNoticeForm
│       │   ├── club-admin/    CoachUserRow
│       │   ├── editor/        RichTextEditor (Tiptap)
│       │   ├── layout/        Navbar, DashboardSidebar, Footer
│       │   └── ui/            Badge, LoadingSpinner, ErrorBoundary, etc.
│       └── lib/               API client, auth context, TypeScript types
│
└── docker-compose.yml         PostgreSQL 16 for local development
```

---

## Local Setup

### Prerequisites

- **Node.js v20 LTS** — [nodejs.org](https://nodejs.org)
- **pnpm** — `npm install -g pnpm`
- **PostgreSQL 16** — [postgresql.org](https://www.postgresql.org/download/) or via Docker

### 1. Clone and set up the backend

```bash
cd backend
pnpm install
cp .env.example .env
```

Edit `.env` with your PostgreSQL credentials:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/chess_platform"
JWT_ACCESS_SECRET="any-long-random-string-32-chars"
JWT_REFRESH_SECRET="a-different-long-random-string"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"
PORT=4000
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

Apply the schema and seed:

```bash
pnpm prisma db push
pnpm db:seed
```

> **Note:** Use `db push` rather than `migrate dev` — the project uses `db push` to avoid shadow-database drift in local development.

Seed creates a default admin account — credentials are defined in `backend/prisma/seed.ts`.

### 2. Set up the frontend

```bash
cd frontend
pnpm install
cp .env.local.example .env.local
```

`.env.local` should contain:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

### 3. Run both servers

```bash
# Terminal 1 — backend
cd backend && pnpm dev

# Terminal 2 — frontend
cd frontend && pnpm dev
```

Open **http://localhost:3000**

---

## Club & Location Model (Overview)

The platform supports one or more named chess clubs. Each club can run lessons at multiple physical locations (e.g. schools, community halls).

```
Club: "Chess Knights"
 ├── Location: Springfield Primary School
 │    ├── Group: Under 8s         (invite code: ABC123)
 │    └── Group: Year 5 Beginners (invite code: XYZ789)
 └── Location: Riverside Community Hall
      └── Group: Advanced U12s    (invite code: DEF456)
```

**Permission flow:**
1. Global Admin creates a club and assigns a **Club Admin** (displays as "Chess Knights Admin")
2. Club Admin creates locations and promotes users to **Coach** (displays as "Chess Knights Coach")
3. Club Admin assigns coaches to specific locations
4. Coaches create classroom groups at their location (with optional age brackets)
5. Coaches post notices to the **Location Board** — visible to all students at that location
6. A substitute coach can post a pending notice to another location — the assigned coach has 48 h to approve it, or it auto-expires
7. Students join via invite code and see only their own group

---

## API Overview

All routes are prefixed with `/api/v1`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register new account |
| `POST` | `/auth/login` | Login, returns JWT tokens |
| `GET` | `/categories` | List categories and difficulty levels |
| `GET` | `/lessons` | List published lessons |
| `GET` | `/lessons/:slug` | Get single lesson |
| `POST` | `/lessons` | Create lesson (collaborator / club_admin / admin) |
| `PATCH` | `/lessons/:id/approve` | Approve lesson (admin) |
| `GET` | `/blog` | List published blog posts |
| `GET` | `/blog/:slug` | Get single blog post |
| `POST` | `/blog` | Create blog post (collaborator / club_admin / admin) |
| `GET` | `/classrooms` | My classrooms |
| `POST` | `/classrooms` | Create classroom group (collaborator / club_admin / coach / admin) |
| `GET` | `/locations` | My club's locations |
| `POST` | `/locations` | Create location (club_admin / admin) |
| `GET` | `/locations/:id/notices` | Location notice board |
| `POST` | `/locations/:id/notices` | Post notice (auto-pending for substitute coaches) |
| `POST` | `/locations/:id/notices/:nid/approve` | Approve pending notice |
| `GET` | `/club-admin/coaches` | List club's coaches (club_admin) |
| `POST` | `/club-admin/users/:id/promote` | Promote user to coach (club_admin) |
| `GET` | `/admin/clubs` | List all clubs (admin) |
| `POST` | `/admin/clubs` | Create club (admin) |
| `PATCH` | `/admin/users/:id/role` | Set user role + club assignment (admin) |
| `GET` | `/admin/stats` | Dashboard stats (admin) |

---

## About

Built by a **data engineer** as a fun side project — an excuse to build a full-stack TypeScript app from scratch and learn the Node.js ecosystem properly. Chess was the chosen domain because it has a nice structured data model and interesting UI challenges (interactive boards, notation formats, position management).

No frameworks were hurt in the making of this project. (Except maybe pnpm, which was installed four times.)

---

## License

MIT
