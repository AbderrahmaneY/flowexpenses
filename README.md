# FlowExpenses

A premium expense management application built with Next.js, Prisma, and SQLite.

## Features

- **Role-Based Access**: Employee, Manager, Director, Accounting roles.
- **Expense Workflow**: Create -> Submit -> Manager Approval -> Director Approval (if high value) -> Accounting Validation -> Paid.
- **Dashboards**: Tailored views for each role.
- **Tech Stack**: Next.js 15+, Prisma 7, SQLite, Vanilla CSS Design System.

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Setup Database**
   The project uses SQLite.
   ```bash
   # Initialize DB (if needed)
   npx prisma migrate dev
   
   # Reset and Seed (Manual Script)
   node scripts/seed.js
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## Demo Credentials

All passwords are: `password123`

| Role       | Email                | Permissions |
|------------|----------------------|-------------|
| Employee   | employee@flow.com    | Create & specific view |
| Manager    | manager@flow.com     | Approve team expenses |
| Director   | director@flow.com    | Approve high-value expenses |
| Accounting | accounting@flow.com  | Validate & Pay |

## Business Rules

- **Meals**: No director approval needed (Limit $50).
- **Transport**: No director approval needed (Limit $1000).
- **Hotel**: Requires **Director Approval** (Limit $200).

## Project Structure

- `src/app`: Next.js App Router pages and API routes.
- `src/lib`: Shared utilities (Auth, Prisma Singleton).
- `src/components`: Dashboard logic per role.
- `prisma`: Database schema.
- `scripts`: Manual seed script (`seed.js`).

## Troubleshooting

- If you see `PrismaClientInitializationError`, ensure `scripts/seed.js` or `src/lib/prisma.ts` is using the shared singleton or correctly configured adapter (bundled in this repo).
