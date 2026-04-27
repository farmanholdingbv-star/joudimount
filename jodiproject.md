# Project Specification: Transaction Tracker (UAE Customs Context)

This document describes the codebase as currently implemented in this repository.

---

## 1. Project Overview

**Name:** Transaction Tracker (monorepo; evolved from a broader “Customs Broker Portal” idea)

**Objective:**  
Provide an internal tool to create, list, view, edit, and delete customs-style transactions, with risk and duty simulation, staged workflow, document handling, payment/release actions, JWT login, and role-based access.

**Not in scope (current code):**  
Full client-facing portal, reports/export, real Mirsal 2 integration.

---

## 2. Repository Layout

| Path | Purpose |
|------|---------|
| `apps/api` | Node.js **Express** + TypeScript REST API, Mongoose + MongoDB |
| `apps/web` | **React 18** + **Vite** + TypeScript SPA (login, improved UI, transaction CRUD UI) |
| `apps/app` | Flutter transaction app (list/details/form + auth + API host fallback) |
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
| Mobile | Flutter + `http`, `shared_preferences`, file picker, PDF/printing helpers (`apps/app`, package `judi_mount`) |

**Environment**

- `MONGO_URI` — default `mongodb://127.0.0.1:27017/customs_broker_track`
- `JWT_SECRET` — signing secret for tokens (defaults to dev placeholder; set in production)
- `PORT` — API port (default `4000`)

**Static files:** uploaded transaction documents are stored under the API working directory and exposed at `GET /uploads/...` (see `apps/api/src/server.ts`).

---

## 4. Data Model (MongoDB / Mongoose)

### 4.1 Employee (`employees` collection)

Used for login. Fields include: `name`, `email` (unique), `password` (plain in MVP), `role`: `manager` | `employee` | `employee2` | `accountant`.

**Seeded on API startup** (if missing):

- `manager@tracker.local` / `123456` — manager  
- `employee@tracker.local` / `123456` — employee  
- `employee2@tracker.local` / `123456` — employee2  
- `accountant@tracker.local` / `123456` — accountant  

### 4.2 Transaction (`transactions` collection)

| Field | Notes |
|-------|--------|
| `clientName` | **Required** display/tracking name (no separate Client FK required for core flow) |
| `clientId` | Optional string reference if needed |
| `shippingCompanyName` | **Required** shipping company display name per transaction |
| `shippingCompanyId` | Optional reference to shipping company record |
| `declarationNumber` | **Required**, unique, e.g. `DXB-2026-000001` (auto-generated on create if omitted) |
| `declarationNumber2`, `declarationDate`, `declarationType`, `declarationType2`, `portType` | Optional customs declaration metadata |
| `airwayBill`, `hsCode`, `goodsDescription`, `invoiceValue`, `originCountry` | Core shipment data (origin 2-letter code) |
| `invoiceCurrency` | `AED` \| `USD` \| `EUR` \| `SAR` (default `AED` in schema) |
| `documentStatus` | `copy_received` \| `original_received` \| `telex_release` |
| `clearanceStatus` | Enum including `GREEN_CHANNEL`, `YELLOW_CHANNEL`, `RED_CHANNEL`, `PAID`, `E_RELEASE_ISSUED`, `DELIVERED`, etc. |
| `riskLevel` | `low` \| `medium` \| `high` |
| `channel` | `green` \| `yellow` \| `red` |
| `paymentStatus` | `pending` \| `paid` |
| `xrayResult` | `not_required` \| `passed` \| `manual_inspection` |
| `releaseCode` | Optional; set when release is issued |
| `transactionStage` | `PREPARATION` \| `CUSTOMS_CLEARANCE` \| `TRANSPORTATION` \| `STORAGE` |
| `documentAttachments` | Optional uploaded files: `path`, `originalName`, optional `category` (`bill_of_lading`, `certificate_of_origin`, `invoice`, `packing_list`) |
| `containerCount`, `goodsWeightKg`, `invoiceToWeightRateAedPerKg` | Optional logistics / pricing helpers |
| `containerArrivalDate`, `documentArrivalDate` | Optional dates (ISO); `documentArrivalDate` participates in auto stage logic in `updateTransaction` |
| `fileNumber`, `containerNumbers`, `unitCount` | Optional |
| `isStopped`, `stopReason`, `holdReason`, `documentPostalNumber` | Optional workflow fields (`isStopped` **required** on API create/update body per `transactionSchemas.ts`) |
| `goodsQuantity`, `goodsQuality`, `goodsUnit` | Optional goods metadata |
| `createdAt`, `updatedAt` | Timestamps |

### 4.3 Client (`clients` collection)

Broker client records used by the Clients UI and optional `clientId` on transactions. Fields include: `companyName`, `trn` (unique), optional `immigrationCode`, `email`, `country`, `creditLimit`, `status` (`active` \| `suspended`).

### 4.4 Shipping Company (`shippingcompanies` collection)

Fields: `companyName`, `code` (unique), optional `contactName`, `phone`, `email`, `dispatchFormTemplate`, optional `latitude` / `longitude` (paired), `status` (`active` \| `inactive`).

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

### 5.5 Stage workflow

- Stage update endpoint: `POST /api/transactions/:id/stage` (roles: **manager**, **employee2**)
- Stage transition is forward-only and guarded by `setTransactionStage` in `store.ts` (e.g. storage/delivery locks)
- Transition from `PREPARATION` to `CUSTOMS_CLEARANCE` is rejected with `400` until the transaction record satisfies preparation checks in `getMissingFieldsBeforeCustomsClearance` (`server.ts`), including: non-empty `clientName`, `shippingCompanyName`, `airwayBill`, `hsCode`, `goodsDescription`, `originCountry`, `invoiceCurrency`; numeric constraints on `invoiceValue`, `containerCount`, `goodsWeightKg`, `invoiceToWeightRateAedPerKg`, `goodsQuantity`, `goodsQuality`, `goodsUnit`, `unitCount`; if `isStopped === true`, `stopReason` must be non-empty
- **Create / update** also adjusts `transactionStage` when `documentArrivalDate` is set (`nextStageOnArrival` in `store.ts`), which can move a transaction toward `CUSTOMS_CLEARANCE` independently of the stage endpoint

### 5.6 Transaction payload validation (API)

- `POST /api/transactions` and `PUT /api/transactions/:id` bodies are validated with Zod (`transactionSchemas.ts`)
- **`isStopped`** is **required** (boolean) on both create and update payloads; clients should always send it (web/Flutter forms do)
- Multipart uploads: each file must have a matching entry in `documentPhotoCategories` JSON; categories must be one of the four attachment enums above

---

## 6. Authentication & Authorization

### 6.1 Auth API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | No | Body: `{ email, password }` → `{ token, user }` |
| POST | `/api/auth/logout` | Optional | Stateless OK response (client discards token) |
| GET | `/api/auth/me` | Bearer | Returns `{ user }` from JWT |

### 6.2 Protected routes

All **transaction**, **client**, **shipping-company**, and **employee** API routes (except login) expect:

```http
Authorization: Bearer <jwt>
```

### 6.3 Roles

| Role | Capabilities (summary) |
|------|-------------------------|
| **manager** | Full: CRUD transactions, pay, release, all fields on `PUT`, stage changes, employee CRUD, client/shipping CRUD |
| **employee** | Create/read/update/delete transactions, mark original BL; on `PUT`, only **stage-1** fields (`server.ts` `stage1EmployeeFields`); **cannot** pay, release, or set `paymentStatus` |
| **employee2** | List/read transactions; `POST .../stage`; on `PUT`, only **stage-2** fields: `containerArrivalDate`, `documentArrivalDate`, `fileNumber`, `documentStatus`, `clearanceStatus`; **cannot** create/delete transactions, **cannot** use multipart attachment uploads on `PUT`, **cannot** set `paymentStatus` |
| **accountant** | Read transactions; **pay** and **release**; `PUT` may **only** change `paymentStatus` |

Manager-only sections:
- Clients create/update/delete
- Shipping companies create/update/delete
- Employees create/update/delete (`POST`/`PUT`/`DELETE /api/employees*`)

---

## 7. REST API (Implemented)

| Method | Path | Notes |
|--------|------|--------|
| GET | `/health` | Liveness |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout (client-side token clear) |
| GET | `/api/auth/me` | Current user |
| GET | `/api/employees` | List employees (any authenticated role) |
| POST | `/api/employees` | Create employee (manager only) |
| PUT/DELETE | `/api/employees/:id` | Update / delete employee (manager only) |
| GET/POST | `/api/clients` | List / create clients (create = manager only) |
| GET | `/api/clients/:id` | Client detail |
| PUT/DELETE | `/api/clients/:id` | Update / delete client (manager only) |
| GET/POST | `/api/shipping-companies` | List / create shipping companies (create = manager only) |
| GET | `/api/shipping-companies/:id` | Shipping company detail |
| PUT/DELETE | `/api/shipping-companies/:id` | Update / delete shipping company (manager only) |
| GET | `/api/transactions` | List (manager, employee, employee2, accountant); optional `?clientId=` |
| POST | `/api/transactions` | Create (manager, employee) |
| GET | `/api/transactions/:id` | Detail |
| PUT | `/api/transactions/:id` | Partial/full field update per role rules |
| DELETE | `/api/transactions/:id` | Manager, employee (not employee2/accountant) |
| POST | `/api/transactions/:id/stage` | Manager, employee2 |
| POST | `/api/transactions/:id/original-bl` | Manager, employee |
| POST | `/api/transactions/:id/pay` | Manager, accountant |
| POST | `/api/transactions/:id/release` | Manager, accountant |

---

## 8. Web Application (`apps/web`)

**Routes**

- `/` — Transaction list with menu bar + auto search + filters (click row → detail)
- `/login` — Shown when unauthenticated (root app gates on session)
- `/transactions/new` — Create (blocked for accountant and employee2 in UI; API allows manager + employee only)
- `/transactions/:id` — Detail; pay/release for manager/accountant; edit/delete per role
- `/transactions/:id/edit` — Edit form
- `/employees` — Employee directory: all authenticated users can list; **manager** can create, edit, and delete via the same screen (backed by `/api/employees`)
- `/clients` — Clients list + manager CRUD
- `/clients/:id` — Client detail
- `/shipping-companies` — Shipping companies list + manager CRUD
- `/shipping-companies/:id` — Shipping company detail

**Transaction list UX upgrades**
- Top menu bar for navigation/actions
- Auto search box (client, shipping company, declaration, airway bill)
- Filters by status and channel
- Creation datetime shown in list/details
- Shipping company info shown in list/details/form

**Session:** JWT + user stored in `localStorage`; `apiFetch` attaches `Authorization`. Logout clears storage and calls logout endpoint.

**Attachments:** Transaction create/edit supports multipart uploads and category tagging for document files.

**API base URL:** `apps/web/src/types.ts` defines `API_BASE` (default `http://localhost:4000`) for attachment links and fetches; change it for non-local deployments.

---

## 9. Mobile (`apps/app`)

Flutter package **`judi_mount`**: list, detail, and transaction form with auth, stage handling, attachments, localization, and staff screens. Configure API host via `--dart-define=API_BASE=...` or use built-in host fallback order in `lib/api.dart`.

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

Optional production build:

```bash
npm run build
```

---

## 12. Summary

This repository implements a Transaction Tracker monorepo on Express + MongoDB + React + Flutter, with role-based access, stage transitions, and attachment-aware transaction operations.
