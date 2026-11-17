# FarmConnect

**Built in 2025.** FarmConnect is a full-stack, multi-vendor marketplace that connects small-scale farmers in Kenya directly with buyers. It covers the whole order loop: listings, checkout with M-Pesa (sandbox), order tracking, a farmer wallet with payout requests, buyer refunds, and an admin dashboard that approves both.

> **Prototype.** Payments run against the M-Pesa sandbox. Payment confirmation and payout locking are in place (see [Security](#security)), but the app has no automated tests and hasn't been audited for real money.

## Features

**Accounts and roles**
- Three roles (buyer, farmer, admin) with role-protected API routes
- Email/password sign-up with JWT and bcrypt, email verification via Nodemailer, and Google sign-in via Passport.js

**Listings and orders**
- Farmers create, edit and delete produce listings with Cloudinary image uploads
- Public search across listing names and descriptions
- Checkout flow: place order → confirm delivery address → pay with M-Pesa STK Push; the order page polls until the payment callback marks it paid
- Farmers mark orders delivered; either side can cancel a pending order

**Money flow**
- Farmer wallet showing delivered sales, a 10% platform fee and the available balance
- Farmers request payouts; buyers request refunds on paid or delivered orders
- Admin dashboard to approve or reject payout and refund requests

**Messaging**
- Basic one-to-one chat between buyer and farmer about an order

## Tech stack

| Part | Technology |
|---|---|
| Frontend | React, React Router, React-Bootstrap, Axios, React-Toastify |
| Backend | Node.js, Express, PostgreSQL (`pg`) |
| Auth | JWT, bcryptjs, Passport.js (Google OAuth 2.0) |
| Payments | M-Pesa Daraja API, STK Push (sandbox) |
| Media and email | Cloudinary, Multer, Nodemailer |

## Run locally

Requirements: Node.js 18+, PostgreSQL, and accounts for Cloudinary, the Safaricom Daraja sandbox and Google OAuth. M-Pesa needs a public callback URL, so use a tunnel such as ngrok during development.

```bash
git clone https://github.com/Tolbert-Okoth/farmconnect.git
cd farmconnect

# Backend
cd backend
npm install
npm run dev            # serves on PORT (default 5000)

# Frontend (new terminal)
cd frontend
npm install
npm start              # expects the API at http://localhost:5000
```

### Environment variables

Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env`, then fill them in. The backend refuses to start without a `JWT_SECRET` of at least 32 characters.

The database schema is not included in this repository yet, so create the tables for users, produce, orders, payouts, refunds and messages before the first run.

## Security

- **Payments are confirmed with Safaricom.** The callback URL carries a secret token, and before an order is marked paid the server asks the M-Pesa STK Query API whether the payment really succeeded. Only pending orders with a confirmed address can be paid, and repeated callbacks are harmless.
- **Order states can't be forged.** Only a confirmed payment sets "paid". Farmers can only mark a paid order delivered or cancel a pending one.
- **No double withdrawals.** Payout requests run in a transaction with a per-farmer lock. Approved refunds take the order out of the farmer's withdrawable balance.
- **Accounts:** bcrypt hashing, 8+ character passwords, rate-limited login and sign-up, 7-day tokens, and login errors that don't reveal which emails exist. Google sign-in requires a verified Google email.
- **Uploads:** JPEG, PNG or WebP only, up to 5 MB.
- Helmet headers, CORS limited to `FRONTEND_URL`, request size limits, and server-side validation of prices, quantities, phone numbers and message lengths.

## Known limitations

- Refunds and payouts are approved in the app, but the money itself moves outside it (no M-Pesa reversal or B2C yet).
- No automated tests.

## Author

Built by **Tolbert Okoth**: [Portfolio](https://tolbert-portfolio.vercel.app) · [GitHub](https://github.com/Tolbert-Okoth) · [LinkedIn](https://www.linkedin.com/in/tolbert-asumba-542b3b344)
