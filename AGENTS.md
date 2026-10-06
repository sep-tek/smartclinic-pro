# SmartClinic Pro — AGENTS.md

## 1. PROJECT OVERVIEW

SmartClinic Pro is a healthcare clinic management platform connecting
patients, doctors, and admins. It uses:

- Frontend: React 19 + Vite 8 (ESM, `"type": "module"`)
- Backend: Express 5 + PostgreSQL via `pg` (CommonJS)
- Auth: JWT (`jsonwebtoken`) + password hashing with `bcryptjs`
- React Router 7 for routing; `motion` available for animations

## 2. IMPORTANT STRUCTURE

```
smartclinic-pro/
├── src/
│   ├── routes/AppRoutes.jsx     # All route definitions
│   ├── pages/                   # Page components + co-located CSS
│   ├── components/              # Navbar, Footer, ProtectedRoute, AdminRoute, ErrorMessage, ScrollToTop
│   ├── context/AuthContext.jsx  # Auth state (localStorage-backed)
│   ├── api/api.js               # apiFetch helper + API_BASE_URL
│   ├── layouts/                 # PublicLayout, AdminLayout
│   └── hooks/, services/        # Currently empty placeholders
└── backend/
    ├── server.js                # Express app entry (port 5000)
    ├── routes/                  # auth, appointments, doctors, doctorDashboard,
    │                            # users, admin*, contact, profile
    ├── middleware/authMiddleware.js
    ├── database/init.sql, init.js
    └── db.js, createAdmin.js
```

Key files: `src/context/AuthContext.jsx`, `src/components/ProtectedRoute.jsx`,
`src/components/AdminRoute.jsx`, `src/pages/Dashboard.jsx` (renders
`DoctorDashboard` for doctor role), `src/pages/DoctorDashboard.jsx`,
`backend/routes/authRoutes.js`, `backend/routes/doctorDashboardRoutes.js`.

## 3. CURRENT DESIGN SYSTEM

- Near-black background: `#080908`
- Sage accent: `#7fa99f` (labels, links, spans in headings)
- Primary text: `#f3f4f1`; muted text: `#9aa39d` / `#8d9691` / `#6f7672`
- Primary buttons: light solid `#f3f4f1` with `#101110` text, no gradient
- Borders: subtle, e.g. `rgba(255,255,255,0.08)` / `#242624`
- Cards: dark surfaces (`rgba(255,255,255,0.03)` or `#0e100f`), ~20px radius
- Typography: uppercase micro-labels (10–14px, 600–700 weight, 1–2px letter-spacing),
  large tight-tracked display headings
- Preserve this visual identity unless explicitly asked to change it.

## 4. FRONTEND DEVELOPMENT RULES

- Preserve existing functionality; never change behavior as a side effect.
- Frontend-only work must not modify `backend/` or the database.
- Reuse existing components, layouts, and CSS before creating new ones.
- Prefer shared tokens/variables for new shared styling.
- Do not add dependencies without a clear need.
- Keep animations subtle and performant; honor `prefers-reduced-motion`.
- Keep layouts responsive (mobile breakpoints expected).
- Inspect the existing implementation before replacing it.

## 5. PROJECT WORKFLOW

- One focused task at a time.
- Inspect only the files relevant to the current task.
- Do not rescan the whole repository for every request.
- Before editing, read the relevant existing code.
- After meaningful changes, run the frontend build (and lint when relevant).
- Never rewrite large files when a targeted edit suffices.

## 6. KNOWN CURRENT ISSUES (do not fix unless asked)

- API calls duplicated across pages instead of centralized in `src/api/` / `src/services/`
- `/profile` route is not wrapped in `ProtectedRoute`
- Hardcoded `http://localhost:5000` URLs in many pages
- Plaintext DB password in `backend/.env`; placeholder `JWT_SECRET`
- No tests anywhere
- No single dev script running frontend + backend together
- `DoctorDashboard` rendered via role check inside `Dashboard` rather than its own route

## 7. DEVELOPMENT COMMANDS

Frontend (repo root):

- `npm run dev` — Vite dev server
- `npm run build` — production build
- `npm run preview` — preview the build
- `npm run lint` — ESLint

Backend (`backend/`):

- `npm start` — `node server.js`
- `npm run dev` — `nodemon server.js`
- `npm run db:init` — `node database/init.js`
