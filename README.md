# Hotel Revenue & Multi-Level Partner Commission Engine

A standalone, reusable commission engine prototype for hotel bookings with multi-level partner commissions, customer slot assignment, and wallet management.

## Tech Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL with Prisma ORM

## Quick Start

### 1. Start PostgreSQL

```bash
docker compose up -d
```

### 2. Create the database (only if not using Docker)

If you use your own PostgreSQL server, create the database once:

```sql
CREATE DATABASE commission_db;
```

Docker Compose creates `commission_db` automatically — skip this step.

### 3. Backend — run migrations

```bash
cd backend
npm install
npm run db:generate
npm run db:migrate:deploy   # applies prisma/migrations/*
npm run db:seed             # optional sample data
npm run dev
```

**Migration commands:**

| Command | When to use |
|---------|-------------|
| `npm run db:migrate:deploy` | Apply existing migrations (production / first setup) |
| `npm run db:migrate` | Create a new migration during development |
| `npm run db:setup` | Generate client + migrate + seed in one step |

API runs at `http://localhost:4000`

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Dashboard at `http://localhost:3000`

## Architecture

```
Frontend (Next.js)
       │
       ▼
REST API (Express)
       │
       ▼
Booking Module
       │
       ▼
Commission Engine  ←── all revenue & commission logic
       │
       ▼
PostgreSQL (Prisma)
```

## Commission Engine

The engine is independent and reusable:

```typescript
CommissionEngine.processBooking({
  customerId,
  partnerId,
  hotelId,
  bookingAmount,
  productType: "HOTEL",
});
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/partners` | Partner CRUD |
| GET/POST | `/api/hotels` | Hotel CRUD |
| GET/PUT | `/api/config` | Commission configuration |
| POST | `/api/bookings` | Create booking + run engine |
| GET | `/api/bookings/history` | Booking history |
| GET | `/api/commission/slots/:customerId` | Customer slots |
| GET | `/api/commission/wallet/:partnerId` | Partner wallet |
| GET | `/api/commission/revenue-report` | Revenue report |

## Seed Data

- Partners A, B, C, D (no per-partner commission rates)
- 4 hotels mapped to partners
- Default config: Travacot 15%, Transaction Fee 4%, Safety Net 50%, Slot commissions 20% / 15% / 10%

## Formulas

- **Travacot Revenue** = Booking Amount × Travacot %
- **Transaction Fee** = Booking Amount × Transaction Fee %
- **Owner Net Revenue** = Travacot Revenue − Transaction Fee
- **Safety Net** = Owner Net Revenue × Safety Net %
- **Slot Commission** = Commission Base × Slot Rate % (rate depends on slot 1/2/3, not the partner)

Commission base is configurable: Safety Net, Owner Net Revenue, or Travacot Revenue.
