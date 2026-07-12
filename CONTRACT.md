# TransitOps — API Contract (ground truth)

Every route, controller, and frontend `api/*.ts` client must match this exactly. If a business rule isn't listed here, don't invent it mid-build — ask, then add it here first.

## Enums

```
Role:          FLEET_MANAGER | DRIVER | SAFETY_OFFICER | FINANCIAL_ANALYST
VehicleStatus: AVAILABLE | ON_TRIP | IN_SHOP | RETIRED
DriverStatus:  AVAILABLE | ON_TRIP | OFF_DUTY | SUSPENDED
TripStatus:    DRAFT | DISPATCHED | COMPLETED | CANCELLED
```

## Auth (Module 1 — build first, blocks everything else)

| Method | Path | Body | Response | Notes |
|---|---|---|---|---|
| POST | /api/v1/auth/register | `{ name, email, password, role }` | `201 { id, name, email, role }` | password hashed with bcrypt, never returned |
| POST | /api/v1/auth/login | `{ email, password }` | `200 { token, user: { id, name, email, role } }` | JWT, put role in the payload |
| GET | /api/v1/auth/me | — (Bearer token) | `200 { id, name, email, role }` | used by frontend to restore session on refresh |

**RBAC middleware**: `requireAuth` (valid JWT) then `requireRole(...roles)` per route. Suggested role gates:
- Vehicle/Driver/Maintenance writes → `FLEET_MANAGER`
- Trip create/dispatch → `DRIVER` (per the brief, this role creates trips — it maps to "dispatcher," not the physical fleet driver in the Driver entity)
- Safety/license views → `SAFETY_OFFICER` (read access to Drivers, license expiry)
- Reports/expenses → `FINANCIAL_ANALYST`
- Reads (GET) generally open to any authenticated role unless stated

## Vehicles (Module 2)

| Method | Path | Body / Query | Response | Rules |
|---|---|---|---|---|
| GET | /api/v1/vehicles | `?status=&type=&region=` | `200 [{ id, registrationNumber, name, type, maxLoadCapacity, odometer, acquisitionCost, status }]` | |
| GET | /api/v1/vehicles/available | — | `200 [Vehicle]` | filters to `status = AVAILABLE` only — this is the list Trip creation dispatches from |
| POST | /api/v1/vehicles | `{ registrationNumber, name, type, maxLoadCapacity, odometer, acquisitionCost }` | `201 Vehicle` | `registrationNumber` unique → `409` if taken |
| GET | /api/v1/vehicles/:id | — | `200 Vehicle` | `404` if missing |
| PATCH | /api/v1/vehicles/:id | any subset of fields (not `status` — status changes only via trip/maintenance actions) | `200 Vehicle` | |
| DELETE | /api/v1/vehicles/:id | — | `204` | prefer soft-delete: sets status `RETIRED` rather than removing the row, since trips/logs reference it |

## Drivers (Module 3)

| Method | Path | Body / Query | Response | Rules |
|---|---|---|---|---|
| GET | /api/v1/drivers | `?status=` | `200 [{ id, name, licenseNumber, licenseCategory, licenseExpiryDate, contactNumber, safetyScore, status }]` | |
| GET | /api/v1/drivers/available | — | `200 [Driver]` | filters `status = AVAILABLE` **and** `licenseExpiryDate > now` — this is the list Trip creation assigns from |
| POST | /api/v1/drivers | `{ name, licenseNumber, licenseCategory, licenseExpiryDate, contactNumber }` | `201 Driver` | `licenseNumber` unique → `409` |
| GET | /api/v1/drivers/:id | — | `200 Driver` | |
| PATCH | /api/v1/drivers/:id | any subset (not `status`) | `200 Driver` | e.g. Safety Officer sets `status: SUSPENDED` via a dedicated action, not raw PATCH — see below |
| POST | /api/v1/drivers/:id/suspend | — | `200 Driver` | explicit action, sets `status = SUSPENDED`; keeps the "who can suspend" rule enforceable in one place |

## Trips (Module 4 — the core state machine, build after Vehicles + Drivers exist)

| Method | Path | Body | Response | Rules |
|---|---|---|---|---|
| GET | /api/v1/trips | `?status=` | `200 [Trip]` | |
| POST | /api/v1/trips | `{ source, destination, vehicleId, driverId, cargoWeight, plannedDistance }` | `201 Trip (status: DRAFT)` | `cargoWeight ≤ vehicle.maxLoadCapacity` → else `400`; vehicle must be `AVAILABLE`, driver must be `AVAILABLE` and license not expired and not `SUSPENDED` → else `409` |
| POST | /api/v1/trips/:id/dispatch | — | `200 Trip (status: DISPATCHED)` | **transaction**: trip → `DISPATCHED`, vehicle → `ON_TRIP`, driver → `ON_TRIP`. Re-check vehicle/driver are still `AVAILABLE` at this moment (race condition guard) |
| POST | /api/v1/trips/:id/complete | `{ finalOdometer, fuelConsumed }` | `200 Trip (status: COMPLETED)` | **transaction**: trip → `COMPLETED` + store odometer/fuel, vehicle → `AVAILABLE` + `odometer = finalOdometer`, driver → `AVAILABLE` |
| POST | /api/v1/trips/:id/cancel | — | `200 Trip (status: CANCELLED)` | only valid from `DISPATCHED` (per brief: "cancelling a **dispatched** trip"). **transaction**: trip → `CANCELLED`, vehicle → `AVAILABLE`, driver → `AVAILABLE` |

## Maintenance (Module 5)

| Method | Path | Body | Response | Rules |
|---|---|---|---|---|
| GET | /api/v1/maintenance | `?vehicleId=` | `200 [MaintenanceLog]` | |
| POST | /api/v1/maintenance | `{ vehicleId, description, cost }` | `201 MaintenanceLog (isActive: true)` | **transaction**: create log, vehicle → `IN_SHOP`. Vehicle must not already be `ON_TRIP` |
| POST | /api/v1/maintenance/:id/close | — | `200 MaintenanceLog (isActive: false)` | **transaction**: log `isActive = false`, vehicle → `AVAILABLE` **unless** `vehicle.status === RETIRED` |

## Fuel logs (Module 6a)

| Method | Path | Body | Response | Rules |
|---|---|---|---|---|
| GET | /api/v1/fuel-logs | `?vehicleId=` | `200 [{ id, vehicleId, liters, cost, date }]` | |
| POST | /api/v1/fuel-logs | `{ vehicleId, liters, cost, date }` | `201 FuelLog` | |

## Expenses (Module 6b)

| Method | Path | Body | Response | Rules |
|---|---|---|---|---|
| GET | /api/v1/expenses | `?vehicleId=` | `200 [{ id, vehicleId, type, amount, date }]` | `type`: `TOLL \| OTHER` (maintenance cost comes from MaintenanceLog, not here — don't double count) |
| POST | /api/v1/expenses | `{ vehicleId, type, amount, date }` | `201 Expense` | |

## Dashboard & Reports (Module 7 — build last, reads from everything above)

| Method | Path | Response |
|---|---|---|
| GET | /api/v1/dashboard/kpis | `200 { activeVehicles, availableVehicles, vehiclesInMaintenance, activeTrips, pendingTrips, driversOnDuty, fleetUtilizationPct }` |
| GET | /api/v1/reports/vehicle/:id | `200 { fuelEfficiency, operationalCost, roi }` — `fuelEfficiency = totalDistance / totalFuelLiters`; `operationalCost = totalFuel + totalMaintenance`; `roi = (revenue - (maintenance + fuel)) / acquisitionCost` |
| GET | /api/v1/reports/export.csv | CSV file | operational cost + fuel efficiency per vehicle |

## Error shape (every non-2xx response, all endpoints)

```json
{ "type": "https://api/errors/<slug>", "title": "...", "status": 400, "detail": "...", "errors": [{ "field": "cargoWeight", "message": "exceeds vehicle max load capacity" }] }
```

`errors` array only present for validation failures (400); omitted for 404/409/500.

## Build order (respects dependencies)

1. Auth + RBAC
2. Vehicles, Drivers (parallel — no dependency between them)
3. Trips (needs both above)
4. Maintenance (needs Vehicles)
5. Fuel logs + Expenses (needs Vehicles)
6. Dashboard + Reports (needs everything)
