# Transaction Tracker Monorepo

Internal transaction tracking platform for customs operations with role-based access, staged transaction workflow, and MongoDB persistence.

## Tech Stack

- Backend: Node.js, Express, TypeScript, Mongoose, MongoDB
- Auth: JWT (`Authorization: Bearer <token>`)
- Web: React + Vite + TypeScript + React Router
- Mobile: Flutter (`apps/app`)

## Repository Layout

- `apps/api`: REST API, auth, role checks, stage transitions, business rules
- `apps/web`: login + dashboard + CRUD screens + attachments + stage controls
- `apps/app`: Flutter client for transactions, details, and form editing
- `seed-test-data.sh`: bulk seed clients + transactions
- `seed-shipping-linked-data.sh`: seed shipping companies + linked transactions

## Roles

- `manager`: full access (transactions, clients, shipping companies, employees, accounting actions)
- `employee`: create/update/delete transactions and original-BL action; **stage 1** fields only on `PUT`; cannot pay, release, or change `paymentStatus`
- `employee2`: list/read transactions, change stage (`POST .../stage`), **stage 2** fields only on `PUT` (`containerArrivalDate`, `documentArrivalDate`, `fileNumber`, `documentStatus`, `clearanceStatus`); cannot create/delete transactions, upload attachments on `PUT`, or change `paymentStatus`
- `accountant`: read transactions; pay and release; `PUT` may **only** set `paymentStatus`

Default accounts are auto-seeded on API startup:

- `manager@tracker.local` / `123456`
- `employee@tracker.local` / `123456`
- `employee2@tracker.local` / `123456`
- `accountant@tracker.local` / `123456`

## Core Features

- Transaction create/edit/delete with stage model:
  - `PREPARATION`
  - `CUSTOMS_CLEARANCE`
  - `STORAGE`
  - `INTERNAL_DELIVERY`
  - `EXTERNAL_TRANSFER`
- Stage transition endpoint with validation and transition guards
- Preparation completeness check before moving from `PREPARATION` to `CUSTOMS_CLEARANCE` (server validates required preparation fields on the saved transaction)
- Auto stage bump: setting `documentArrivalDate` on create/update can move the transaction toward `CUSTOMS_CLEARANCE` per `store.ts` (in addition to explicit `POST .../stage`)
- Risk simulation and channel mapping
- Duty calculation (`5% + 100`)
- Payment + release flow with rule checks
- Clients and shipping companies management (detail routes in web UI)
- Staff directory: `GET /api/employees` (all authenticated); create/update/delete employees (manager only)
- Document attachments upload (images/PDF) with categories; files served under `/uploads` on the API host
- Arabic/English localization (web and app)
- Create/update payloads require **`isStopped`** (boolean); if stopped, **`stopReason`** is required before advancing to customs clearance

## API Endpoints

- `GET /health`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/employees` (authenticated)
- `POST /api/employees` (manager)
- `PUT /api/employees/:id` (manager)
- `DELETE /api/employees/:id` (manager)
- `GET /api/clients`
- `GET /api/clients/:id`
- `POST /api/clients` (manager)
- `PUT /api/clients/:id` (manager)
- `DELETE /api/clients/:id` (manager)
- `GET /api/shipping-companies`
- `GET /api/shipping-companies/:id`
- `POST /api/shipping-companies` (manager)
- `PUT /api/shipping-companies/:id` (manager)
- `DELETE /api/shipping-companies/:id` (manager)
- `GET /api/transactions` (optional query: `?clientId=<id>`)
- `POST /api/transactions` (manager, employee; multipart supported)
- `GET /api/transactions/:id`
- `PUT /api/transactions/:id` (authenticated; role-based field rules; multipart supported except employee2)
- `DELETE /api/transactions/:id` (manager, employee)
- `POST /api/transactions/:id/stage` (manager, employee2)
- `POST /api/transactions/:id/original-bl` (manager, employee)
- `POST /api/transactions/:id/pay` (manager, accountant)
- `POST /api/transactions/:id/release` (manager, accountant)

## Run Locally

```bash
npm install
```

Start API:

```bash
npm run dev:api
```

Start web:

```bash
npm run dev:web
```

Production build (API + web):

```bash
npm run build
```

Default Mongo URI:

```bash
mongodb://127.0.0.1:27017/customs_broker_track
```

Override env example:

```bash
MONGO_URI="mongodb://127.0.0.1:27017/customs_broker_track" JWT_SECRET="change-me" npm run dev:api
```

## Seed Data

```bash
./seed-test-data.sh
./seed-shipping-linked-data.sh
```

## Flutter API Host

For emulator/device usage, configure reachable API host via:

```bash
flutter run --dart-define=API_BASE=http://<your-lan-ip>:4000
```

Android emulator alias: `http://10.0.2.2:4000`.
