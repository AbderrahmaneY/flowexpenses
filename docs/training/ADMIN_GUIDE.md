# Training Guide: Administrator (Power User)

## Your Role

As Administrator, you have full access to:
- Manage users and roles
- Configure system settings
- Access all dashboards
- Reset passwords
- Monitor all expenses

---

## 🔐 Accessing Admin Panel

1. Login with admin credentials
2. Click **Admin** in the navigation
3. You'll see tabs for **Users** and **Roles**

---

## 👥 User Management

### Viewing Users
Navigate to Admin → Users to see all users with:
- Name and email
- Assigned role
- Manager assignment

### Creating a New User

1. Click **+ New User**
2. Fill in required fields:

| Field | Description |
|-------|-------------|
| Name | Full name |
| Email | Must be unique |
| Password | Minimum 8 characters |
| Role | Select from dropdown |
| Manager | (Optional) Assign reporting manager |

3. Click **Save**

### Editing a User

1. Click **Edit** on any user row
2. Modify fields as needed
3. Leave password blank to keep current
4. Click **Save**

### Resetting a Password

**From User List (Quick Method):**
1. Go to Admin → Users
2. Click **🔑 Reset** button on any user row
3. Enter new password (min 8 chars)
4. User will be forced to change password on next login

**From Edit Page:**
1. Click **Edit** on user row
2. Click **Force Reset** button
3. Enter new password (min 8 chars)
4. User will be forced to change password on next login

---

## 🏷️ Role Management

### Default Roles

| Role | Permissions |
|------|-------------|
| Employee | Can Submit |
| Manager | Can Submit + Approve |
| Accountant | Can Process |
| Admin | All permissions |

### Creating a Custom Role

1. Go to Admin → Roles
2. Click **+ New Role**
3. Enter name and description
4. Toggle permissions:
   - **Can Submit** - Create expenses
   - **Can Approve** - Approve team expenses
   - **Can Process** - Accounting actions
   - **Is Admin** - Full system access
5. Click **Save**

### Editing a Role

1. Click **Edit** on role row
2. Modify permissions
3. Changes apply to all users with this role

### Deleting a Role

⚠️ Cannot delete a role that has users assigned.

1. First reassign users to different role
2. Then delete the role

---

## 📊 Monitoring

### View All Expenses
From your Dashboard, you can see all expenses across the system.

### Accounting Dashboard
Access the full analytics as an Admin.

### User Activity
Check the Approvals and expenses to see workflow status.

---

## 🔐 Security Tasks

### Regular Maintenance
- [ ] Review user list monthly
- [ ] Remove inactive accounts
- [ ] Audit role permissions quarterly
- [ ] Change API keys annually

### Password Policies
- Enforce minimum 8 characters
- Recommend changing every 90 days
- Never share admin credentials

---

## 🛠️ System Configuration

### Environment Variables
Managed in `.env` file on server:

```env
DATABASE_URL=...
WEBHOOK_API_KEY=...
DATA_API_KEY=...
```

### Logo/Branding
Replace `public/branding/logo.png` with your company logo.

### Email Templates (Future)
Configure in Admin settings.

---

## 📤 Data Export

### For Finance Team
Use the CSV export from Accounting dashboard.

### For Data Team
Share the Data API key:
```bash
GET /api/data/expenses
Header: x-api-key: YOUR_DATA_API_KEY
```

### For ERP Integration
Share the Webhook URL and API key:
```
POST /api/webhooks/expense-status
Header: x-api-key: YOUR_WEBHOOK_API_KEY
```

---

## ⚠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| User can't login | Reset their password |
| User missing features | Check their role permissions |
| Role changes not working | User needs to re-login |
| Data API failing | Verify API key in headers |

---

## 📞 Technical Support

For server issues, contact DevOps team.
For feature requests, contact dev-team@yolafresh.com

---

© YoLa Fresh - Expense Management
