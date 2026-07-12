# TransitOps Backend

```bash
npm install
cp .env.example .env   # Neon connection string + a random JWT_SECRET
npx prisma migrate dev --name init
npm run dev              # http://localhost:4000/api/v1
```

Check `GET /api/v1/health` first to confirm the server + DB connection are alive.

## Architecture

`routes/*.js` → `controllers/*.js` → `prisma`. Routes only wire up middleware (auth,
role, validation) and point at a controller function — no business logic in a route
file. Controllers hold the logic; anything that touches two related records at once
(Trip dispatch/complete/cancel, Maintenance create/close) uses `prisma.$transaction`
so both status changes apply together or not at all.

## Already built (see CONTRACT.md at repo root for full request/response shapes)

- Auth: register/login/me, JWT + `requireAuth`/`requireRole` RBAC middleware
- Vehicles: full CRUD, `/available` filtered list, unique registration number check
- Drivers: full CRUD, `/available` filtered list (excludes suspended + expired license), suspend action
- Trips: create (validates cargo weight / vehicle+driver availability / license), dispatch, complete, cancel — all transactional
- Maintenance: create (sets vehicle IN_SHOP), close (restores AVAILABLE unless RETIRED)
- Fuel logs + Expenses: CRUD
- Dashboard: `/kpis`; `/reports/vehicle/:id` partially stubbed — needs a revenue source wired in for ROI, flagged in the controller

## Adding anything not listed above

Follow the Vehicle module as the template: `schemas/x.schema.js` (Zod) →
`controllers/xController.js` → `routes/x.js`, then one line in `routes/index.js`.
