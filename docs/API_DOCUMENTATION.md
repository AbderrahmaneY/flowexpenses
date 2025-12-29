# YoLa Fresh - API Documentation

## Base URL
```
Production: https://expenses.yolafresh.com/api
Development: http://localhost:3000/api
```

---

## Authentication

All protected endpoints require a valid session cookie obtained via login.

### POST `/auth/login`
Authenticate a user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@flow.com"
  }
}
```

### POST `/auth/logout`
End current session.

### GET `/auth/me`
Get current authenticated user.

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@flow.com",
    "canSubmit": true,
    "canApprove": true,
    "canProcess": true,
    "isAdmin": true
  }
}
```

---

## Expenses

### GET `/expenses`
List expenses (filtered by user role).

**Query Parameters:**
- `status` - Filter by status (DRAFT, SUBMITTED, etc.)

**Response (200):**
```json
[
  {
    "id": 1,
    "title": "Team Lunch",
    "amount": 45.00,
    "currency": "USD",
    "category": "meal",
    "currentStatus": "SUBMITTED",
    "dateOfExpense": "2025-12-12T00:00:00.000Z",
    "user": { "name": "Emma Employee", "email": "emma@flow.com" }
  }
]
```

### POST `/expenses`
Create new expense.

**Request:**
```json
{
  "title": "Client Dinner",
  "amount": 120.50,
  "currency": "USD",
  "category": "meal",
  "dateOfExpense": "2025-12-12",
  "description": "Business dinner with client",
  "status": "SUBMITTED"
}
```

### GET `/expenses/[id]`
Get expense details with attachments.

### POST `/expenses/[id]/attachments`
Upload files (multipart/form-data).

---

## Approvals

### GET `/approvals`
Get pending approvals for current user.

### POST `/approvals/action`
Approve, reject, or request details.

**Request:**
```json
{
  "expenseId": 1,
  "action": "approve",  // or "reject", "REQUEST_DETAILS", "PAY"
  "comment": "Optional comment"
}
```

---

## Reports

### GET `/reports/export`
Export expenses as CSV.

**Query Parameters:**
- `startDate` - YYYY-MM-DD (optional)
- `endDate` - YYYY-MM-DD (optional, max 31 days range)

**Response:** CSV file download

---

## Data API (For Data Team)

### GET `/data/expenses`
**🔐 Requires API Key**

Fetch all expense data for analytics/reporting.

**Headers:**
```
x-api-key: your-data-api-key
```

**Query Parameters:**
- `startDate` - YYYY-MM-DD (optional)
- `endDate` - YYYY-MM-DD (optional)
- `status` - Filter by status (optional)
- `format` - `json` (default) or `csv`

**Response (200):**
```json
{
  "total": 150,
  "data": [
    {
      "id": 1,
      "title": "Team Lunch",
      "amount": 45.00,
      "currency": "USD",
      "category": "meal",
      "status": "PAID",
      "dateOfExpense": "2025-12-12",
      "createdAt": "2025-12-12T10:00:00.000Z",
      "user": {
        "id": 5,
        "name": "Emma Employee",
        "email": "emma@flow.com"
      },
      "approvalSteps": [
        {
          "stepType": "MANAGER",
          "status": "APPROVED",
          "resolvedAt": "2025-12-12T11:00:00.000Z"
        }
      ]
    }
  ]
}
```

---

## Webhooks (ERP Integration)

### POST `/webhooks/expense-status`
**🔐 Requires API Key**

Receive status updates from external ERP systems.

**Headers:**
```
x-api-key: your-webhook-api-key
Content-Type: application/json
```

**Request:**
```json
{
  "expenseId": 1,
  "status": "PAID",
  "paymentReference": "PAY-2025-001",
  "notes": "Processed via SAP"
}
```

---

## Admin Endpoints

### GET `/admin/users`
List all users (Admin only).

### POST `/admin/users`
Create new user.

### PUT `/admin/users/[id]`
Update user.

### POST `/admin/users/[id]/reset-password`
Reset user password.

**Request:**
```json
{
  "newPassword": "newSecurePassword123"
}
```

### GET `/admin/roles`
List all roles.

### POST `/admin/roles`
Create new role.

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200  | Success |
| 201  | Created |
| 400  | Bad Request |
| 401  | Unauthorized (not logged in) |
| 403  | Forbidden (no permission) |
| 404  | Not Found |
| 500  | Server Error |

---

## Expense Statuses

| Status | Description |
|--------|-------------|
| DRAFT | Saved but not submitted |
| SUBMITTED | Awaiting manager approval |
| MANAGER_APPROVED | Approved, awaiting accounting |
| MANAGER_REJECTED | Rejected by manager |
| DETAILS_REQUESTED | Needs more info from submitter |
| ACCOUNTING_VALIDATED | Validated by accounting |
| ACCOUNTING_REJECTED | Rejected by accounting |
| PAID | Payment completed |

---

© Abderrahmane Naciri Bennani - Dec 2025
