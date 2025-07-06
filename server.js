require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
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
// Note: The Stripe webhook route is a special case and is placed further down
app.use(express.json()); // This is for parsing JSON in the body of standard API requests

// --- Passport & Session Setup for Google OAuth ---
app.use(session({ secret: 'a_secret_key_for_sessions', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// --- Database Connection & Models ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Successfully connected to MongoDB.'))
    .catch((err) => console.error('MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Not required for OAuth users
    googleId: { type: String },
    name: { type: String },
    isPro: { type: Boolean, default: false },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
    if (this.password && this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

const User = mongoose.model('User', userSchema);

// Configure Passport to tell it HOW to use Google's data
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });
      if (user) {
        return done(null, user);
      } else {
        // Find user by email to link accounts, or create a new one
        user = await User.findOne({ email: profile.emails[0].value });
        if (user) {
          user.googleId = profile.id;
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
      }
    } catch (error) {
      return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => { done(null, user); });
passport.deserializeUser((user, done) => { done(null, user); });


// --- API ROUTES ---

// --- NEW: Google Auth Routes ---
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login.html' }), (req, res) => {
    const payload = { user: { id: req.user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' });
    res.redirect(`http://localhost:5500/auth-success.html?token=${token}`);
});

// Your existing API routes
app.post('/api/users/register', async (req, res) => { /* ...your register route... */ });
app.post('/api/users/login', async (req, res) => { /* ...your login route... */ });
app.get('/api/users/me', authMiddleware, async (req, res) => { /* ...your me route... */ });


// --- Start the Server ---
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});