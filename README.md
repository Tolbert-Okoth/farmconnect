# 🌿 FarmConnect

![GitHub License](https://img.shields.io/badge/license-MIT-green.svg)

FarmConnect is a full-stack e-commerce and multi-vendor(connects buyers with sellers) marketplace platform built with React, Node.js, Express, and PostgreSQL. It's designed to connect small-scale farmers directly to buyers, cooperatives, and admins.

This application features a complete financial loop, including M-Pesa payments for buyers, a "Wallet" and payout system for farmers, and a refund request system, all managed by a central Admin Dashboard.



---

## ✨ Core Features

### 1. Authentication & User Roles
* **Multi-Role System:** Three distinct user roles: **Buyer**, **Farmer**, and **Admin**.
* **Email/Password Auth:** Secure registration and login using JWT and `bcrypt`.
* **Email Verification:** Users must verify their email (via `nodemailer`) before they can log in.
* **Google OAuth:** Users can sign up or log in instantly with their Google account (`passport.js`).
* **Role-Protected Routes:** Backend middleware (`isAdmin`, `isFarmer`) secures all sensitive API endpoints.

### 2. E-Commerce & Listings
* **Product CRUD:** Farmers can create, read, update, and delete their own produce listings.
* **Image Uploads:** Seamless image uploads to **Cloudinary**, including support for updating/replacing images.
* **Search:** A public search bar to filter listings by name or description.
* **Real-time Polling:** After payment, the order page automatically polls the backend and updates to "Paid" in real-time.

### 3. Payment & Order Logistics
* **M-Pesa STK Push:** Full integration with the M-Pesa API for payments.
* **Multi-Step Checkout:**
    1.  Buyer places an order (status: `pending`).
    2.  Buyer must **confirm their delivery address** before payment is enabled.
    3.  Buyer pays via M-Pesa.
* **Order Management:** Buyers and Farmers can view their order history. Farmers can update order status (e.g., "Mark as Delivered").
* **Cancellations:** Buyers and Farmers can cancel a `pending` order, which removes it from the database.

### 4. Marketplace Financial Loop
* **Farmer Wallet & Payouts:**
    * Farmers have a "Wallet" page showing their total sales, platform fees (10%), and available balance.
    * Farmers can request a payout of their available funds.
* **Buyer Refunds:**
    * Buyers can request a refund for any `paid` or `delivered` order by providing a reason.
* **Admin Dashboard:**
    * A secure admin-only dashboard to view all pending payout and refund requests.
    * Admins can **Approve** or **Reject** requests, which updates the status for the user.

### 5. User Interaction
* **1-to-1 Chat:** A basic messaging system for buyers and farmers to communicate about orders.

---

## 💻 Tech Stack

| Category         | Technology                                                                |
| ---------------- | ------------------------------------------------------------------------- |
| **Frontend** | React, React Router, React-Bootstrap, Bootstrap 5, Axios, React-Toastify  |
| **Backend** | Node.js, Express.js, `cors`                                               |
| **Database** | PostgreSQL, `pg` (node-postgres)                                          |
| **Authentication** | JSON Web Tokens (JWT), `bcryptjs`, Passport.js, `passport-google-oauth20` |
| **Payments** | M-Pesa API (STK Push, B2C), `axios`, `ngrok` (for development)            |
| **Image Storage** | Cloudinary, `multer`, `multer-storage-cloudinary`                         |
| **Email** | Nodemailer (Gmail)                                                        |

---

## 🚀 Getting Started

Follow these instructions to get the project running on your local machine.

### Prerequisites

* [Node.js](https://nodejs.org/en/) (v18+)
* [PostgreSQL](https://www.postgresql.org/download/)
* [ngrok](https://ngrok.com/download)
* A [Cloudinary](https://cloudinary.com/) account
* A [Safaricom M-Pesa Developer](https://developer.safaricom.co.ke/) account
* A [Google Cloud Console](https://console.cloud.google.com/) project for OAuth

### 1. Clone the Repository

```bash
git clone [https://github.com/your-username/farmconnect.git](https://github.com/your-username/farmconnect.git)
cd farmconnect
