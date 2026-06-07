# Vaccination Drive Registration

A web app to register vaccination participants, collect UPI payment proof, let an admin
confirm payments, issue QR verification, and export all records to Excel. Built with
Next.js (App Router) so it deploys to a public Vercel URL.

## Screens

- `/` — Registration form with vaccine selection, live UPI QR, reference ID, and screenshot upload
- `/verify` — Look up a registration by ID and mark confirmed registrations as verified
- `/admin` — Password-protected dashboard to confirm payments, issue confirmation QR codes, and download Excel

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Deploy to a public URL (Vercel)

1. Push this repo to GitHub.
2. Import the repo at https://vercel.com/new.
3. Deploy — Vercel gives you a permanent public URL like `https://your-app.vercel.app`.

## Configuration (optional environment variables)

Set these in Vercel → Project → Settings → Environment Variables:

- `ADMIN_PASSWORD` — admin dashboard password (default: `ap09cq2770`)
- `PAYMENT_UPI_ID` — UPI ID for payments (default: `9325339930@sbi`)
- `PAYMENT_PAYEE_NAME` — payee name shown in the UPI request (default: `Yash Biyani`)

## Important: data persistence

This version uses an in-memory store, so it has **no external dependencies** and runs
anywhere. On Vercel's serverless platform, in-memory data is **not durable** — registrations,
payment screenshots, and the generated Excel can reset on cold starts or redeploys.

For permanent storage, connect a database (Neon Postgres is the recommended default) and
move the read/write logic in `lib/store.ts` to that database. The rest of the app
(UI and API routes) stays the same.
