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
const corsOptions = {
  origin: "https://www.ailucius.com", // Use your live frontend domain
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Stripe Webhook - this needs to be before express.json()
app.post('/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => { /* ... your webhook logic ... */ });

app.use(express.json()); // JSON parser for other routes
app.use(session({ secret: 'a_secret_key_for_sessions', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());


// --- Database & AI Client Setup ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Successfully connected to MongoDB.'))
    .catch((err) => console.error('MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false },
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


// --- Passport Google Strategy ---
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://lucius-ai.onrender.com/auth/google/callback" // Your LIVE backend URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });
      if (user) { return done(null, user); }
      user = await User.findOne({ email: profile.emails[0].value });
      if (user) {
        user.googleId = profile.id;
        user.name = user.name || profile.displayName;
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
    res.redirect(`https://www.ailucius.com/auth-success.html?token=${token}`); // Your LIVE frontend URL
});

// Email/Password Auth Routes
app.post('/api/users/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User with this email already exists.' });
        }
        user = new User({ email, password, name: email.split('@')[0] });
        await user.save();
        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

app.post('/api/users/login', async (req, res) => { /* ...your full login route... */ });
app.get('/api/users/me', authMiddleware, async (req, res) => { /* ...your full 'me' route... */ });


// Start the Server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});