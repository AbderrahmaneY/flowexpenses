# Internal Pilot Security - Manual Test Checklist

## Test Environment
- Date: ___________
- Tester: ___________
- Build Version: ___________

---

## 1. Password Policy Tests

### 1.1 Forced Password Change
- [ ] Login as admin@flow.com with password123
- [ ] Admin resets another user's password via Admin → Users → Edit → Force Reset
- [ ] Logout and login as that user with new temporary password
- [ ] **Expected:** User is redirected to /change-password
- [ ] **Expected:** User cannot navigate to other pages without changing password
- [ ] Change password successfully (min 8 chars)
- [ ] **Expected:** Redirect to dashboard after password change

### 1.2 Password Validation
- [ ] Try changing to password less than 8 characters
- [ ] **Expected:** Error message "New password must be at least 8 characters"
- [ ] Try mismatched passwords
- [ ] **Expected:** Error message "Passwords do not match"
- [ ] Try wrong current password
- [ ] **Expected:** Error message "Current password is incorrect"

---

## 2. Rate Limiting Tests

### 2.1 Login Rate Limit
- [ ] Go to /login
- [ ] Enter wrong password 5 times in a row
- [ ] **Expected:** After 5 attempts, see "Too many login attempts. Try again in X seconds."
- [ ] **Expected:** HTTP 429 response
- [ ] Wait 15 minutes (or restart server to reset)
- [ ] **Expected:** Can login again

### 2.2 Approvals Rate Limit (Optional)
- [ ] As manager, rapidly approve/reject many expenses
- [ ] **Expected:** After 30 actions per minute, rate limited

---

## 3. File Upload Security Tests

### 3.1 File Type Validation
- [ ] Go to /expenses/new
- [ ] Try uploading a .txt file
- [ ] **Expected:** Error "Invalid file type. Use PDF, JPG, or PNG."
- [ ] Try uploading a .gif file
- [ ] **Expected:** Error "Invalid file type"
- [ ] Upload valid PDF file
- [ ] **Expected:** Success
- [ ] Upload valid JPG file
- [ ] **Expected:** Success
- [ ] Upload valid PNG file
- [ ] **Expected:** Success

### 3.2 File Size Validation
- [ ] Try uploading a file larger than 2MB
- [ ] **Expected:** Error "File too large (max 2MB)"

### 3.3 Magic Byte Validation
- [ ] Rename a .txt file to .jpg and try uploading
- [ ] **Expected:** Error "File content doesn't match type. Possible tampering."

### 3.4 UUID Filenames
- [ ] Upload a valid file
- [ ] Check public/uploads/{expenseId}/ directory
- [ ] **Expected:** Filename is a UUID (e.g., `a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg`)
- [ ] **Expected:** Original filename is NOT used in path

---

## 4. Security Banner Tests

### 4.1 Banner Visibility
- [ ] Access application via HTTP (not HTTPS)
- [ ] Set `NEXT_PUBLIC_SHOW_PILOT_BANNER=true` in .env
- [ ] Restart application
- [ ] **Expected:** Yellow banner visible at top: "Internal Pilot – Do not upload sensitive documents"

### 4.2 Banner Hidden on HTTPS (optional)
- [ ] If HTTPS configured, access via HTTPS
- [ ] **Expected:** Banner not visible

---

## 5. Password Change in Menu

### 5.1 Navigation Menu
- [ ] Login as any user
- [ ] Click your name in top-right corner
- [ ] **Expected:** "Change Password" link visible in dropdown menu
- [ ] Click "Change Password"
- [ ] **Expected:** Redirected to `/change-password` page

---

## 6. API Security Tests

### 6.1 Blocked Actions When Must Change Password
- [ ] Set a user's mustChangePassword=true in database
- [ ] Login as that user
- [ ] Try to upload a file via API
- [ ] **Expected:** HTTP 403 "Must change password first"
- [ ] Try to submit an expense
- [ ] **Expected:** Blocked or redirected

---

## Summary

| Feature | Pass | Fail | Notes |
|---------|------|------|-------|
| Forced Password Change | | | |
| Password Validation | | | |
| Login Rate Limiting | | | |
| File Type Validation | | | |
| File Size Validation | | | |
| Magic Byte Validation | | | |
| UUID Filenames | | | |
| Security Banner | | | |
| Blocked API When Must Change | | | |

---

**Tester Signature:** _______________  
**Date:** _______________

---

© YoLa Fresh - Expense Management
