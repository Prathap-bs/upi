# MERN QR Payment Demo

## Overview
Simple MERN app with Admin (shop owner) and Customer viewpoints.

Admin features:
- Add multiple UPI accounts
- Select active receiving account
- Enter amount
- Generate QR code payment request
- View requests and verify/reject
- View account-wise separated transactions
- Filter transactions by date range

Customer features:
- View latest request
- Scan QR code
- Press "I Have Paid" (claim)
- Cancel request
- See status updates

## Backend (Node + Express + MongoDB)

1. Open `backend` folder
2. `npm install`
3. create `.env` (optional: `MONGO_URI`, `PORT`)
4. `npm run dev`

API endpoints:
- `GET /api/admin/accounts`
- `POST /api/admin/accounts` `{ name, upiId }`
- `PATCH /api/admin/accounts/:id/select`
- `POST /api/admin/paymentrequests` `{ amount }`
- `GET /api/admin/paymentrequests`
- `GET /api/admin/transactions?upiId=<upiId>&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
- `PATCH /api/admin/paymentrequests/:id/status` `{ status: 'Verified'|'Rejected' }`
- `GET /api/customer/paymentrequests`
- `PATCH /api/customer/paymentrequests/:id/claim`

Transactions page (frontend):
- Open `Transactions` tab
- Filter by account (`All Accounts` or specific UPI)
- Filter by `startDate` and `endDate`
- View transactions separated by each account with totals and status counts

## Frontend (Vite React)

1. Open `frontend` folder
2. `npm install`
3. `npm run dev`

Default frontend URL: `http://localhost:3000`

Ensure backend running at `http://localhost:5000` for API.
