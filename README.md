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

- `manager`: full access
- `employee`: can create/edit transactions, cannot do accounting actions
- `employee2`: stage/operations role for customs/storage workflow edits
- `accountant`: accounting actions and restricted payment updates

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
- Preparation completeness check before moving to customs clearance
- Risk simulation and channel mapping
- Duty calculation (`5% + 100`)
- Payment + release flow with rule checks
- Clients and shipping companies management
- Document attachments upload (images/PDF) with categories
- Arabic/English localization (web and app)

## API Endpoints

- `GET /health`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
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
- `GET /api/transactions`
- `POST /api/transactions`
- `GET /api/transactions/:id`
- `PUT /api/transactions/:id`
- `DELETE /api/transactions/:id`
- `POST /api/transactions/:id/stage`
- `POST /api/transactions/:id/original-bl`
- `POST /api/transactions/:id/pay`
- `POST /api/transactions/:id/release`

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
