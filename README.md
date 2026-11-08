# Noor Banu — Next.js + PostgreSQL

The whole store in one Next.js app: the storefront, its API (`src/app/api`) and the admin panel (`/admin`).
Data lives in PostgreSQL through Prisma. Payment is Cash on Delivery.

This replaces the earlier Laravel backend and separate frontend (in the `lily_crown` repository).
The API has the same endpoints and JSON as the Laravel one.

## Run it locally

Needs Node 20+ and PostgreSQL (e.g. Postgres.app).

```bash
cp .env.example .env              # then set DATABASE_URL and SESSION_SECRET
npm install
npx prisma migrate deploy         # create the tables
npm run db:import-laravel         # optional: copy data + images from the old Laravel store
npm run dev                       # http://localhost:3000  (admin: /admin)
```

`npm run db:import-laravel` reads `../backend_lily_crown/database/database.sqlite` and
`../backend_lily_crown/storage/app/public` by default (pass other paths as arguments:
`node scripts/import-laravel.mjs <database.sqlite> <storage/app/public>`).
It empties the tables first, so only run it on a fresh database.
Old Laravel passwords keep working.

There is no sign-up for staff. Accounts with `is_admin = true` in the `users` table can use `/admin`.

## Tests

The tests call a running server and reset its database, so they use a separate database whose name must contain `test`:

```bash
createdb noor_banu_test           # once
npm run test:db                   # migrate it
npm run test:server               # terminal 1: server on :3002 using noor_banu_test
npm test                          # terminal 2
```

## Deploy to Vercel

1. **Database:** create a PostgreSQL database, for example Neon (Vercel → Storage → Neon) or Supabase.
   Copy its connection string.
2. **Images:** in Vercel → Storage, create a **Blob** store and connect it to the project. This adds
   `BLOB_READ_WRITE_TOKEN`. Admin uploads go there, because Vercel's own disk is read-only.
3. **Project:** import the GitHub repo into Vercel and set **Root Directory** to `noor_banu_next`.
4. **Environment variables:**
   - `DATABASE_URL`: the connection string from step 1
   - `SESSION_SECRET`: any long random string
   - `NEXT_PUBLIC_SITE_URL`: your site address, e.g. `https://noorbanu.com`
   - `BLOB_READ_WRITE_TOKEN`: added by step 2
5. **Create the tables** once, from your computer, against the online database:
   ```bash
   DATABASE_URL="<online url>" npx prisma migrate deploy
   DATABASE_URL="<online url>" npm run db:import-laravel   # optional: copy the current data
   ```
   Run `migrate deploy` again after any future schema change.
6. Deploy. Sign in at `https://<your-site>/admin`.

**Images from the import.** The import copies old images into `public/uploads`, which is not in git.
For the live site, re-upload them from the admin panel, or commit `public/uploads` (remove that line from `.gitignore`).

## Where things are

| Path | What |
|---|---|
| `prisma/schema.prisma` | Database tables |
| `src/app/(store)` | Storefront pages |
| `src/app/api` | Public API (products, checkout, orders, accounts) |
| `src/app/api/admin` | Admin API (login, uploads, editors, order updates) |
| `src/app/admin` | Admin panel pages |
| `src/lib/server` | Server logic: checkout pricing, stock, coupons, auth, rate limits |
| `src/lib/admin/resources.js` | Fields and columns of each admin editor |
| `scripts/import-laravel.mjs` | One-off import from the Laravel SQLite database |

## Notes

- Prices, stock and coupons are always re-checked on the server; the checkout ignores prices sent by the browser.
- Cancelling or returning an order puts its items back in stock; reopening takes them again.
- Rate limits (login, orders and so on) are stored in Postgres, so they hold across Vercel's serverless instances.
- Dashboard "today" and "this month" use Dhaka time.
