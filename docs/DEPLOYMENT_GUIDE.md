# YoLa Fresh - Step-by-Step Deployment Guide

## 📋 Pre-Deployment Checklist

Before starting, ensure you have:
- [ ] Node.js 18+ installed
- [ ] Git installed and configured
- [ ] Access to server (VPS, Vercel, or Docker host)
- [ ] Domain name (optional but recommended)

---

## Step 1: Clone the Repository

```bash
# Navigate to your projects directory
cd /var/www  # or your preferred location

# Clone the repository
git clone https://github.com/your-org/yolafresh-expenses.git

# Enter the project directory
cd yolafresh-expenses
```

**Expected result:** Project files downloaded to your server.

---

## Step 2: Install Dependencies

```bash
npm install
```

**Expected result:** `node_modules` folder created with all dependencies.

**If you get errors:**
- Run `npm cache clean --force` and try again
- Ensure Node.js version is 18+

---

## Step 3: Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit the configuration
nano .env
```

**Required variables:**
```env
# Database Connection
DATABASE_URL="file:./prod.db"

# For PostgreSQL (recommended for production):
# DATABASE_URL="postgresql://user:password@localhost:5432/yolafresh"

# Security Keys (generate your own!)
WEBHOOK_API_KEY="generate-a-secure-32-char-key"
DATA_API_KEY="another-secure-key-for-data-team"
```

**To generate secure keys:**
```bash
openssl rand -hex 32
```

**Expected result:** `.env` file configured with your values.

---

## Step 4: Setup Database

```bash
# Generate Prisma Client
npx prisma generate

# Apply database migrations
npx prisma migrate deploy

# Seed initial data (creates default roles and users)
npx prisma db seed
```

**Expected result:** Database created with tables and default users.

**Verify with:**
```bash
npx prisma studio
# Opens browser at http://localhost:5555
```

---

## Step 5: Build the Application

```bash
npm run build
```

**Expected result:** `.next` folder created with production build.

**If build fails:**
- Check for TypeScript errors: `npm run lint`
- Ensure all environment variables are set

---

## Step 6: Start the Application

### Option A: Direct Start (Testing)
```bash
npm start
```
App runs at `http://localhost:3000`

### Option B: PM2 (Recommended for Production)
```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start npm --name "yolafresh" -- start

# Save PM2 configuration
pm2 save

# Setup auto-restart on reboot
pm2 startup
```

**Expected result:** Application running on port 3000.

---

## Step 7: Configure Reverse Proxy (Optional)

### Nginx Setup

```bash
# Install Nginx
sudo apt update
sudo apt install nginx

# Create site configuration
sudo nano /etc/nginx/sites-available/yolafresh
```

**Paste this configuration:**
```nginx
server {
    listen 80;
    server_name expenses.yolafresh.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    # File uploads (max 10MB)
    client_max_body_size 10M;
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/yolafresh /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

**Expected result:** Site accessible via domain name.

---

## Step 8: Setup SSL Certificate (HTTPS)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d expenses.yolafresh.com

# Auto-renewal is configured automatically
```

**Expected result:** HTTPS enabled with auto-renewal.

---

## Step 9: Verify Deployment

### Test Checklist:
- [ ] Visit `https://expenses.yolafresh.com`
- [ ] Login page loads with YoLa Fresh logo
- [ ] Login works with `admin@flow.com` / `password123`
- [ ] Dashboard shows correctly
- [ ] Can create a new expense
- [ ] File upload works

### Test Data API:
```bash
curl -H "x-api-key: YOUR_DATA_API_KEY" \
     https://expenses.yolafresh.com/api/data/expenses
```

---

## Step 10: Post-Deployment Security

### CRITICAL: Change Default Passwords!

1. Login as `admin@flow.com`
2. Go to Admin → Users
3. Click on each user → Force Reset password
4. Set strong passwords for all accounts

### Verify Uploads Directory
```bash
# Ensure uploads directory is writable
chmod 755 public/uploads
```

---

## 🔄 Updating the Application

```bash
# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Regenerate Prisma client
npx prisma generate

# Apply any new migrations
npx prisma migrate deploy

# Rebuild
npm run build

# Restart PM2
pm2 restart yolafresh
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 3000 in use | `lsof -i :3000` then `kill -9 <PID>` |
| Database errors | Check `DATABASE_URL` in `.env` |
| Login fails | Run `npx prisma db seed` |
| Build fails | Clear `.next` folder, rebuild |
| Uploads fail | Check `public/uploads` permissions |

---

## 📞 Support

For issues, contact:
- Technical Lead: dev-team@yolafresh.com
- System Admin: devops@yolafresh.com

---

© Abderrahmane Naciri Bennani - Dec 2025
