require('dotenv').config();

const express = 'express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const OpenAI = require('openai');
const authMiddleware = require('./middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const port = 3000;

// --- Middleware Setup ---
app.use(cors({ origin: "https://www.ailucius.com" }));
app.post('/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => { /* ...your webhook logic... */ });
app.use(express.json());
app.use(session({ secret: 'a_secret_key_for_sessions', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// --- Database & AI Client Setup ---
mongoose.connect(process.env.MONGO_URI).then(() => console.log('Successfully connected to MongoDB.')).catch((err) => console.error('MongoDB connection error:', err));
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const User = require('./models/User'); // We will create this file next

// --- Passport & Auth Routes ---
// ... All your existing Passport, Register, Login, and 'me' routes go here ...

// --- Text Generation Route ---
app.post('/api/ai/generate', authMiddleware, async (req, res) => {
    // ... your existing text generation logic ...
});


// --- NEW: Protected Image Generation Route ---
app.post('/api/ai/generate-image', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || !user.isPro) {
            return res.status(403).json({ message: 'This is a Pro feature. Please upgrade your account.' });
        }

        const { prompt } = req.body;

        console.log("Generating image with prompt:", prompt);

        const response = await openai.images.generate({
            model: "dall-e-3", // Use the powerful DALL-E 3 model
            prompt: prompt,
            n: 1, // Generate one image
            size: "1024x1024", // Standard high-quality size
        });
        
        const imageUrl = response.data[0].url;
        res.json({ imageUrl });

    } catch (error) {
        console.error("OpenAI Image Generation API error:", error);
        res.status(500).json({ message: 'An error occurred while generating the image.' });
    }
});


// --- Start the Server ---
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});