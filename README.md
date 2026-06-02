# ProjectEVAL

A faculty evaluation system built with Vue 3 and Express.js, backed by Supabase (PostgreSQL).

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vue 3 (Composition API, `<script setup>`) |
| Build Tool | Vite 7 |
| Routing | Vue Router 4 |
| Charts | Chart.js 4 + vue-chartjs 5 |
| Backend | Express.js 4 |
| Database | PostgreSQL via Supabase |
| Auth | JWT + bcryptjs |
| AI | Google Gemini API (sentiment analysis) |
| Email | Nodemailer (SMTP) |
| Testing | Vitest + jsdom |

## Prerequisites

- **Node.js** >= 18.0
- **npm** >= 9
- A **Supabase** project (free tier works)
- (Optional) A **Gmail app password** for email verification
- (Optional) A **Gemini API key** for sentiment analysis

## Setup

### 1. Clone and install dependencies

```bash
# Install frontend dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..
```

### 2. Configure environment variables

Copy the example env file and fill in your credentials:

```bash
cp server/.env.example server/.env
```

Edit `server/.env` with your Supabase project details:

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key (bypasses RLS) |
| `DATABASE_URL` | PostgreSQL connection string from Supabase (pooler) |
| `JWT_SECRET` | A random secret string for signing tokens |
| `SMTP_USER` | Gmail address for sending verification emails |
| `SMTP_PASS` | Gmail app password (not your regular password) |
| `GEMINI_API_KEY` | Google Gemini API key (for sentiment analysis) |

The frontend `.env` file at the project root has one variable:

```
VITE_API_URL=http://localhost:3000/api
```

### 3. Set up the database

1. Open your Supabase project's **SQL Editor**
2. Copy and paste the contents of `server/src/database/schema.sql` and run it
3. (Optional) Run seed files if needed:
   - `seed_users.sql` — creates sample users
   - `seed_additional_teachers.sql` — sample teachers
   - `seed_evaluation_content.sql` — sample questions & headers

### 4. Run the application

```bash
# From the project root — starts both frontend and backend
npm run dev
```

This runs:
- **Frontend** at `http://localhost:5173`
- **Backend** at `http://localhost:3000`

Alternatively, start them separately:

```bash
# Terminal 1 — backend
cd server
npm run dev

# Terminal 2 — frontend
npm run dev
```

### 5. Build for production

```bash
npm run build
```

Output goes to the `dist/` folder.

## Project Structure

```
├── src/                    # Vue 3 frontend
│   ├── components/         # Reusable components
│   ├── composables/        # Vue composables (useApi, useAuth)
│   ├── layouts/            # Layout components (Admin, Teacher, Student, Auth)
│   ├── router/             # Vue Router configuration
│   ├── utils/              # Utilities (API client, auth helpers)
│   ├── views/              # Page views
│   │   ├── admin/          # Admin dashboard, scheduler, file upload, questions
│   │   ├── teacher/        # Teacher dashboard
│   │   ├── student/        # Student dashboard
│   │   └── evaluations/    # Evaluation forms and results
│   └── style.css           # Global design system (tokens, base styles)
├── server/                 # Express.js backend
│   └── src/
│       ├── config/         # DB connection, env config
│       ├── controllers/    # Route handlers
│       ├── database/       # Schema & seed SQL files
│       ├── middleware/     # Auth, validation
│       ├── routes/         # Express route definitions
│       └── utils/          # Email, AI helpers
├── tests/                  # Frontend tests (Vitest)
└── package.json
```

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start both frontend and backend concurrently |
| `npm run build` | Build frontend for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run frontend tests |
| `npm run test:watch` | Run tests in watch mode |
| `cd server && npm run dev` | Start backend only |
| `cd server && npm run start` | Start backend in production mode |
