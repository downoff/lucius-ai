require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const session = require('express-session'); // <-- NEW
const passport = require('passport'); // <-- NEW
const GoogleStrategy = require('passport-google-oauth20').Strategy; // <-- NEW

const authMiddleware = require('./middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const port = 3000;

app.use(cors());
app.post('/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => { /* ...your webhook logic... */ });
app.use(express.json());

// --- NEW: PASSPORT & SESSION SETUP ---
app.use(session({ secret: 'your_session_secret', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Configure Passport to use the Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback" // This must match the one in your Google Console
  },
  async (accessToken, refreshToken, profile, done) => {
    // This function is called after a user successfully logs in with Google
    try {
      let user = await User.findOne({ googleId: profile.id });
      if (user) {
        return done(null, user);
      } else {
        // If user doesn't exist, create a new one
        const newUser = new User({
          googleId: profile.id, // Store the Google ID
          name: profile.displayName,
          email: profile.emails[0].value,
          // We don't have a password for Google users
        });
        await newUser.save();
        return done(null, newUser);
      }
    } catch (error) {
      return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user);
    });
});


// --- DATABASE CONNECTION & MODELS ---
mongoose.connect(process.env.MONGO_URI).then(() => console.log('Successfully connected to MongoDB.')).catch((err) => console.error('MongoDB connection error:', err));
// We need to add 'googleId' and 'name' to our user model
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Password is no longer required for Google users
    googleId: { type: String },
    name: { type: String },
    isPro: { type: Boolean, default: false },
});
userSchema.pre('save', async function(next) { if(this.password && this.isModified('password')) { const salt = await bcrypt.genSalt(10); this.password = await bcrypt.hash(this.password, salt); } next(); });
const User = mongoose.model('User', userSchema);


// --- API ROUTES ---
app.post('/api/users/register', async (req, res) => { /* ...your existing register route... */ });
app.post('/api/users/login', async (req, res) => { /* ...your existing login route... */ });
app.get('/api/users/me', authMiddleware, async (req, res) => { /* ...your existing get profile route... */ });

// AI route is removed for now as we focus on auth

// --- NEW: GOOGLE AUTH ROUTES ---
// This route starts the Google login process
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// This is the callback route Google sends the user back to
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    // Successful authentication. We now create our OWN JWT for the user.
    const payload = { user: { id: req.user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' });
    
    // Redirect the user back to the frontend, passing the token in the URL
    // This is a simple way to get the token to the frontend
    res.redirect(`http://localhost:5500/auth-success.html?token=${token}`);
});


app.listen(port, () => { console.log(`Server listening at http://localhost:${port}`); });