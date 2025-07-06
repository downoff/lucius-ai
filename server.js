require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const authMiddleware = require('./middleware/auth');

const app = express();
const port = 3000;

// --- Middleware Setup ---
app.use(cors());
// The Stripe Webhook route requires the raw request body, so it comes before express.json()
app.post('/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => {
    // NOTE: This is placeholder logic. The full Stripe webhook implementation is a future step.
    console.log("Stripe webhook received.");
    res.json({received: true});
});
app.use(express.json()); // JSON parser for all other routes
app.use(session({ secret: 'a_secret_key_for_sessions', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// --- Database Connection & Models ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Successfully connected to MongoDB.'))
    .catch((err) => console.error('MongoDB connection error:', err));

// The User model with all necessary fields
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false }, // Not required for Google OAuth users
    googleId: { type: String },
    name: { type: String }, // To store the user's name from Google or from their email
    isPro: { type: Boolean, default: false },
}, { timestamps: true });

// Password hashing middleware
userSchema.pre('save', async function(next) {
    if (this.password && this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});
const User = mongoose.model('User', userSchema);


// --- Passport Google Strategy Configuration ---
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://lucius-ai.onrender.com/auth/google/callback" // Use your LIVE backend URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });
      if (user) { return done(null, user); }
      
      user = await User.findOne({ email: profile.emails[0].value });
      if (user) {
        user.googleId = profile.id; // Link existing account
        await user.save();
        return done(null, user);
      } else {
        const newUser = new User({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
        });
        await newUser.save();
        return done(null, newUser);
      }
    } catch (error) {
      return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => { done(null, user); });
passport.deserializeUser((user, done) => { done(null, user); });


// --- API ROUTES ---

// Google Auth Routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login.html', session: false }), (req, res) => {
    const payload = { user: { id: req.user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' });
    res.redirect(`https://ailucius.com/auth-success.html?token=${token}`); // Use your LIVE frontend URL
});

// Standard Email/Password Auth Routes
app.post('/api/users/register', async (req, res) => { /* ...your existing register route... */ });
app.post('/api/users/login', async (req, res) => { /* ...your existing login route... */ });

// User Profile Route
app.get('/api/users/me', authMiddleware, async (req, res) => { /* ...your existing 'me' route... */ });

// (We have disabled the AI routes for now as we focus on fixing auth)


// --- Start the Server ---
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});