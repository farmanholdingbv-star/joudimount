# Transaction Tracker Monorepo

Internal transaction tracking system with role-based operations, shipping-company linkage, and MongoDB persistence.

## Stack

- Backend: Node.js, Express, TypeScript, Mongoose, MongoDB
- Auth: JWT (`Authorization: Bearer <token>`)
- Web: React + Vite + TypeScript + React Router
- Mobile: Flutter starter (`apps/app`)

## Project Structure

- `apps/api`: REST API, auth, role checks, business logic
- `apps/web`: login + dashboard + CRUD screens (transactions/clients/shipping companies)
- `apps/app`: mobile starter
- `seed-test-data.sh`: bulk seed clients + transactions
- `seed-shipping-linked-data.sh`: seed shipping companies + linked transactions

## Roles

- `manager`: full access (transactions + clients + shipping companies + accounting actions)
- `employee`: transactions management (except accounting fields/actions)
- `accountant`: accounting/billing actions on transactions

Default login accounts are auto-seeded when API starts:

- `manager@tracker.local` / `123456`
- `employee@tracker.local` / `123456`
- `accountant@tracker.local` / `123456`

## Key Features

- Transaction CRUD with:
  - required `shippingCompanyName`
  - optional `shippingCompanyId`
  - `createdAt`/`updatedAt` timestamps
- Risk simulation and channel mapping
- Duty calculation (`5% + 100`)
- Payment and release flow with rule checks
- Clients section (manager CRUD)
- Shipping Companies section (manager CRUD)
- Transaction list UI upgrades:
  - top menu bar
  - auto search box
  - status/channel filters
  - created datetime + shipping company columns
- Arabic/English language switcher (Arabic default)

## API Endpoints

- `GET /health`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/clients`
- `POST /api/clients` (manager)
- `PUT /api/clients/:id` (manager)
- `DELETE /api/clients/:id` (manager)
- `GET /api/shipping-companies`
- `POST /api/shipping-companies` (manager)
- `PUT /api/shipping-companies/:id` (manager)
- `DELETE /api/shipping-companies/:id` (manager)
- `GET /api/transactions`
- `POST /api/transactions`
- `GET /api/transactions/:id`
- `PUT /api/transactions/:id`
- `DELETE /api/transactions/:id`
- `POST /api/transactions/:id/original-bl`
- `POST /api/transactions/:id/pay`
- `POST /api/transactions/:id/release`

## Run

```bash
npm install
```

Start API:

```bash
npm run dev:api
```

Default Mongo URI:

```bash
mongodb://127.0.0.1:27017/customs_broker_track
```

Override example:

```bash
MONGO_URI="mongodb://127.0.0.1:27017/customs_broker_track" JWT_SECRET="change-me" npm run dev:api
```

Start web (new terminal):

```bash
npm run dev:web
```

## Seed Data

General seed:

```bash
./seed-test-data.sh
```

Shipping-linked seed:

```bash
./seed-shipping-linked-data.sh
```

## Flutter Note

For emulator/device usage, replace `localhost` API host as needed (for Android emulator use `10.0.2.2`).
