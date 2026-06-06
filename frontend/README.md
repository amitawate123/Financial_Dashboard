# Finance Dashboard — Frontend

A clean, minimal React frontend for the Finance Dashboard backend API. Built with **Vite + React**, using **Recharts** for analytics visualizations and **React Router** for navigation.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 18 (Vite) |
| Routing | React Router v6 |
| HTTP Client | Axios |
| Charts | Recharts |
| Icons | Lucide React |
| Styling | CSS Variables + inline styles |

---

## Project Structure

```
src/
├── api/
│   └── client.js              # Axios instance, JWT interceptors, all API methods
├── context/
│   └── AuthContext.jsx        # Global auth state (user, login, logout, can)
├── components/
│   ├── ui/
│   │   └── index.jsx          # Reusable: Button, Input, Card, Modal, Badge, Pagination...
│   └── layout/
│       └── Layout.jsx         # Sidebar with role-filtered navigation
├── pages/
│   ├── Login.jsx              # Login form with demo account quick-fill
│   ├── Register.jsx           # Registration with role selector
│   ├── Dashboard.jsx          # Charts, summary stats, recent activity
│   ├── Transactions.jsx       # Full CRUD table with filters, search, pagination
│   └── Users.jsx              # User management (Admin only)
├── App.jsx                    # Routes with auth guards
├── main.jsx                   # Entry point
└── index.css                  # Design system: CSS variables, fonts, animations
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- The Finance Dashboard Backend running on port 3000

### Setup

```bash
cd finance-dashboard-frontend
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:3000/api/v1
npm run dev    # → http://localhost:5173
```

---

## Pages & Access

| Page | Path | Viewer | Analyst | Admin |
|------|------|--------|---------|-------|
| Dashboard (charts) | `/dashboard` | ⚠️ limited | ✅ | ✅ |
| Transactions (view) | `/transactions` | ✅ | ✅ | ✅ |
| Transactions (create) | `/transactions` | ❌ | ✅ | ✅ |
| Transactions (edit/delete) | `/transactions` | ❌ | ❌ | ✅ |
| Users | `/users` | ❌ | ❌ | ✅ |

---

## Demo Credentials (after `npm run seed` in backend)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | password123 |
| Analyst | analyst@demo.com | password123 |
| Viewer | viewer@demo.com | password123 |

Use the **quick-fill buttons** on the login page for convenience.

---

## Design Decisions

**CSS Variables over a UI library** — Keeps the bundle small and the design system under full control. All tokens defined once in `:root`.

**No Redux / Zustand** — Auth context is the only global state needed. React Context is sufficient.

**Axios interceptors** — JWT attachment and 401 redirect handled in one place. No component ever manages auth headers manually.

**Soft-delete transparency** — Deleted transactions disappear from the table automatically since the backend filters them; the frontend needs no special handling.
