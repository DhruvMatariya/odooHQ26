# TransitOps — Figma Design Prompt (copy-paste into Figma AI / First Draft)

## 1. Product summary

Design **TransitOps**, a B2B fleet & transit operations management dashboard. It manages vehicles, drivers, trips (dispatch lifecycle), maintenance, fuel/expense logs, and reporting for a logistics company. Four internal roles use it: Fleet Manager, Dispatcher (labeled "Driver" role in backend but functions as trip dispatcher), Safety Officer, Financial Analyst. This is an internal ops tool — dense, data-heavy, fast to scan, not a consumer app.

## 2. Visual direction

- Style: modern industrial SaaS — think logistics/ops control-room feel, not playful. Confident, structured, high information density but not cluttered.
- Base: light theme, neutral off-white background (#F7F8FA), dark slate text (#1A1F27).
- Primary accent: deep teal/blue (#0F6E5F or #0B5FA5) — used for primary actions, active nav, links.
- Status colors (map directly to backend enums, reuse everywhere — badges, dots, table rows):
  - AVAILABLE → green (#1E9E5A)
  - ON_TRIP / DISPATCHED → blue (#1D6FE0)
  - IN_SHOP → amber (#D98F1F)
  - RETIRED / CANCELLED / SUSPENDED → red/grey (#B3261E / #6B7280)
  - DRAFT → neutral grey (#6B7280)
  - COMPLETED → teal-green (#0F6E5F)
- Typography: "Inter" for UI text (dashboards need a tight, technical grotesk), "Poppins" only for page titles/headers if a softer contrast is wanted — otherwise Inter throughout for consistency. Base size 14px, 12px for table cells, 24–28px for page headers.
- Data density: tables are the primary UI element (Vehicles, Drivers, Trips, Maintenance, Fuel, Expenses lists) — design a reusable data-table component with sort, filter chips, pagination, and row status badges.
- Cards used for KPIs on Dashboard, and for detail/summary views (Vehicle detail, Driver detail, Trip detail).
- Use an 8px spacing grid, 12px corner radius on cards, 8px on buttons/inputs, 999px (pill) on status badges.

## 3. Information architecture / navigation

Left sidebar (collapsible), persistent across all screens, role-aware (show only sections the logged-in role can access):

- Dashboard (all roles — KPI view)
- Vehicles (Fleet Manager: full CRUD; others: read-only)
- Drivers (Fleet Manager: full CRUD; Safety Officer: read + suspend action; others: read-only)
- Trips (Dispatcher role: create/dispatch/complete/cancel; others: read-only)
- Maintenance (Fleet Manager: full; others: read-only)
- Fuel Logs (Fleet Manager / Financial Analyst)
- Expenses (Financial Analyst primary; Fleet Manager can log)
- Reports (Financial Analyst: vehicle ROI report, CSV export)
- Top bar: logged-in user name + role badge, logout

Login/Register screens sit outside this shell (centered card, no sidebar).

## 4. Screens to design (in this order — matches backend build order)

### A. Auth
1. **Login** — centered card, email + password, "Sign in" button, error state showing invalid credentials (use the error shape below for inline field errors).
2. **Register** — same layout, adds Name + Role dropdown (FLEET_MANAGER / DRIVER / SAFETY_OFFICER / FINANCIAL_ANALYST).

### B. Vehicles module
3. **Vehicle list** — data table: Registration No, Name, Type, Max Load Capacity, Odometer, Status (badge), Acquisition Cost. Filter chips for status/type/region, search bar, "+ Add Vehicle" primary button (Fleet Manager only). Row click → detail.
4. **Add/Edit Vehicle** — modal or side-drawer form: registrationNumber, name, type (dropdown), maxLoadCapacity, odometer, acquisitionCost. Status is NOT editable here (show as read-only badge with a tooltip "changes via Trip/Maintenance actions").
5. **Vehicle detail** — header card (reg number, name, status badge, retire button), tabs: Overview | Trip History | Maintenance History | Fuel & Expenses | Report (fuelEfficiency, operationalCost, roi shown as 3 stat cards).

### C. Drivers module
6. **Driver list** — table: Name, License Number, License Category, License Expiry Date (flag red if past/near expiry), Contact Number, Safety Score, Status. "+ Add Driver" button.
7. **Add/Edit Driver** — form: name, licenseNumber, licenseCategory, licenseExpiryDate (date picker), contactNumber.
8. **Driver detail** — profile card + status badge + a visible **"Suspend Driver"** button (Safety Officer only, triggers confirmation modal — maps to POST /suspend action, distinct from generic edit).

### D. Trips module (core state machine — design this carefully)
9. **Trip list** — table: Source → Destination, Vehicle, Driver, Cargo Weight, Status (badge with the 4-state color coding: DRAFT/DISPATCHED/COMPLETED/CANCELLED), Planned Distance. Status filter tabs at top (All / Draft / Dispatched / Completed / Cancelled).
10. **Create Trip** — form: source, destination, cargoWeight, plannedDistance, vehicle picker (dropdown sourced only from "available vehicles" — show capacity next to each option), driver picker (dropdown sourced only from "available drivers with valid license" — show license expiry next to each). Inline validation error example: cargo weight exceeds selected vehicle's max load capacity (red helper text under field, matching error shape's field-level message).
11. **Trip detail** — a visual **status stepper/timeline** across the top: Draft → Dispatched → Completed (with Cancelled as an alternate branch off Dispatched, shown greyed-out or struck-through if not taken). Action buttons change based on current status:
    - DRAFT → "Dispatch Trip" button
    - DISPATCHED → "Complete Trip" (opens modal: finalOdometer, fuelConsumed) and "Cancel Trip" (confirmation modal) side by side
    - COMPLETED / CANCELLED → no actions, read-only summary
    Below the stepper: trip info card (vehicle, driver, cargo, distance) + linked vehicle/driver mini-cards.

### E. Maintenance module
12. **Maintenance list** — table: Vehicle, Description, Cost, Active status (pill: Active/Closed), date opened. Filter by vehicleId. "+ Log Maintenance" button.
13. **Add Maintenance** — form: vehicle picker (warn/disable if vehicle is ON_TRIP), description, cost.
14. **Close Maintenance** — inline row action "Close" with confirmation, updates badge to Closed.

### F. Fuel Logs & Expenses
15. **Fuel Logs list** — table: Vehicle, Liters, Cost, Date. "+ Add Fuel Log" form (vehicle picker, liters, cost, date).
16. **Expenses list** — table: Vehicle, Type (Toll/Other pill), Amount, Date. "+ Add Expense" form. Small note in UI: "Maintenance costs are tracked separately and not shown here" (reflects the no-double-count rule).

### G. Dashboard & Reports (design last)
17. **Dashboard (home)** — top row of 6-7 KPI stat cards: Active Vehicles, Available Vehicles, Vehicles in Maintenance, Active Trips, Pending Trips, Drivers on Duty, Fleet Utilization % (as a radial/progress ring). Below: a recent trips activity table + a small fleet status donut chart (Available/On Trip/In Shop/Retired breakdown).
18. **Vehicle Report** — per-vehicle stat cards: Fuel Efficiency, Operational Cost, ROI (color-coded green/red based on positive/negative), plus a simple bar/line chart of cost over time.
19. **Reports / Export** — table of all vehicles with the same 3 metrics columns + a prominent "Export CSV" button.

## 5. Shared components to define once in the design system

- Status badge (pill, color-coded per enum value listed in section 2)
- Data table (header row with sort arrows, filter chip bar above, pagination footer, empty state, loading skeleton state)
- Stat/KPI card (label, big number, optional trend arrow, optional icon)
- Modal / side-drawer form shell (title, close X, footer with Cancel + primary action button)
- Role badge (small pill next to user name in top bar, one color per role)
- Toast / inline banner for error responses — style it directly off the API's error shape: bold `title`, muted `detail` text below, and if `errors[]` is present, show each `field`/`message` pair as red helper text under the corresponding form field.
- Empty state illustration/pattern for lists with zero rows.
- Confirmation modal (used for Suspend Driver, Cancel Trip, Close Maintenance, Retire Vehicle).

## 6. Role-based view notes for the designer

Design one shared layout, but call out per-screen which roles see write-actions vs read-only:
- Fleet Manager: full CRUD on Vehicles, Drivers, Maintenance; read-only on Trips/Reports.
- Dispatcher (backend "DRIVER" role): full control of Trip lifecycle (create/dispatch/complete/cancel); read-only elsewhere.
- Safety Officer: read-only Drivers list/detail + the Suspend action only.
- Financial Analyst: Reports, Expenses, Fuel Logs; read-only elsewhere.

## 7. Deliverable

Produce: a Figma page per module (Auth, Vehicles, Drivers, Trips, Maintenance, Fuel & Expenses, Dashboard/Reports), a shared "Design System" page (colors, type scale, components from section 5), and one "Navigation & IA" page showing the sidebar with all role-gated states. Use auto-layout throughout so components resize cleanly for a future responsive/tablet pass.