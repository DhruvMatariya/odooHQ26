<div align="center">

# 🚛 TransitOps

### A fleet doesn't run on vibes. It runs on state machines.

[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](.)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)](.)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white)](.)
[![React](https://img.shields.io/badge/React-Vite-61DAFB?logo=react&logoColor=black)](.)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)](.)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-components-000000?logo=shadcnui&logoColor=white)](.)

*Built for the Odoo Hackathon 2026*

</div>

---

### 📌 Jump to
[Why](#-why-this-exists) · [Architecture](#-architecture) · [Roles](#-four-roles-four-different-apps) · [Trip Lifecycle](#-the-trip-lifecycle) · [Rules](#-the-rules-that-actually-matter) · [Run it](#-running-it-locally) · [Roadmap](#-whats-next)

---

## 🧩 Why this exists

Every fleet-management demo online shows a pretty dashboard and nothing underneath. The interesting part is never the table of vehicles — it's what happens *between* the tables:

> What stops someone from dispatching a truck that's already on a trip? What happens to a driver's status when a trip gets cancelled mid-route? Who's allowed to suspend a driver — and why can't a Fleet Manager just PATCH that field directly?

TransitOps answers those with actual code: Postgres transactions, role-gated routes, and a contract (`CONTRACT.md`) that both sides of the stack were built against — so nobody invents a business rule mid-sprint.

---

## 🏗️ Architecture

```
odooHQ26/
├── backend/          Node.js · Express · Prisma · PostgreSQL (Neon)
│   ├── src/routes         →  URL surface
│   ├── src/controllers    →  business logic + transactions
│   ├── src/schemas         →  Zod validation
│   └── prisma/            →  schema, migrations, seed data
├── Frontend/          React · Vite · Tailwind v4 · shadcn/ui · Recharts
│   └── src/app/components  →  Dashboard, Trips, Vehicles, Drivers, Reports...
├── CONTRACT.md         the single source of truth
└── docs/skills/        REST API + validation guidelines the code follows
```

<table>
<tr><td width="50%" valign="top">

**⚙️ Backend**
```
Express  →  routes
         →  controllers
         →  Zod schemas
         →  Prisma → PostgreSQL
```
JWT auth · bcrypt hashing · role middleware on every write · one consistent error shape across all endpoints.

</td><td width="50%" valign="top">

**🎨 Frontend**
```
Vite + React
  → Tailwind v4
  → shadcn/ui (dialogs, sheets,
     tables, command palette)
  → Recharts for reporting
```
Ships with a mock-data mode — the entire UI runs demo-ready with the backend switched off.

</td></tr>
</table>

---

## 👥 Four roles, four different apps

TransitOps isn't one dashboard — it's four, wearing the same UI:

| Role | Badge | What they actually own |
|---|---|---|
| 🧭 **Fleet Manager** | `FLEET_MANAGER` | Vehicles & Drivers — the master data everything else references |
| 🚦 **Dispatcher** | `DRIVER` | The Trip lifecycle — draft, dispatch, complete, cancel |
| 🛡️ **Safety Officer** | `SAFETY_OFFICER` | License data + the one button that suspends a driver |
| 💰 **Financial Analyst** | `FINANCIAL_ANALYST` | Reports & Expenses — fuel efficiency, cost, ROI per vehicle |

No role can do everything — the permission boundaries *are* the product spec.

---

## 🔁 The trip lifecycle

The core of the whole system is one state machine, enforced end to end:

```mermaid
stateDiagram-v2
    [*] --> DRAFT: POST /trips
    DRAFT --> DISPATCHED: POST /dispatch
    DISPATCHED --> COMPLETED: POST /complete
    DISPATCHED --> CANCELLED: POST /cancel
    COMPLETED --> [*]
    CANCELLED --> [*]

    note right of DISPATCHED
      vehicle → ON_TRIP
      driver  → ON_TRIP
    end note
    note right of COMPLETED
      vehicle → AVAILABLE
      driver  → AVAILABLE
    end note
```

Every arrow above is a transaction, not just an API call — vehicle and driver status flip atomically alongside the trip, or none of them do.

---

## 🔒 The rules that actually matter

- 🏎️ **Race-condition guard on dispatch** — vehicle & driver availability is re-checked at the *moment* of dispatch, not just when the trip was drafted.
- 🔐 **Status is never a raw PATCH-able field** — vehicle/driver status only changes through explicit actions (`/dispatch`, `/suspend`, `/close`), so "who can change this and when" lives in one place.
- ⚖️ **Validated before it can go wrong** — cargo can't exceed vehicle capacity, expired licenses can't be assigned, suspended drivers can't drive — checked at trip creation, not discovered after dispatch.
- 🧾 **One error shape everywhere** — every non-2xx response returns the same `{ type, title, status, detail, errors[] }` structure, so the frontend never has to special-case a route.

---

## 🚀 Running it locally

<details>
<summary><b>① Backend setup</b></summary>

```bash
cd backend
cp .env.example .env        # add your DATABASE_URL + JWT_SECRET
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev                 # → http://localhost:4000
```

</details>

<details>
<summary><b>② Frontend setup</b></summary>

```bash
cd Frontend
cp .env.example .env
npm install
npm run dev                 # → http://localhost:5173
```

Want to skip Postgres entirely? Leave `VITE_USE_MOCK_DATA=true` in `.env` — the whole UI runs on mock data.

</details>

<details>
<summary><b>③ Default ports</b></summary>

| Service | URL |
|---|---|
| Backend API | `http://localhost:4000/api/v1` |
| Frontend | `http://localhost:5173` |
| Prisma Studio | `npx prisma studio` |

</details>

---

## 📖 The contract, not an afterthought

`CONTRACT.md` isn't documentation written after the fact — it's the file both sides of this project were built *against*. Every endpoint, enum, and validation rule lives there first; code follows.

---

## 🗺️ What's next

- [ ] Fleet utilization trends over time, not just a point-in-time %
- [ ] Expiry alerting for driver licenses before they lapse
- [ ] A proper audit log for trip cancellations

---

<div align="center">

Built by a two-person team splitting frontend and backend —
the contract is what let both halves meet in the middle without a single merge-conflict argument.

</div>
