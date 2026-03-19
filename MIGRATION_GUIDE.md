# Migration Guide: Figma Make + Supabase → Vercel + Neon Postgres

## Overview

This guide walks you through migrating your Hybrid Cloud Studio Infrastructure Cost Calculator
from Figma Make + Supabase to Vercel + Neon Postgres. **Total cost: $0/month.**

Neon Postgres is Vercel's built-in database — you set it up right from the Vercel dashboard
with no external accounts, no API keys, and no authentication headaches.

---

## Phase 1: Push Your Code to GitHub

1. Create a new GitHub repository (e.g., `cost-calculator`)
2. Copy all the files from this migration package into your repo
3. Push to GitHub:

```bash
git init
git add .
git commit -m "Initial commit - migrate from Figma Make to Vercel"
git remote add origin https://github.com/YOUR_USERNAME/cost-calculator.git
git push -u origin main
```

---

## Phase 2: Deploy to Vercel + Set Up Database

### Step 1: Create Your Vercel Project

1. Go to [vercel.com](https://vercel.com) and sign up (free) with your GitHub account
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Vercel will auto-detect it as a Vite project — click **"Deploy"**
5. Wait for the first deploy to complete (the app will load but saving won't work yet — that's expected)

### Step 2: Add a Neon Postgres Database

1. In your Vercel project dashboard, go to the **"Storage"** tab
2. Click **"Connect Database"**
3. Select **"Neon Postgres"** (powered by Neon, billed through Vercel — free tier)
4. Click **"Create New"** and follow the prompts
   - If you don't have a Neon account, Vercel will create one for you automatically
   - Choose a region close to you (e.g., US East)
5. Vercel will automatically add the `DATABASE_URL` and `POSTGRES_URL` environment variables to your project

### Step 3: Redeploy

After adding the database, you need to redeploy so the app picks up the new env vars:

1. Go to the **"Deployments"** tab
2. Click the **"..."** menu on your latest deployment
3. Click **"Redeploy"**

That's it! Your app should now be fully functional with save/load working.

---

## Phase 3: Test It

1. Visit your Vercel URL (e.g., `https://cost-calculator.vercel.app`)
2. The app should load with default data
3. Make some changes — you should see "Saving..." then "Saved"
4. Refresh the page — your data should persist
5. To verify the database, go to Storage → your Neon database → click "Open in Neon"
   and check the `calculator_projects` table

---

## What Changed in the Code

### Stayed the same (95%)
- All 6 tab components (ArtistCostsTab, RenderCostTab, LicensingTab, etc.)
- All calculation logic
- All UI components and styling
- CostSummaryBar, CostSummaryBreakdownTab

### Changed (~60 lines in App.tsx)
- Removed: Supabase URL, key, and helper functions
- Added: 3 simple `fetch()` calls to `/api/projects`

### New files
- `api/projects.py` — Python serverless function (~130 lines) that talks to Neon Postgres
- `vercel.json` — Vercel routing config
- `requirements.txt` — Python dependency (psycopg2)

### Removed files
- `supabase/` folder — no longer needed
- `utils/supabase/` folder — no longer needed

---

## How the Database Works

The Python API route (`api/projects.py`) automatically creates a `calculator_projects`
table the first time it runs. The table has:

| Column | Type | Purpose |
|--------|------|---------|
| `id` | TEXT (UUID) | Unique project identifier |
| `state` | JSONB | Your entire calculator state as JSON |
| `created_at` | TIMESTAMP | When the project was created |
| `updated_at` | TIMESTAMP | When it was last saved |

Each browser gets its own project (tracked via `localStorage`).

---

## Troubleshooting

**"Save failed" after deploy**: The most likely cause is the database env vars not being
available. Go to Settings → Environment Variables and confirm `DATABASE_URL` or `POSTGRES_URL`
exists. Then redeploy.

**App loads but shows "Not saved yet" forever**: Open browser DevTools (F12) → Console.
If you see a 500 error from `/api/projects`, check the Vercel function logs
(Deployments → your deploy → Functions tab).

**Want to start fresh**: Clear your browser's `localStorage` for the site
(DevTools → Application → Local Storage → delete `cost_calc_project_id`).
The app will create a new project on next load.

---

## Future Enhancements

- **Project picker**: Add a dropdown to switch between saved projects (the database
  already supports multiple projects)
- **Export to CSV/PDF**: Use the Cost Summary data to generate downloadable reports
- **Sharing**: Generate shareable URLs with the project ID in the URL query params
