# Deployment Guide (Vercel + Supabase)

## 1. Prerequisites
- **GitHub Repository**: Ensure your code is pushed to GitHub.
- **Vercel Account**: Sign up at [vercel.com](https://vercel.com).
- **Supabase Project**: Your database is already set up.

## 2. Deploy to Vercel
1.  **Import Project**:
    - Go to your Vercel Dashboard.
    - Click **"Add New..."** -> **"Project"**.
    - Select your GitHub repository (`flowexpenses`).

2.  **Configure Environment Variables**:
    - Build settings (Framework preset: Next.js) usually auto-detected.
    - **Expand the "Environment Variables" section.**
    - Add the following keys (Copy values from your local `.env` or Supabase dashboard):

    | Key | Value |
    | :--- | :--- |
    | `DATABASE_URL` | Check your specific Transaction Pooler string (port 6543) |
    | `NEXT_PUBLIC_SUPABASE_URL` | Copy from Supabase -> Settings -> API |
    | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Copy from Supabase -> Settings -> API |
    | `AUTH_SECRET` | `63073badd913892f07ab822e9bf2e75e273956c62867fed8936ea415617541bb` |
    | `WEBHOOK_API_KEY` | `3c1f28b7a25a84b1fd1f79e2968909b3` |
    | `DATA_API_KEY` | `3acb061d846618c51580eab9a01849f8` |

3.  **Deploy**:
    - Click **"Deploy"**.
    - Wait for the build to complete.

## 3. Post-Deployment Verification
- Visit your Vercel URL (e.g., `flowexpenses.vercel.app`).
- **Log In**: Use the admin account (`admin@flow.com`).
- **Test Database**: Create a test expense to ensure the database connection works.

## Troubleshooting
- **Database Error 500**: Check if `DATABASE_URL` is correct. Ensure "Transaction Pooler" is used (port 6543) and you added `?pgbouncer=true` to the end of the URL if needed (though usually fine with just the string).
- **Auth Error**: Ensure `AUTH_SECRET` is set.
