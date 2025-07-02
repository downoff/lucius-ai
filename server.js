require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('./middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const port = 3000;

app.use(cors());

app.post('/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => {
    // Webhook logic remains the same
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const customerEmail = session.customer_details.email;
        const user = await User.findOne({ email: customerEmail });
        if (user) {
            user.isPro = true;
            await user.save();
            console.log(`✅ Pro status updated for user: ${user.email}`);
        }
    }
    res.json({received: true});
});

app.use(express.json());

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

// AUTH AND USER ROUTES
app.post('/api/users/register', async (req, res) => { /* ... (This code does not change) ... */ });
app.post('/api/users/login', async (req, res) => { /* ... (This code does not change) ... */ });
app.get('/api/users/me', authMiddleware, async (req, res) => { /* ... (This code does not change) ... */ });

// The /api/ai/generate route is no longer needed and has been removed.

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});