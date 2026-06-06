# Finance Dashboard Backend

A clean, well-structured REST API for a multi-role finance dashboard system. Built with **Node.js**, **Express**, and **MongoDB**.

---

## Features

- **JWT Authentication** — Register, login, and secure all routes with Bearer tokens
- **Role-Based Access Control** — Three roles (Viewer, Analyst, Admin) with enforced permissions per route
- **Financial Records** — Full CRUD for transactions with soft-delete
- **Dashboard Analytics** — Aggregated summaries, category breakdowns, and monthly/weekly trends
- **Filtering & Pagination** — Filter transactions by type, category, date range, and amount; search by keyword
- **Input Validation** — Request-level validation with descriptive error responses
- **Swagger Docs** — Interactive API documentation at `/api-docs`
- **Rate Limiting** — 100 requests per 15 minutes per IP
- **Seed Script** — Populate demo users and transactions instantly

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB (via Mongoose) |
| Auth | JSON Web Tokens (jsonwebtoken) |
| Validation | express-validator |
| Docs | swagger-jsdoc + swagger-ui-express |
| Testing | Jest + Supertest |

---

## Project Structure

```
finance-dashboard/
├── src/
│   ├── app.js                  # Express app entry point
│   ├── config/
│   │   ├── db.js               # MongoDB connection
│   │   └── swagger.js          # Swagger/OpenAPI configuration
│   ├── controllers/            # Route handlers (thin layer — delegates to services)
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── transactionController.js
│   │   └── dashboardController.js
│   ├── middlewares/
│   │   ├── auth.js             # authenticate + authorize middleware
│   │   └── errorHandler.js     # Global error handler, AppError class, validate helper
│   ├── models/
│   │   ├── User.js             # User schema with bcrypt hook
│   │   └── Transaction.js      # Transaction schema with soft-delete pre-hook
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── transactionRoutes.js
│   │   └── dashboardRoutes.js
│   ├── services/               # Business logic lives here
│   │   ├── authService.js
│   │   ├── userService.js
│   │   ├── transactionService.js
│   │   └── dashboardService.js
│   ├── utils/
│   │   └── seed.js             # Demo data seeder
│   └── validations/            # express-validator rule sets
│       ├── authValidation.js
│       └── transactionValidation.js
└── tests/
    ├── auth.test.js
    └── transactions.test.js
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB running locally (or a MongoDB Atlas URI)

### Installation

```bash
git clone <your-repo-url>
cd finance-dashboard
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and a JWT secret
```

### Environment Variables

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/finance_dashboard
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

### Run

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start

# Seed demo data
npm run seed

# Run tests
npm test
```

---

## API Overview

Base URL: `http://localhost:3000/api/v1`

Interactive docs: `http://localhost:3000/api-docs`

### Auth

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/auth/register` | Public | Create account |
| POST | `/auth/login` | Public | Login, receive JWT |
| GET | `/auth/me` | All roles | Get own profile |

### Users

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/users` | Admin | List all users (paginated + search) |
| GET | `/users/:id` | Admin | Get user by ID |
| PATCH | `/users/:id` | Admin / Self | Update user (role/status: admin only) |
| PATCH | `/users/:id/status` | Admin | Activate or deactivate |
| DELETE | `/users/:id` | Admin | Hard delete user |

### Transactions

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/transactions` | All roles | List with filters + pagination |
| GET | `/transactions/:id` | All roles | Get single transaction |
| POST | `/transactions` | Analyst, Admin | Create transaction |
| PATCH | `/transactions/:id` | Admin | Update transaction |
| DELETE | `/transactions/:id` | Admin | Soft-delete transaction |

**Query parameters for GET `/transactions`:**
`page`, `limit`, `type`, `category`, `startDate`, `endDate`, `minAmount`, `maxAmount`, `search`, `sortBy`, `sortOrder`

### Dashboard

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/dashboard/summary` | Analyst, Admin | Income, expenses, net balance |
| GET | `/dashboard/categories` | Analyst, Admin | Totals by category + type |
| GET | `/dashboard/trends/monthly` | Analyst, Admin | 12-month income vs expense |
| GET | `/dashboard/trends/weekly` | Analyst, Admin | Last 6 weeks weekly trends |
| GET | `/dashboard/recent` | Analyst, Admin | Recent activity feed |

---

## Role Permissions Summary

| Action | Viewer | Analyst | Admin |
|--------|--------|---------|-------|
| View transactions | ✅ | ✅ | ✅ |
| Create transactions | ❌ | ✅ | ✅ |
| Update transactions | ❌ | ❌ | ✅ |
| Delete transactions | ❌ | ❌ | ✅ |
| View dashboard analytics | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ✅ |

---

## Demo Credentials (after `npm run seed`)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | password123 |
| Analyst | analyst@demo.com | password123 |
| Viewer | viewer@demo.com | password123 |

---

## Design Decisions & Assumptions

**Soft Delete for Transactions**
Transactions are never permanently removed. Setting `isDeleted: true` preserves financial history for auditing. A Mongoose `pre-find` hook automatically excludes soft-deleted records from all queries.

**Analyst can create, not update/delete**
Analysts are trusted to add new records but modifying or removing existing data is restricted to admins to preserve data integrity.

**Viewers can access the transaction list**
Viewers are assumed to be stakeholders who need read-only visibility into the raw transaction data but not aggregated analytics (which require analyst+ access).

**Services own the business logic**
Controllers are kept thin — they only parse the request and format the response. All business rules, access decisions within a resource, and data operations live in service files.

**User-wise transaction data**
All transactions live in one collection, but every record has a `createdBy` owner. List, dashboard, export, import, file, and socket flows filter by the authenticated user — admins do not see other users' transactions.

**Indexes on Transaction model**
Compound indexes on `createdBy` + `date` (and `type`/`category`) plus `isDeleted` support per-user list and dashboard queries efficiently.

**Rate limiting**
A simple IP-based rate limiter (100 req / 15 min) is applied to all `/api` routes to prevent abuse in development and staging environments.
