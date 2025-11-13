const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('./db');
const generateToken = require('../utils/jwtGenerator');

module.exports = function (passport) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback',
        proxy: true,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // 1. Check if user already exists
          const email = profile.emails[0].value;
          const userQuery = await db.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
          );
          let user = userQuery.rows[0];

          if (user) {
            // 2. User exists, just return them
            return done(null, user);
          } else {
            // 3. User does not exist, create a new user
            // We'll make them a 'buyer' by default.
            const newUser = await db.query(
              `INSERT INTO users (username, email, password_hash, role, is_email_verified)
               VALUES ($1, $2, $3, 'buyer', true)
               RETURNING *`,
              [profile.displayName, email, 'google_oauth_user'] // No real password
            );
            user = newUser.rows[0];
            return done(null, user);
          }
        } catch (err) {
          console.error(err);
          return done(err, false);
        }
      }
    )
  );

  // These are not strictly needed for JWT, but good practice
  passport.serializeUser((user, done) => {
    done(null, user.user_id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const userQuery = await db.query('SELECT * FROM users WHERE user_id = $1', [id]);
      done(null, userQuery.rows[0]);
    } catch (err) {
      done(err, null);
    }
  });
};