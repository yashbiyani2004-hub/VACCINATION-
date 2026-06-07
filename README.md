# Vaccination Drive Registration Software

This web app lets staff register vaccination participants, collect UPI payment proof, let admin confirm payments, issue QR verification, and keep all records in an Excel file.

## Run

```powershell
npm.cmd install
npm.cmd start
```

Optional settings:

```powershell
$env:ADMIN_PASSWORD="change-this-password"
$env:PAYMENT_UPI_ID="your-upi-id"
$env:PAYMENT_PAYEE_NAME="Payee Name"
npm.cmd start
```

Open:

```text
http://localhost:3000
```

## What it stores

- `data/registrations.json`: local registration database
- `data/payment-screenshots/`: uploaded payment screenshots
- `data/vaccination_registrations.xlsx`: Excel file updated after registration, admin confirmation, and verification

For public deployment, set `DATA_DIR` to a persistent disk or volume path.

## Main screens

- Registration: `http://localhost:3000`
- Verification: `http://localhost:3000/verify.html`
- Admin Excel download: `http://localhost:3000/admin.html`

Default admin password is `ap09cq2770`. Change it with `ADMIN_PASSWORD` before using real data.

## Permanent Public URL With Render

Use this if you want a permanent public link such as `https://your-app.onrender.com`.

1. Create a GitHub account or use your existing GitHub account.
2. Create a new GitHub repository.
3. Upload this project folder to that repository.
4. Create a Render account at `https://render.com`.
5. In Render, choose **New +** then **Blueprint**.
6. Connect the GitHub repository.
7. Render will read `render.yaml` and create a web service with a persistent disk.
8. When Render asks for `ADMIN_PASSWORD`, enter a secure password.
9. Deploy the service.
10. After deploy finishes, Render gives you a permanent public URL.

Important: keep the persistent disk enabled. Without it, registrations, payment screenshots, and Excel data can be lost after redeploys.

## Manual Render Settings

If you do not use Blueprint, create a Web Service with:

- Build command: `npm install`
- Start command: `npm start`
- Environment variable: `DATA_DIR=/var/data`
- Environment variable: `ADMIN_PASSWORD=<your-admin-password>`
- Environment variable: `PAYMENT_UPI_ID=9325339930@sbi`
- Environment variable: `PAYMENT_PAYEE_NAME=Yash Biyani`
- Persistent disk mount path: `/var/data`
