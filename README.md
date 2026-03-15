# Chess Learning Platform

A full-stack web application for learning chess — structured lessons, a blog system, and a role-based content management system. Built as a **personal side project for fun** by a data engineer who wanted to build something outside the data world.

> This is not a production product — it's an exploratory project to learn full-stack Node.js/TypeScript development while building something chess-related. Feedback and contributions welcome!

---

## What It Does

The platform lets chess learners study through organized content, and lets admins/contributors publish lessons and blog posts with interactive chess boards.

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
| Role | Permissions |
|---|---|
| **User** | Read published lessons and blog posts |
| **Collaborator** | Submit lessons and blog posts for review |
| **Admin** | Full control — create, edit, approve, manage users |

### Key Features
- Structured chess lessons with rich text, images, and interactive chess boards
- Blog system with approval workflow (collaborators submit → admin approves)
- Role-based access control (User / Collaborator / Admin)
- Drag-and-drop chess board editor — set up any position by moving pieces
- FEN and PGN notation support — paste either format into the board editor
- Two-column layout on lesson/blog pages — content on the left, chess board on the right
- Clickable variations panel — switch between position variations on published pages
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

The platform is **feature-complete for the core use case**. Here's what's built and working:

### Done
- [x] Full authentication system (register, login, refresh tokens, logout)
- [x] Role-based access control (User / Collaborator / Admin)
- [x] Lesson system with categories and difficulty levels
- [x] Blog system with approval workflow
- [x] Rich text editor with image support
- [x] Interactive drag-and-drop chess board editor (FEN + PGN input)
- [x] Published lesson/blog pages with static chess board and variations
- [x] Two-column layout — text left, board right (mobile stacks board first)
- [x] Admin dashboard: lessons, blog, users, approvals, categories
- [x] Collaborator dashboard: create lessons/posts, view submission status
- [x] Tag system for blog posts
- [x] Rate limiting on auth routes
- [x] File upload for images
- [x] SEO-friendly slugs
- [x] Docker Compose for local database

### Planned / In Progress
- [ ] User progress tracking (mark lessons complete)
- [ ] Search across lessons and blog posts
- [ ] Account lockout after failed login attempts
- [ ] Password change with token revocation
- [ ] Email notifications on approval/rejection
- [ ] Reading time estimates
- [ ] Breadcrumb navigation on all content pages

---

## Project Structure

```
chess-learning-platform/
├── backend/                    Node.js + Express API (TypeScript)
│   ├── src/
│   │   ├── config/            App setup, Prisma client, JWT config
│   │   ├── middleware/        Auth (JWT), RBAC, file upload, error handling
│   │   ├── modules/           Feature modules:
│   │   │   ├── auth/          Register, login, refresh, logout
│   │   │   ├── users/         User management (admin)
│   │   │   ├── lessons/       Lesson CRUD + approval
│   │   │   ├── blog/          Blog post CRUD + approval
│   │   │   ├── categories/    Categories and difficulty levels
│   │   │   ├── tags/          Blog post tags
│   │   │   └── admin/         Dashboard stats and pending submissions
│   │   ├── utils/             Slug, pagination, response helpers
│   │   └── tests/             Jest + Supertest integration tests
│   └── prisma/
│       ├── schema.prisma      Database schema (source of truth)
│       ├── seed.ts            Seeds roles, categories, levels, admin user
│       └── migrations/        SQL migration history
│
├── frontend/                  Next.js 14 + Tailwind CSS
│   └── src/
│       ├── app/
│       │   ├── (public)/      Home, /learn, /blog, login, register
│       │   └── (dashboard)/   /admin/** and /collaborator/**
│       ├── components/
│       │   ├── chess/         InteractiveBoard, LessonSidePanel, VariationEditor
│       │   ├── editor/        RichTextEditor (Tiptap)
│       │   ├── layout/        Navbar, Sidebar, Footer
│       │   └── ui/            Badge, LoadingSpinner, etc.
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

Run migrations and seed:

```bash
pnpm db:migrate
pnpm db:seed
```

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

## API Overview

All routes are prefixed with `/api/v1`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register new account |
| `POST` | `/auth/login` | Login, returns JWT tokens |
| `GET` | `/categories` | List categories and difficulty levels |
| `GET` | `/lessons` | List published lessons |
| `GET` | `/lessons/:slug` | Get single lesson |
| `POST` | `/lessons` | Create lesson (collaborator/admin) |
| `PATCH` | `/lessons/:id/approve` | Approve lesson (admin) |
| `GET` | `/blog` | List published blog posts |
| `GET` | `/blog/:slug` | Get single blog post |
| `POST` | `/blog` | Create blog post (collaborator/admin) |
| `PATCH` | `/blog/:id/approve` | Approve post (admin) |
| `GET` | `/admin/stats` | Dashboard stats (admin) |
| `GET` | `/admin/pending` | Pending submissions (admin) |

---

## About

Built by a **data engineer** as a fun side project — an excuse to build a full-stack TypeScript app from scratch and learn the Node.js ecosystem properly. Chess was the chosen domain because it has a nice structured data model and interesting UI challenges (interactive boards, notation formats, position management).

No frameworks were hurt in the making of this project. (Except maybe pnpm, which was installed four times.)

---

## License

MIT
