# YoLa Fresh - Technical Documentation

## For Development & DevOps Teams

---

## 📁 Project Structure

```
yolafresh-expenses/
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── seed.ts            # Initial data seeding
│   └── migrations/        # Migration files
├── public/
│   ├── branding/          # Logo and assets
│   └── uploads/           # User uploaded files
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── api/           # API endpoints
│   │   ├── admin/         # Admin panel pages
│   │   ├── accounting/    # Accounting dashboard
│   │   ├── approvals/     # Approvals page
│   │   ├── dashboard/     # Main dashboard
│   │   ├── expenses/      # Expense pages
│   │   └── login/         # Authentication
│   ├── components/        # Reusable React components
│   └── lib/               # Utilities (auth, prisma, permissions)
├── docs/                  # Documentation
└── tests/                 # Test files
```

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS, Custom CSS |
| Backend | Next.js API Routes |
| Database | SQLite (dev) / PostgreSQL (prod) |
| ORM | Prisma 6 |
| Auth | JWT Sessions (iron-session) |
| Charts | Recharts |

---

## 🗄️ Database Schema

### Models

```prisma
model Role {
  id          Int       @id @default(autoincrement())
  name        String    @unique
  description String?
  canSubmit   Boolean   @default(false)
  canApprove  Boolean   @default(false)
  canProcess  Boolean   @default(false)
  isAdmin     Boolean   @default(false)
  users       User[]
}

model User {
  id        Int      @id
  name      String
  email     String   @unique
  password  String   # bcrypt hashed
  mustChangePassword Boolean  # Force password change on next login
  roleId    Int
  role      Role     @relation
  managerId Int?
  manager   User?    @relation
}

model ExpenseReport {
  id              Int
  userId          Int
  title           String
  amount          Float
  currency        String
  category        String
  currentStatus   String   # See status enum below
  dateOfExpense   DateTime
  attachments     Attachment[]
  approvalSteps   ApprovalStep[]
}

model Attachment {
  id              Int
  expenseReportId Int
  filePath        String
  fileName        String
  fileType        String
  fileSize        Int
}

model ApprovalStep {
  id              Int
  expenseReportId Int
  stepType        String   # MANAGER, ACCOUNTING
  status          String   # PENDING, APPROVED, REJECTED
  comment         String?
  approvedByUserId Int?
  resolvedAt      DateTime?
}
```

### Status Flow
```
DRAFT → SUBMITTED → MANAGER_APPROVED → PAID
                 ↘ MANAGER_REJECTED
                 ↘ DETAILS_REQUESTED → (re-submit)
       MANAGER_APPROVED → ACCOUNTING_VALIDATED → PAID
                       ↘ ACCOUNTING_REJECTED
```

---

## 🔐 Authentication System

### Session Management
- Uses `jose` for JWT signing
- Cookies stored with `httpOnly` flag
- Session expires after 24 hours

### Key Files:
- `src/lib/auth.ts` - Session creation/validation
- `src/lib/permissions.ts` - Role-based access control

### Session Payload:
```typescript
interface SessionPayload {
  userId: number;
  email: string;
  name: string;
  roleId: number;
  roleName: string;
  canSubmit: boolean;
  canApprove: boolean;
  canProcess: boolean;
  isAdmin: boolean;
  mustChangePassword: boolean;  // Force password change
}
```

---

## 🛡️ Security Features (Internal Pilot)

### Password Policy
- **Force Change:** `mustChangePassword` flag on User model
- Admin reset sets `mustChangePassword=true`
- Users redirected to `/change-password` until password is changed
- Minimum 8 characters required

### Rate Limiting
| Endpoint | Limit |
|----------|-------|
| `/api/auth/login` | 5 requests / 15 min |
| `/api/approvals/action` | 30 requests / min |
| `/api/data/expenses` | 60 requests / min |

### File Upload Security
- **Allowed types:** PDF, JPG, PNG only
- **Max size:** 2MB per file
- **Magic byte validation:** Checks file content signature
- **UUID filenames:** Original filename never stored in path

### Security Banner
- Shows warning when HTTPS not enabled
- Controlled by `NEXT_PUBLIC_SHOW_PILOT_BANNER=true`

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login (rate limited) |
| POST | `/api/auth/logout` | End session |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/change-password` | Change password |

### Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses` | List expenses |
| POST | `/api/expenses` | Create expense |
| GET | `/api/expenses/[id]` | Get expense details |
| POST | `/api/expenses/[id]/attachments` | Upload files |

### Approvals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/approvals` | Get pending approvals |
| POST | `/api/approvals/action` | Approve/reject/request |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/admin/users` | User CRUD |
| PUT | `/api/admin/users/[id]` | Update user |
| POST | `/api/admin/users/[id]/reset-password` | Reset password |
| GET/POST | `/api/admin/roles` | Role CRUD |

### Data Export
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/export` | CSV export (session auth) |
| GET | `/api/data/expenses` | Data API (API key auth) |

### Webhooks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhooks/expense-status` | ERP integration |

---

## 🔑 Environment Variables

```env
# Required
DATABASE_URL="file:./dev.db"

# API Keys (optional, defaults provided)
WEBHOOK_API_KEY="your-webhook-key"
DATA_API_KEY="your-data-api-key"

# Security/Pilot
NEXT_PUBLIC_SHOW_PILOT_BANNER="true"  # Shows security warning banner
```

---

## 🚀 Development Workflow

### Setup
```bash
git clone <repo>
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev
```

### Database Changes
```bash
# Edit schema.prisma
npx prisma migrate dev --name description_of_change
```

### Adding New API
1. Create file in `src/app/api/[route]/route.ts`
2. Export HTTP method handlers (GET, POST, etc.)
3. Use `getSession()` for auth
4. Use permission checks from `src/lib/permissions.ts`

### Adding New Pages
1. Create folder in `src/app/[pagename]/`
2. Add `page.tsx` (server component)
3. Add `Client.tsx` if needs interactivity

---

## 🔍 Key Components

| Component | Purpose |
|-----------|---------|
| `Navigation.tsx` | Top navbar with role-based links |
| `BackButton.tsx` | Back/Home navigation |
| `EmployeeDashboard.tsx` | Employee's expense view |
| `ManagerDashboard.tsx` | Manager's approval queue |
| `AccountingDashboard.tsx` | Accounting overview |
| `AccountingChart.tsx` | Recharts visualization |

---

## 🐛 Debugging

### Prisma Studio
```bash
npx prisma studio
# Opens at http://localhost:5555
```

### API Testing
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@flow.com","password":"password123"}'

# Data API
curl -H "x-api-key: YOUR_KEY" \
  http://localhost:3000/api/data/expenses
```

### Logs
In development, Next.js shows server logs in terminal.
In production with PM2: `pm2 logs yolafresh`

---

## 📦 Deployment Checklist

- [ ] Set production `DATABASE_URL`
- [ ] Generate secure API keys
- [ ] Run `npx prisma migrate deploy`
- [ ] Run `npm run build`
- [ ] Configure reverse proxy
- [ ] Setup SSL
- [ ] Change default passwords
- [ ] Test all user flows
- [ ] Verify file uploads work

---

## 🔄 CI/CD (Suggested)

### GitHub Actions Example
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npx prisma generate
      - run: npm run build
      - run: # Deploy to server
```

---

## 📞 Support Contacts

| Role | Contact |
|------|---------|
| Project Lead | lead@yolafresh.com |
| Backend Dev | backend@yolafresh.com |
| DevOps | devops@yolafresh.com |

---

© Abderrahmane Naciri Bennani - Dec 2025
