# YoLa Fresh - Internal Pilot Go-Live Checklist (No HTTPS)

**Version:** 1.0  
**Date:** December 2025  
**Status:** Internal Pilot Only

---

## ⚠️ Security Notice

This checklist is for **internal pilot deployment WITHOUT HTTPS**. Production deployment MUST include SSL/TLS.

---

## Pre-Deployment (Must Complete)

### 1. Network Restrictions (Hosting Team Required)
- [ ] **Restrict to LAN/VPN only** - Block all public internet access
- [ ] **IP Allowlist** - Only allow specific internal IP ranges
- [ ] **Firewall rules** - Port 3000 (or 80) accessible only from internal network
- [ ] **No public DNS** - Use internal hostname only (e.g., `expenses.internal`)

### 2. Environment Configuration
- [ ] Set `DATABASE_URL` to production database
- [ ] Generate secure `WEBHOOK_API_KEY` (32+ characters)
- [ ] Generate secure `DATA_API_KEY` (32+ characters)
- [ ] Set `NEXT_PUBLIC_SHOW_PILOT_BANNER=true` to display security banner
- [ ] Verify `.env` file permissions (600 - owner only)

### 3. Database Setup
- [ ] Run `npx prisma migrate deploy`
- [ ] Run `npx prisma db seed` to create initial users
- [ ] Verify database file permissions (if SQLite)

### 4. Application Deployment
- [ ] Run `npm run build`
- [ ] Start with `pm2 start npm --name "yolafresh" -- start`
- [ ] Verify application starts successfully
- [ ] Test login with default credentials

---

## Post-Deployment (Must Complete)

### 5. Change All Default Passwords
- [ ] **admin@flow.com** - Reset password immediately
- [ ] **accounting@flow.com** - Reset password
- [ ] **manager@flow.com** - Reset password
- [ ] **emma@flow.com** (all employees) - Reset passwords
- [ ] Verify all users have `mustChangePassword=true` after reset

### 6. Security Validation
- [ ] Verify security banner is visible ("Internal Pilot – Do not upload sensitive documents")
- [ ] Test rate limiting on login (5 attempts per 15 minutes)
- [ ] Test file upload validation (only PDF, JPG, PNG allowed)
- [ ] Verify file uploads use UUID filenames (not original filenames)
- [ ] Test forced password change works after admin reset

---

## User Communication

### 7. User Training
- [ ] Share Employee Guide with all users
- [ ] Share Manager Guide with approvers
- [ ] Share Accounting Guide with finance team
- [ ] Share Admin Guide with administrators
- [ ] Communicate: **"Do not upload sensitive documents during pilot"**

---

## Monitoring

###  8. Daily Checks (First Week)
- [ ] Monitor PM2 logs: `pm2 logs yolafresh`
- [ ] Check for failed login attempts
- [ ] Verify all uploads are properly named with UUIDs
- [ ] Monitor database size

---

## Rollback Plan

If issues occur:
1. Stop application: `pm2 stop yolafresh`
2. Revert to previous version
3. Restart: `pm2 start yolafresh`
4. Notify users

---

## ⚡ Quick Security Reference

| Feature | Implementation |
|---------|----------------|
| Passwords | bcrypt hashed (10 rounds) |
| Force change | Admin resets trigger mustChangePassword |
| Login rate limit | 5 attempts / 15 minutes |
| File types | PDF, JPG, PNG only |
| File validation | Magic byte verification |
| File names | Random UUID (no original names) |
| Max upload | 2MB per file |
| Security banner | Visible when not HTTPS |

---

## Before Full Production

Before removing "internal pilot" status:
- [ ] Enable HTTPS (SSL certificate)
- [ ] Remove or disable `NEXT_PUBLIC_SHOW_PILOT_BANNER`
- [ ] Conduct security audit
- [ ] Enable public access (if required)
- [ ] Update DNS to public domain

---

**Sign-off Required:**,
- [ ] DevOps Lead: _______________
- [ ] Security Lead: _______________
- [ ] Project Lead: _______________

---

© Abderrahmane Naciri Bennani - Dec 2025
