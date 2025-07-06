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
// This enables CORS for all routes, allowing your frontend to talk to your backend.
// This is the most important fix.
app.use(cors({
    origin: "https://www.ailucius.com" // Explicitly allow your frontend domain
}));

// The Stripe Webhook route is a special case and is placed before express.json()
app.post('/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => { /* ...your webhook logic... */ });

// Standard JSON parsing middleware for all other API routes
app.use(express.json());

// Passport & Session Setup
app.use(session({ secret: 'your_session_secret', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());


// --- The rest of your server code remains the same ---
mongoose.connect(process.env.MONGO_URI).then(() => console.log('Successfully connected to MongoDB.')).catch((err) => console.error('MongoDB connection error:', err));
const userSchema = new mongoose.Schema({ email: { type: String, required: true, unique: true }, password: { type: String, required: false }, googleId: { type: String }, name: { type: String }, isPro: { type: Boolean, default: false }, }, { timestamps: true });
userSchema.pre('save', async function(next) { if (this.password && this.isModified('password')) { const salt = await bcrypt.genSalt(10); this.password = await bcrypt.hash(this.password, salt); } next(); });
const User = mongoose.model('User', userSchema);
passport.use(new GoogleStrategy({ clientID: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET, callbackURL: `https://lucius-ai.onrender.com/auth/google/callback`}, async (accessToken, refreshToken, profile, done) => { /* ...your Google strategy logic... */ }));
passport.serializeUser((user, done) => { done(null, user); });
passport.deserializeUser((user, done) => { done(null, user); });
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login.html', session: false }), (req, res) => { const payload = { user: { id: req.user.id } }; const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }); res.redirect(`https://www.ailucius.com/auth-success.html?token=${token}`); });
app.post('/api/users/register', async (req, res) => { /* ...your register route... */ });
app.post('/api/users/login', async (req, res) => { /* ...your login route... */ });
app.get('/api/users/me', authMiddleware, async (req, res) => { /* ...your 'me' route... */ });
// The AI routes are removed for now as we focus on fixing auth. They can be added back from the previous complete code.

app.listen(port, () => { console.log(`Server listening at http://localhost:${port}`); });