require('dotenv').config();

// --- NEW DEBUG LINE ---
// This will print the exact connection string to the terminal so we can find the typo.
console.log("DEBUG: The URI my server is trying to use is ->", process.env.MONGO_URI);
// --- END OF DEBUG LINE ---

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

// Stripe Webhook route must come BEFORE express.json()
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

// Initialize Google Gemini Client if the key exists
let genAI;
if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Successfully connected to MongoDB.'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Database User Model
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

// --- AUTHENTICATION ROUTES ---
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
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !user.password) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error during login.' });
    }
});

app.get('/api/users/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
});

// AI Generation Route (Now requires Pro and a valid Gemini Key)
app.post('/api/ai/generate', authMiddleware, async (req, res) => {
    if (!genAI) {
        return res.status(500).json({ message: 'AI Service not configured on the server.' });
    }
    try {
        const user = await User.findById(req.user.id);
        if (!user || !user.isPro) {
            return res.status(403).json({ message: 'This is a Pro feature.' });
        }
        const { prompt, tone } = req.body;
        const fullPrompt = `Your tone of voice must be strictly ${tone}. Now, please respond to the following request: "${prompt}"`;
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();
        res.json({ text });
    } catch (error) {
        console.error("Gemini API error:", error);
        res.status(500).json({ message: 'An error occurred while communicating with the AI.' });
    }
});


// Start the Server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});