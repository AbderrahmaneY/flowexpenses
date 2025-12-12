# YoLa Fresh - Expense Management

## Deployment Guide

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git
- Server with 1GB+ RAM

---

## 1. Git Setup

```bash
# Initialize repository (if not already)
git init

# Add remote origin
git remote add origin https://github.com/your-org/yolafresh-expenses.git

# Add all files
git add .

# Commit
git commit -m "Initial commit - YoLa Fresh Expense Management"

# Push to main branch
git push -u origin main
```

### .gitignore (Already configured)
```
node_modules/
.next/
.env
*.db
public/uploads/
```

---

## 2. Environment Variables

Create `.env` file on your server:

```env
# Database (SQLite for dev, PostgreSQL for production)
DATABASE_URL="file:./dev.db"

# For PostgreSQL production:
# DATABASE_URL="postgresql://user:password@host:5432/yolafresh_expenses"

# Webhook API Key (for ERP integration)
WEBHOOK_API_KEY="your-secure-api-key-here"

# Data API Key (for data team access)
DATA_API_KEY="another-secure-key-for-data-team"
```

---

## 3. Server Deployment

### Option A: VPS (Ubuntu/Debian)

```bash
# 1. Clone repository
git clone https://github.com/your-org/yolafresh-expenses.git
cd yolafresh-expenses

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
nano .env  # Edit with production values

# 4. Generate Prisma client
npx prisma generate

# 5. Run migrations
npx prisma migrate deploy

# 6. Seed database (first time only)
npx prisma db seed

# 7. Build for production
npm run build

# 8. Start with PM2 (recommended)
npm install -g pm2
pm2 start npm --name "yolafresh" -- start
pm2 save
pm2 startup
```

### Option B: Vercel (Recommended for Next.js)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables in Vercel dashboard
5. Deploy

### Option C: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t yolafresh-expenses .
docker run -p 3000:3000 --env-file .env yolafresh-expenses
```

---

## 4. Database Migration (Production)

For PostgreSQL in production, update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then run:
```bash
npx prisma migrate deploy
```

---

## 5. Nginx Reverse Proxy (Optional)

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
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 6. SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d expenses.yolafresh.com
```

---

## Default Login Credentials

| Role       | Email                | Password     |
|------------|----------------------|--------------|
| Admin      | admin@flow.com       | password123  |
| Manager    | manager@flow.com     | password123  |
| Accounting | accounting@flow.com  | password123  |
| Employee   | emma@flow.com        | password123  |

> ⚠️ **Change these passwords immediately after deployment!**

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Database connection failed | Check `DATABASE_URL` in `.env` |
| Build fails | Run `npx prisma generate` first |
| Login not working | Run `npx prisma db seed` |
| Uploads not saving | Ensure `public/uploads/` is writable |

---

© Abderrahmane Naciri Bennani - Dec 2025
