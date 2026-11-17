const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const db = require('./config/db');
const passport = require('passport');

// Load env vars
dotenv.config();
// Passport config
require('./config/passport')(passport);

// Route files
const authRoutes = require('./routes/authRoutes');
const produceRoutes = require('./routes/produceRoutes');
const orderRoutes = require('./routes/orderRoutes');
const inquiryRoutes = require('./routes/inquiryRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const payoutRoutes = require('./routes/payoutRoutes');
const refundRoutes = require('./routes/refundRoutes.js');
const adminRoutes = require('./routes/adminRoutes.js');


// Test DB Connection
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be set and at least 32 characters long.');
  process.exit(1);
}

db.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log(`Database connected at: ${res.rows[0].now}`);
  }
});

const app = express();

// Middlewares
app.set('trust proxy', 1); // behind Render/ngrok proxies
// COOP is off so the Google sign-in popup can still message the site that opened it.
app.use(helmet({ crossOriginOpenerPolicy: false }));
app.use(
  cors({
    origin: (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, ''),
  })
);
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Slow down password guessing and sign-up spam
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again later.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use(passport.initialize()); // Initialize Passport


// Mount Routers
app.get('/api', (req, res) => {
  res.send('FarmConnect API is running...');
});

app.use('/api/auth', authRoutes);
app.use('/api/produce', produceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/refunds', refundRoutes);
app.use('/api/admin', adminRoutes);

// Custom Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `✅ Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
  );
});