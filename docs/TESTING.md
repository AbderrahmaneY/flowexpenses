# FlowExpenses — Testing Guide

## 1. Login Credentials Summary
These users are seeded in the database (via `npm run db:seed` or `prisma/seed.ts`).

| Role       | Email                | Password      | Permissions                     |
|------------|----------------------|---------------|----------------------------------|
| **Admin**  | `admin@flow.com`       | `password123` | Admin, Submitter                 |
| **Manager**| `manager@flow.com`     | `password123` | Manager (Approve), Submitter     |
| **Account**| `accounting@flow.com`  | `password123` | Accounting (Process)             |
| **User**   | `emma@flow.com`        | `password123` | Submitter (reports to Marie/Manager)|
| **User**   | `eric@flow.com`        | `password123` | Submitter (reports to Marie/Manager)|

---

## 2. Manual Test Checklist

### Auth
- [ ] Login as `emma@flow.com` → Redirects to dashboard (My Expenses)
- [ ] Navigation shows: **Home**, **My Expenses** (No Admin, No Dashboard link for metrics)
- [ ] Logout works and redirects to login

### Submitter Flow (emma@flow.com)
- [ ] **Create**: Can create new expense (Draft)
- [ ] **Submit**: Can submit expense (Status changes to `SUBMITTED`)
- [ ] **View**: Can see own expenses in list
- [ ] **Guard**: Cannot approve own expense (Actions hidden/forbidden)
- [ ] **Guard**: Cannot access `/admin` (Redirect or 403)

### Manager Flow (manager@flow.com)
- [ ] **Approvals**: Can see pending approvals from team (`emma@flow.com`)
- [ ] **Action**: Can **Approve** expense (Status changes to `MANAGER_APPROVED`)
- [ ] **Action**: Can **Reject** expense (Status changes to `MANAGER_REJECTED`)
- [ ] **Submit**: Can submit own expense (as a user)
- [ ] **Guard**: Cannot access `/admin`

### Accounting Flow (accounting@flow.com)
- [ ] **Validation**: Can see `MANAGER_APPROVED` expenses in list
- [ ] **Action**: Can **Process/Pay** expense (Category: `ACCOUNTING_VALIDATED` or `PAID`)
- [ ] **Dashboard**: Can access **Dashboard** link
- [ ] **Metrics**: Dashboard shows updated totals (Requested, Approved, Executed)
- [ ] **Charts**: Monthly trend chart renders (if data exists)

### Admin Flow (admin@flow.com)
- [ ] **Access**: Can click **Admin** link in navigation
- [ ] **Users**: Can list all users
- [ ] **Create**: Can create new user with specific role flags (e.g. `canApprove`)
- [ ] **Edit**: Can edit existing user details and permissions
- [ ] **Delete**: Can delete a user (but not self)
- [ ] **Guard**: Admin is also a submitter by default (flag check)

### Edge Cases & UI ++
- [ ] **Empty States**: Dashboard/Lists show friendly message when empty
- [ ] **Responsiveness**: Mobile view works for tables and forms
- [ ] **YolaFresh**: Styles (colors, fonts) match the new design system
