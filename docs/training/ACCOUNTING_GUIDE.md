# Training Guide: Accounting

## Your Role

As Accounting staff, you:
- Process manager-approved expenses
- Validate expenses for payment
- Mark expenses as paid
- Export reports for finance

---

## 🔐 Logging In

1. Go to `https://expenses.yolafresh.com`
2. Enter your credentials
3. You'll see the **Accounting** badge

> To change your password: Click your name → Change Password

---

## 📊 Your Dashboard

Your dashboard shows:
- Quick link to **Accounting Analytics**
- Overview of all expenses in the system
- Status breakdown

---

## 📈 Accounting Analytics

Click **Go to Analytics** or **Accounting** in the nav to see:

### Summary Cards:
- **Total Requested** - All submitted expenses
- **Approved for Payment** - Ready to pay
- **Total Executed** - Already paid
- **Pending Validation** - Needs your review

### Charts:
- Monthly execution trend
- Expense breakdown by category

---

## 💰 Processing Expenses

### Viewing the Queue
Navigate to the Accounting dashboard to see all pending expenses.

### For Each Expense:

| Action | When to Use |
|--------|-------------|
| 💰 **Pay** | Approve and mark as paid |
| 📝 **Details** | Need more information |
| ❌ **Reject** | Invalid or policy violation |

### Marking as Paid
1. Click **Pay** button
2. Expense status changes to "PAID"
3. Appears in "Total Executed" metrics

### Requesting Details
1. Click **Details**
2. Enter what's needed (e.g., "Missing original invoice")
3. User is notified to fix and resubmit

### Rejecting
1. Click **Reject**
2. Enter rejection reason
3. Expense is final-rejected

---

## 📤 Exporting Reports

### CSV Export (Last 30 Days)
1. Go to Accounting dashboard
2. Click **Export Last 30 Days (CSV)**
3. File downloads automatically

### Custom Date Range
Use the Data API:
```
GET /api/reports/export?startDate=2025-12-01&endDate=2025-12-15
```

---

## 📊 Metrics Explained

| Metric | Calculation |
|--------|-------------|
| Total Requested | Sum of all SUBMITTED+ expenses |
| Total Approved | Sum of MANAGER_APPROVED expenses |
| Total Executed | Sum of PAID expenses |
| Pending Validation | Count of expenses awaiting your action |

---

## 🔄 Workflow Summary

```
Employee Submits
       ↓
Manager Approves/Rejects
       ↓
You Validate/Pay
       ↓
Finance Processes Payment
```

---

## ⚠️ Best Practices

✅ **Do:**
- Process expenses within 5 business days
- Verify receipts match claims
- Keep accurate records
- Export reports weekly for finance

❌ **Don't:**
- Approve without receipts
- Skip budget verification
- Process duplicate payments

---

## ❓ Need Help?

Contact admin@yolafresh.com

---

© YoLa Fresh - Expense Management
