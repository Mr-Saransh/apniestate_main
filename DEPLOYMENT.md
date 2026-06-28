# Apni Estate - Production Deployment Guide

## Overview
This document contains the production deployment checklist and stability configurations for the Apni Estate frontend (Vercel) and backend (Render).

---

## Frontend Deployment (Vercel)

### Requirements
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### SPA Routing Fix
A `vercel.json` file is required in the `apniestate-frontend` directory to handle React Router navigation on refresh. It rewrites all paths to `index.html`.
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Environment Variables
Set the following variables in the Vercel dashboard (`Settings > Environment Variables`):
- `VITE_API_URL`: The production URL of your backend (e.g., `https://apniestate-backend.onrender.com/api`).
*Do NOT use `localhost` in production!*

### Build Optimizations
The `vite.config.ts` includes `rollupOptions` for automatic chunk splitting to prevent massive JS bundles and Vercel memory exhaustion during build time.

---

## Backend Deployment (Render / Other Node Servers)

### Requirements
- **Environment**: Node.js
- **Build Command**: `npm run build` (or `npm install && npx prisma generate`)
- **Start Command**: `npm start` (or `node dist/server.js` if custom compiled)

### Prisma Database Management
If deploying fresh, ensure your build script generates the Prisma client.
```bash
npx prisma generate
npx prisma db push # Only if you need to sync the schema to a new DB
```

### Environment Variables
Set these in your backend deployment platform:
- `DATABASE_URL`: Your PostgreSQL connection string.
- `JWT_SECRET`: Secure random string for auth tokens.
- `PORT`: (Render automatically assigns this, but normally `3000`).

---

## Stability & Recovery Architecture

### API Client Resilience
The frontend `api/client.ts` implements automatic retry logic.
- If a `TypeError` (Network Error) occurs, it automatically retries the request up to 2 times before throwing an error.
- If a `5xx` Server Error occurs, it automatically retries.

### Global Error Boundary
The root application (`App.tsx`) is wrapped in an `<ErrorBoundary>`. If a React chunk fails to load over the network, or a render exception occurs, the user will see a graceful "Something went wrong" recovery UI instead of a blank white screen, and can click "Reload Application" to flush the cache.

---

## Troubleshooting Guide

### 1. I am getting a 404 error when I refresh the page on Vercel
**Fix**: Ensure `vercel.json` exists in the frontend root and Vercel recognizes the project as a Vite app.

### 2. Login/API calls aren't working in production
**Fix**: Check Vercel environment variables. `VITE_API_URL` must point exactly to the backend. Ensure there are no trailing slashes if your client adds them. Check the Network tab in DevTools for CORS errors.

### 3. Vercel build fails with "JavaScript heap out of memory"
**Fix**: The chunk splitting in `vite.config.ts` handles this, but if it persists, you can increase Node memory via Vercel settings: `NODE_OPTIONS=--max_old_space_size=4096`.
