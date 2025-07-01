require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const authMiddleware = require('./middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const port = 3000;

app.use(cors());

// Stripe Webhook route needs the raw body
app.post('/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        console.log('✅ Stripe Webhook Verified.');
    } catch (err) {
        console.log(`❌ Error verifying webhook signature: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const customerEmail = session.customer_details.email;
        try {
            const user = await User.findOne({ email: customerEmail });
            if (user) {
                user.isPro = true;
                await user.save();
                console.log(`✅ Pro status updated for user: ${user.email}`);
            }
        } catch (dbError) {
            console.error('Database error during user update:', dbError);
        }
    }
    res.json({received: true});
});

// Standard JSON middleware for all other API routes
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Successfully connected to MongoDB.'))
    .catch((err) => console.error('MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isPro: { type: Boolean, default: false },
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) { return next(); }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});
const User = mongoose.model('User', userSchema);

app.post('/api/users/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        let user = await User.findOne({ email });
        if (user) { return res.status(400).json({ message: 'User with this email already exists.' }); }
        user = new User({ email, password });
        await user.save();
        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) { return res.status(400).json({ message: 'Invalid credentials' }); }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) { return res.status(400).json({ message: 'Invalid credentials' }); }
        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// --- NEW ROUTE TO GET CURRENT USER'S PROFILE ---
app.get('/api/users/me', authMiddleware, async (req, res) => {
    try {
        // req.user.id is available because our authMiddleware successfully verified the token