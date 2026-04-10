# Project Specification: Transaction Tracker (UAE Customs Context)

This document describes **the codebase as implemented** in this repository. It supersedes earlier drafts that referenced Next.js, Prisma, and PostgreSQL.

---

## 1. Project Overview

**Name:** Transaction Tracker (monorepo; evolved from a broader “Customs Broker Portal” idea)

**Objective:**  
Provide an internal tool to **create, list, view, fully edit, and delete** customs-style **transactions**, with **risk and duty simulation**, **document status** (copy / original BL / telex), **payment** and **e-release** actions, backed by **MongoDB**, with **JWT login** and **role-based access** for staff.

**Not in scope (current code):**  
Full client-facing portal, file uploads, timeline UI stepper, reports/export, real Mirsal 2 integration, Next.js stack.

---

## 2. Repository Layout

| Path | Purpose |
|------|---------|
| `apps/api` | Node.js **Express** + TypeScript REST API, Mongoose + MongoDB |
| `apps/web` | **React 18** + **Vite** + TypeScript SPA (login, improved UI, transaction CRUD UI) |
| `apps/app` | Flutter starter listing transactions (must send auth + correct host for device/emulator) |
| `seed-test-data.sh` | Seeds MongoDB directly via `mongosh` (bulk test clients/transactions) |
| `seed-shipping-linked-data.sh` | Seeds shipping companies and transactions linked to them |
| `package.json` (root) | npm workspaces for `apps/api` and `apps/web` |

---

## 3. Technical Stack (As Built)

| Layer | Technology |
|-------|------------|
| API runtime | Node.js, Express, TypeScript |
| Persistence | **MongoDB** via **Mongoose** |
| Auth | **JWT** (`jsonwebtoken`), Bearer token in `Authorization` header |
| Web | React, Vite, TypeScript, React Router |
| Mobile | Flutter + `http` (demo; align with API auth in production) |

**Environment**

- `MONGO_URI` — default `mongodb://127.0.0.1:27017/customs_broker_track`
- `JWT_SECRET` — signing secret for tokens (defaults to dev placeholder; set in production)
- `PORT` — API port (default `4000`)

---

## 4. Data Model (MongoDB / Mongoose)

### 4.1 Employee (`employees` collection)

Used for login. Fields include: `name`, `email` (unique), `password` (plain in MVP — improve with hashing in production), `role`: `manager` | `employee` | `accountant`.

**Seeded on API startup** (if missing):

- `manager@tracker.local` / `123456` — manager  
- `employee@tracker.local` / `123456` — employee  
- `accountant@tracker.local` / `123456` — accountant  

### 4.2 Transaction (`transactions` collection)

| Field | Notes |
|-------|--------|
| `clientName` | **Required** display/tracking name (no separate Client FK required for core flow) |
| `clientId` | Optional string reference if needed |
| `shippingCompanyName` | **Required** shipping company display name per transaction |
| `shippingCompanyId` | Optional reference to shipping company record |
| `declarationNumber` | Unique, e.g. `DXB-2026-000001` |
| `airwayBill`, `hsCode`, `goodsDescription`, `invoiceValue`, `originCountry` | Core shipment data (origin 2-letter code) |
| `documentStatus` | `copy_received` \| `original_received` \| `telex_release` |
| `clearanceStatus` | Enum including `GREEN_CHANNEL`, `YELLOW_CHANNEL`, `RED_CHANNEL`, `PAID`, `E_RELEASE_ISSUED`, `DELIVERED`, etc. |
| `riskLevel` | `low` \| `medium` \| `high` |
| `channel` | `green` \| `yellow` \| `red` |
| `customsDuty` | Calculated server-side |
| `paymentStatus` | `pending` \| `paid` |
| `xrayResult` | `not_required` \| `passed` \| `manual_inspection` |
| `releaseCode` | Optional; set when release is issued |
| `createdAt`, `updatedAt` | Timestamps |

### 4.3 Client (`clients` collection)

Legacy/auxiliary CRUD for broker-style client records. Not required for the main transaction form (transactions carry `clientName`).

### 4.4 Shipping Company (`shippingcompanies` collection)

Fields: `companyName`, `code` (unique), `contactName`, `phone`, `status` (`active` | `inactive`).

Used by:
- Shipping Companies management section
- Transaction linkage (`shippingCompanyId`, `shippingCompanyName`)

---

## 5. Business Logic

### 5.1 Risk assessment (unchanged rules)

- `invoiceValue > 500_000` → **high**
- `hsCode` starts with `30` or `93` → **high**
- `originCountry` in `IR`, `SY`, `KP` → **high**
- Else if `invoiceValue > 100_000` → **medium**
- Else → **low**

**Channels:** low → green, medium → yellow, high → red.

### 5.2 Duty

- **5%** of invoice value **+** fixed processing fee (**100**), rounded for storage.

### 5.3 Release rule

- **e-release** (`releaseCode` + `E_RELEASE_ISSUED`) only if **paid** and (`original_received` **or** `telex_release`).

### 5.4 Create / update

- **Create** runs risk assessment and sets initial channel/status/duty.
- **Update (`PUT`)** recalculates risk/channel/duty from submitted `invoiceValue` / `hsCode` / `originCountry`; clearance status defaults to the channel-derived status unless the client sends fields as implemented in `store.ts`.

---

## 6. Authentication & Authorization

### 6.1 Auth API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | No | Body: `{ email, password }` → `{ token, user }` |
| POST | `/api/auth/logout` | Optional | Stateless OK response (client discards token) |
| GET | `/api/auth/me` | Bearer | Returns `{ user }` from JWT |

### 6.2 Protected routes

All **transaction** and **client** API routes expect:

```http
Authorization: Bearer <jwt>
```

### 6.3 Roles

| Role | Capabilities (summary) |
|------|-------------------------|
| **manager** | Full: CRUD transactions, pay, release, all edits |
| **employee** | Create/read/update/delete transactions, mark original BL; **cannot** pay, release, or set `paymentStatus` via update |
| **accountant** | Read transactions; **pay** and **release**; `PUT` may **only** change `paymentStatus` |

Manager-only sections:
- Clients create/update/delete
- Shipping companies create/update/delete

---

## 7. REST API (Implemented)

| Method | Path | Notes |
|--------|------|--------|
| GET | `/health` | Liveness |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout (client-side token clear) |
| GET | `/api/auth/me` | Current user |
| GET/POST | `/api/clients` | List / create clients (create = manager only) |
| PUT/DELETE | `/api/clients/:id` | Update / delete client (manager only) |
| GET/POST | `/api/shipping-companies` | List / create shipping companies (create = manager only) |
| PUT/DELETE | `/api/shipping-companies/:id` | Update / delete shipping company (manager only) |
| GET | `/api/transactions` | List (auth + role) |
| POST | `/api/transactions` | Create (manager, employee) |
| GET | `/api/transactions/:id` | Detail |
| PUT | `/api/transactions/:id` | Partial/full field update per role rules |
| DELETE | `/api/transactions/:id` | Manager, employee |
| POST | `/api/transactions/:id/original-bl` | Manager, employee |
| POST | `/api/transactions/:id/pay` | Manager, accountant |
| POST | `/api/transactions/:id/release` | Manager, accountant |

---

## 8. Web Application (`apps/web`)

**Routes**

- `/` — Transaction list with menu bar + auto search + filters (click row → detail)
- `/login` — Shown when unauthenticated (root app gates on session)
- `/transactions/new` — Create (blocked for accountant in UI)
- `/transactions/:id` — Detail; pay/release for manager/accountant; edit/delete per role
- `/transactions/:id/edit` — Edit form
- `/employees` — Explains roles (role comes from logged-in user, not manual switch)
- `/clients` — Clients list + manager CRUD
- `/shipping-companies` — Shipping companies list + manager CRUD

**Transaction list UX upgrades**
- Top menu bar for navigation/actions
- Auto search box (client, shipping company, declaration, airway bill)
- Filters by status and channel
- Creation datetime shown in list/details
- Shipping company info shown in list/details/form

**Session:** JWT + user stored in `localStorage`; `apiFetch` attaches `Authorization`. Logout clears storage and calls logout endpoint.

---

## 9. Mobile (`apps/app`)

Starter app that lists `/api/transactions`. For a real build, use the same Bearer token (or device login flow) and replace `localhost` with host reachable from the device (e.g. `10.0.2.2` on Android emulator).

---

## 10. Data Seeding

- **`seed-test-data.sh`:** Inserts many clients/transactions via `mongosh` into MongoDB (see script for `MONGO_URI`, counts, cleanup patterns).
- **`seed-shipping-linked-data.sh`:** Inserts shipping companies and generates transactions linked via `shippingCompanyId` and `shippingCompanyName`.

---

## 11. Run Locally

```bash
npm install
# Start MongoDB, then:
npm run dev:api
npm run dev:web
```

---

## 12. Historical Notes (Original Broader Spec)

The original discussion included: Next.js, Prisma, PostgreSQL, full admin/client portals, document uploads, timeline UI, and mock Mirsal endpoints. **This repository implements a narrower Transaction Tracker MVP** on Express + MongoDB + React as above. Items in section 12 can be reintroduced as future work.
