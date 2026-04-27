# Project Specification: Transaction Tracker (UAE Customs Context)

This document is synchronized with the repository's current implementation.

---

## 1. Project Overview

**Name:** Transaction Tracker (monorepo)

**Objective:**  
Provide an internal customs workflow system with role-based access, authentication, staged processing, document uploads, and payment/release controls across three operational modules:

- Transactions
- Transfers
- Exports

**Out of scope (current code):**

- Real external customs platform integration (e.g. Mirsal 2)
- Public customer portal
- Full BI/reporting pipeline

---

## 2. Repository Layout

| Path | Purpose |
|------|---------|
| `apps/api` | Express + TypeScript REST API, MongoDB/Mongoose |
| `apps/web` | React 18 + Vite + TypeScript web app |
| `apps/app` | Flutter mobile app (`judi_mount`) |
| `seed-test-data.sh` | Seeds many clients/transactions directly via `mongosh` |
| `seed-shipping-linked-data.sh` | Seeds shipping companies and linked transactions |
| `package.json` | Root npm workspaces (`apps/api`, `apps/web`) |

---

## 3. Technical Stack

| Layer | Technology |
|-------|------------|
| API | Node.js, Express, TypeScript |
| Database | MongoDB with Mongoose |
| Auth | JWT (`Authorization: Bearer <token>`) |
| Validation | Zod (request payload validation) |
| Web | React, React Router, Vite, TypeScript |
| Mobile | Flutter, `http`, `shared_preferences`, localization |

**Environment variables**

- `MONGO_URI` (default: `mongodb://127.0.0.1:27017/customs_broker_track`)
- `JWT_SECRET`
- `PORT` (default: `4000`)

**Uploads**

- Uploaded documents are stored under `uploads/` in API working directory.
- Files are served from `GET /uploads/...`.

---

## 4. Data Model

## 4.1 Employees (`employees`)

Fields:

- `name`
- `email` (unique)
- `password` (plain in current MVP)
- `role`: `manager` | `employee` | `employee2` | `accountant`

Seeded defaults on API startup (upsert):

- `manager@tracker.local`
- `employee@tracker.local`
- `employee2@tracker.local`
- `accountant@tracker.local`

## 4.2 Operational records (`transactions`, `transfers`, `exports`)

All three collections share the same schema model (same business fields).

Core fields:

- Client/shipping identity: `clientName`, optional `clientId`, `shippingCompanyName`, optional `shippingCompanyId`
- Declaration fields: `declarationNumber` (unique), `declarationNumber2`, `declarationDate`, `orderDate`, declaration metadata
- Shipment fields: `airwayBill`, `hsCode`, `goodsDescription`, `invoiceValue`, `invoiceCurrency`, `originCountry`
- Workflow fields: `documentStatus`, `clearanceStatus`, `riskLevel`, `channel`, `paymentStatus`, `xrayResult`, `releaseCode`
- Stage: `transactionStage` (`PREPARATION`, `CUSTOMS_CLEARANCE`, `TRANSPORTATION`, `STORAGE`)
- Attachments: `documentAttachments[]` with `path`, `originalName`, optional category
- Logistics + goods fields: container/unit/quantity/quality/weight and related optional values
- Flags/reasons: `isStopped`, `stopReason`, `holdReason`, `documentPostalNumber`
- Timestamps: `createdAt`, `updatedAt`

Declaration prefixes by module:

- Transactions: `DXB-2026-######`
- Transfers: `TRF-2026-######`
- Exports: `EXP-2026-######`

Numbers are generated from atomic counters in `counters` collection.

## 4.3 Clients (`clients`)

Fields: `companyName`, `trn` (unique), optional `immigrationCode`, `email`, `country`, `creditLimit`, `status` (`active`/`suspended`).

## 4.4 Shipping companies (`shippingcompanies`)

Fields: `companyName`, `code` (unique), optional contact fields, optional `dispatchFormTemplate`, optional paired `latitude`/`longitude`, and `status` (`active`/`inactive`).

---

## 5. Business Logic

## 5.1 Risk and channel

- `invoiceValue > 500000` => high
- `hsCode` starts with `30` or `93` => high
- `originCountry` in `IR`, `SY`, `KP` => high
- else if `invoiceValue > 100000` => medium
- else => low

Channel mapping: low => green, medium => yellow, high => red.

## 5.2 Payment and release

- Pay endpoint sets `paymentStatus = paid` and `clearanceStatus = PAID`.
- Release is allowed only when paid and document status is `original_received` or `telex_release`.
- Successful release sets `releaseCode` and `clearanceStatus = E_RELEASE_ISSUED`.

## 5.3 Stage behavior

- Stages are represented as `PREPARATION`, `CUSTOMS_CLEARANCE`, `TRANSPORTATION`, `STORAGE`.
- Stage endpoint exists per module (`.../:id/stage`) for manager and employee2.
- For transactions, moving from `PREPARATION` to `CUSTOMS_CLEARANCE` via stage endpoint is blocked until preparation-required fields are complete.
- `documentArrivalDate` auto-advances stage from `PREPARATION` to `CUSTOMS_CLEARANCE`.
- On updates, stage-locked field protection is enforced based on current/target stage.

## 5.4 Validation and attachments

- Create/update payloads are validated with Zod (`transactionSchemas.ts`).
- `isStopped` is required on create and update schemas.
- Multipart upload requires a category entry per uploaded file.
- Attachments support merge/retain/remove flows on edit, and orphan files are cleaned up.

---

## 6. Authentication & Authorization

## 6.1 Auth endpoints

| Method | Path |
|--------|------|
| POST | `/api/auth/login` |
| POST | `/api/auth/logout` |
| GET | `/api/auth/me` |

## 6.2 Role summary

- `manager`: full CRUD and management across modules, staff, clients, shipping companies
- `employee`: create/read/update/delete module records (with field restrictions on update), mark original BL
- `employee2`: read + stage operations + limited stage-2 update fields (no create/delete; no attachment upload on transaction update)
- `accountant`: read + pay + release; edit endpoint limited to `paymentStatus`

---

## 7. REST API (Implemented)

## 7.1 Core

- `GET /health`
- Auth: `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`
- Employees: `/api/employees`, `/api/employees/:id`
- Clients: `/api/clients`, `/api/clients/:id`
- Shipping companies: `/api/shipping-companies`, `/api/shipping-companies/:id`

## 7.2 Transactions module

- `GET/POST /api/transactions`
- `GET/PUT/DELETE /api/transactions/:id`
- `POST /api/transactions/:id/stage`
- `POST /api/transactions/:id/original-bl`
- `POST /api/transactions/:id/pay`
- `POST /api/transactions/:id/release`

## 7.3 Transfers module

- `GET/POST /api/transfers`
- `GET/PUT/DELETE /api/transfers/:id`
- `POST /api/transfers/:id/stage`
- `POST /api/transfers/:id/pay`
- `POST /api/transfers/:id/release`

## 7.4 Exports module

- `GET/POST /api/exports`
- `GET/PUT/DELETE /api/exports/:id`
- `POST /api/exports/:id/stage`
- `POST /api/exports/:id/pay`
- `POST /api/exports/:id/release`

---

## 8. Web App (`apps/web`)

Implemented authenticated React SPA with:

- Unified list/detail/form UX for transactions, transfers, and exports
- Route groups: `/`, `/transactions/*`, `/transfers/*`, `/exports/*`
- Employee, clients, and shipping-company management screens
- Search + status/stage filters + pagination
- JWT stored in `localStorage`; token attached by shared API helper
- Arabic/English i18n support
- Attachment upload/category support in forms

Default API base in `apps/web/src/types.ts`: `http://localhost:4000`.

---

## 9. Mobile App (`apps/app`)

Flutter app includes:

- Auth flow with remember-me behavior (shared preferences)
- Dashboard + transactions tab + clients/shipping/employees/profile screens
- Arabic/English localization
- API host configuration via `API_BASE` dart define with runtime fallback logic in API client

---

## 10. Data Seeding

- `seed-test-data.sh`: seeds large test dataset for clients/transactions.
- `seed-shipping-linked-data.sh`: seeds shipping companies and linked transaction data.

---

## 11. Local Run

```bash
npm install
npm run dev:api
npm run dev:web
```

Production build:

```bash
npm run build
```

---

## 12. Project Change Notes (Current State)

These are the key applied changes reflected by the current codebase:

1. Scope expanded from only transactions to three operational modules: transactions, transfers, exports.
2. API now exposes full CRUD + stage/pay/release flows for transfers and exports in addition to transactions.
3. Declaration numbers are generated with atomic Mongo counters per module prefix (`DXB`, `TRF`, `EXP`) to avoid duplicate collisions.
4. Stage logic includes field-lock behavior and auto-advance on `documentArrivalDate`.
5. Attachment handling supports categorized uploads, retained-file merge on update, and orphan file cleanup.
6. Web UI provides module switching, role-aware actions, list filtering/pagination, and i18n.
7. Mobile app includes persisted auth preferences, localized UI, and broader operational dashboards/tabs.

---

## 13. Summary

The repository currently implements a role-based customs operations tracker across web and mobile clients, backed by a shared Express/Mongo API, covering transactions, transfers, and exports with staged workflows, document attachments, and payment/release controls.
