# FarmConnect

**Built in 2025.** FarmConnect is a full-stack, multi-vendor marketplace that connects small-scale farmers in Kenya directly with buyers. It covers the whole order loop: listings, checkout with M-Pesa (sandbox), order tracking, a farmer wallet with payout requests, buyer refunds, and an admin dashboard that approves both.

> **Prototype.** Payments run against the M-Pesa sandbox. Callback verification and concurrent payout handling need more work before handling real money.

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

### Backend environment variables (`backend/.env`)

```env
PORT=5000
FRONTEND_URL=http://localhost:3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_DATABASE=farmconnect
JWT_SECRET=a_long_random_string
EMAIL_USER=you@gmail.com
EMAIL_PASS=your_app_password
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
MPESA_CONSUMER_KEY=...
MPESA_CONSUMER_SECRET=...
MPESA_SHORTCODE=174379
MPESA_PASSKEY=...
MPESA_CALLBACK_URL=https://your-tunnel.ngrok.app/api/payments/callback
```

The database schema is not included in this repository yet, so create the tables for users, produce, orders, payouts, refunds and messages before the first run.

## Known limitations

- Payment amounts are taken from the database, but the M-Pesa callback is not yet verified against Safaricom's records.
- Payouts are admin-approved records; money is not sent automatically to farmers.
- No automated tests.

## Author

Built by **Tolbert Okoth**: [Portfolio](https://tolbert-portfolio.vercel.app) · [GitHub](https://github.com/Tolbert-Okoth) · [LinkedIn](https://www.linkedin.com/in/tolbert-asumba-542b3b344)
