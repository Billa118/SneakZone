# SNEAKZONE — Premium Shoes E-Commerce

Modern sneaker storefront with a React (Vite) frontend and Flask REST API. Sample catalogue data is clearly labeled as demo content.

## Stack

- **Frontend:** React, Vite, JavaScript, Tailwind CSS v4, React Router, Lucide React, Context API, React Hook Form
- **Backend:** Python Flask, SQLAlchemy, SQLite (PostgreSQL-ready via `DATABASE_URL`), Flask-JWT-Extended, Flask-Limiter
- **Brand:** Centralized in `frontend/src/config/brand.js`

## Quick start (Windows)

### 1. Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python run.py
```

API: `http://127.0.0.1:5000`  
Health: `http://127.0.0.1:5000/api/health`

On first start with `SEED_ON_START=true`, the database is created and seeded with sample products, coupons, an admin user, and a demo customer.

### 2. Frontend

Open a second terminal:

```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```

Storefront: `http://localhost:5173`

### 3. Production-style frontend build

```powershell
cd frontend
npm run build
npm run preview
```

## Deploy to Vercel

The root `vercel.json` config deploys the Vite storefront and Flask API together
using Vercel Services, with `/api/*` routed to Flask and all other routes
served by the React single-page app. Services are currently a Vercel beta.

1. Push this repository to GitHub, GitLab, or Bitbucket and import it as a
  Vercel project. Keep the Vercel **Root Directory** at the repository root;
  the service roots are configured in `vercel.json`.
2. Create a persistent PostgreSQL database (for example, Neon or Supabase) and
  copy its connection URL. Vercel's function filesystem is ephemeral, so the
  local SQLite database is not suitable for deployed orders or accounts.
3. Add these environment variables in **Vercel → Project → Settings → Environment
  Variables** for Production and Preview:

  | Variable | Value |
  | --- | --- |
  | `DATABASE_URL` | Managed PostgreSQL URL (`postgres://` and `postgresql://` URLs are normalized automatically) |
  | `SECRET_KEY` | A new, long random secret |
  | `JWT_SECRET_KEY` | A different new, long random secret |
  | `SEED_ON_START` | `true` for the public demo catalogue and sample orders; use `false` if deploying without sample data |
  | `ADMIN_EMAIL` | Your chosen admin email |
  | `ADMIN_PASSWORD` | A unique strong admin password; do not use the example default |
  | `PAYMENT_MODE` | `demo` until a real payment gateway is integrated |

  `VITE_API_URL` is intentionally unset: the storefront calls `/api` on the
  same deployment domain. Do not copy the local `.env` files to Vercel.
4. Deploy. Verify `/api/health`, then sign in at `/login` with the demo customer
  account shown on the login screen if `SEED_ON_START=true`.

The sample customer credentials are public demo credentials and are not for
private or production customer data. Checkout is demo-only; no real payments
are collected. Configure a real gateway and review authentication, rate-limit
storage, and database migration/backups before using this as a live store.

## Demo accounts

Set in `backend/.env` (change before any real deployment):

| Role | Email | Password |
|------|-------|----------|
| Admin | `ADMIN_EMAIL` (default `admin@sneakzone.local`) | `ADMIN_PASSWORD` |
| Customer | `customer@sneakzone.local` | `Customer123!` |

Demo coupons: `SNEAK10`, `FLAT300`, `WELCOME50`

## Environment variables

See:

- `backend/.env.example`
- `frontend/.env.example`

Never commit real secrets. `.env` files are gitignored.

### Switching to PostgreSQL later

Set:

```env
DATABASE_URL=postgresql+psycopg://user:pass@localhost:5432/sneakzone
```

Install a PostgreSQL driver (e.g. `psycopg`) and recreate/migrate the schema.

## Payment integration

`PAYMENT_MODE=demo` (default):

- Checkout accepts UPI / card / COD **selection only**
- Raw card numbers, CVVs, and UPI PINs are rejected by the API
- Orders are marked as demo; no real charge occurs

To integrate a real gateway later:

1. Set `PAYMENT_MODE` to a gateway-specific value in config
2. Create a payment-intent endpoint with your provider (Razorpay, Stripe, etc.)
3. Confirm payment webhooks server-side before marking `payment_status=paid`
4. Never store raw card or UPI PIN data

## Features completed

- Premium responsive homepage, navigation, footer, catalogue with URL-synced filters
- Product detail (gallery, size/color, stock, PIN estimate, wishlist, add to cart / buy now)
- Cart with localStorage persistence, coupon validation, server-side quotes
- Checkout with Indian mobile/PIN validation, demo payment flow, order creation with stock decrement
- Order confirmation, tracking timeline, My Orders
- Auth (register/login/JWT), profile, addresses, wishlist sync
- Admin dashboard (products, orders/status, coupons, sales summary) with backend enforcement
- Seeded sample products (14) across categories
- Throttling on sensitive auth/order endpoints

## Limitations

- Payment is demo-only unless a gateway is configured
- Delivery ETAs use simple PIN demo rules (not live courier APIs)
- Newsletter subscribe is UI-only (not persisted)
- Guest cart is client-side; authenticated wishlist syncs to the API
- Product soft-delete (deactivate) preserves order history
- No email/SMS notifications

## Project structure

```
ecommerce/
  frontend/          # Vite React app
  backend/           # Flask API
    app/
      models/
      routes/
      seed.py
    run.py
  README.md
```

## Brand rename

Update `frontend/src/config/brand.js` (and optionally public config in the API health/brand payload).
