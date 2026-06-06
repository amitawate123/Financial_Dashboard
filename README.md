# Finance Dashboard — Full Stack

A full-stack finance dashboard with role-based access control. Built as an assessment project demonstrating backend architecture, API design, and frontend integration.

```
finance-dashboard-full/
├── backend/     Node.js + Express + MongoDB REST API
└── frontend/    React + Vite dashboard UI
```

---

## Quick Start (Both Servers)

### 1. Start the Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env — set MONGODB_URI and JWT_SECRET
npm run seed       # Creates 3 demo users + 60 sample transactions
npm run dev        # → http://localhost:3000
# Swagger docs → http://localhost:3000/api-docs
```

### 2. Start the Frontend

```bash
cd frontend
npm install
cp .env.example .env
# VITE_API_URL=http://localhost:3000/api/v1 (default, no change needed)
npm run dev        # → http://localhost:5173
```

### 3. Open the app

Go to **http://localhost:5173** and log in with a demo account:

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Admin | admin@demo.com | password123 | Full access |
| Analyst | analyst@demo.com | password123 | View + create |
| Viewer | viewer@demo.com | password123 | Read only |

---

## Architecture Overview

```
Browser (React)
    │
    │  HTTP + JWT
    ▼
Express API  (/api/v1)
    │
    ├── /auth          Public — login, register, me
    ├── /transactions  RBAC — viewer/analyst/admin
    ├── /dashboard     RBAC — analyst/admin only
    └── /users         RBAC — admin only
    │
    ▼
MongoDB (Mongoose)
    ├── users          Hashed passwords, role, isActive
    └── transactions   Soft-delete, indexed for fast filtering
```

### Request flow

```
Route → authenticate (JWT) → authorize (role) → validate (input) → Controller → Service → Model
```

---

## Role Permissions

| Action | Viewer | Analyst | Admin |
|--------|:------:|:-------:|:-----:|
| View transactions | ✅ | ✅ | ✅ |
| Create transactions | ❌ | ✅ | ✅ |
| Edit / delete transactions | ❌ | ❌ | ✅ |
| View dashboard analytics | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ✅ |

---

## Backend Highlights

- **Layered architecture** — routes → controllers → services → models. No business logic in controllers.
- **JWT auth** with `authenticate` + `authorize(...roles)` composable middleware
- **Soft delete** via Mongoose `pre-find` hook — deleted records invisible everywhere automatically
- **MongoDB aggregation pipelines** for all dashboard analytics
- **express-validator** for request validation with field-level error messages
- **Swagger UI** at `/api-docs` — full interactive API documentation
- **Rate limiting** — 100 req/15 min per IP
- **Jest + Supertest** integration tests for auth and transaction flows

## Frontend Highlights

- **AuthContext** with `can(roles)` helper for clean conditional rendering
- **Axios interceptors** — JWT attachment + auto-redirect on 401
- **Role-aware UI** — nav items, buttons, and modals hidden based on role
- **Recharts** — area chart (monthly trends) + pie chart (category breakdown)
- **Reusable component library** — Button, Input, Card, Modal, Badge, Pagination, etc.
- **Design system** via CSS variables — consistent tokens for color, spacing, radius

---

## Running Tests (Backend)

```bash
cd backend
npm test
```

Tests use a separate `finance_test` MongoDB database, wiped after each suite.

---

## Environment Variables

**Backend** (`backend/.env`):
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/finance_dashboard
JWT_SECRET=change_this_in_production
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

**Frontend** (`frontend/.env`):
```
VITE_API_URL=http://localhost:3000/api/v1
```
