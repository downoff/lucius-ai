require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const OpenAI = require('openai'); // <-- UPDATED: Import OpenAI
const authMiddleware = require('./middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const port = 3000;

app.use(cors());
app.post('/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => { /* ...your webhook logic... */ });
app.use(express.json());

// UPDATED: Initialize the OpenAI Client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Successfully connected to MongoDB.'))
    .catch((err) => console.error('MongoDB connection error:', err));

// --- DATABASE MODELS (No changes) ---
const userSchema = new mongoose.Schema({ /* ... user schema ... */ });
userSchema.pre('save', async function(next) { /* ... password hashing ... */ });
const User = mongoose.model('User', userSchema);
// ... other models if you have them

// --- API ROUTES ---
app.post('/api/users/register', async (req, res) => { /* ...your existing route... */ });
app.post('/api/users/login', async (req, res) => { /* ...your existing route... */ });
app.get('/api/users/me', authMiddleware, async (req, res) => { /* ...your existing route... */ });


// --- UPDATED: AI Generation Route Now Calls OpenAI ---
app.post('/api/ai/generate', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || !user.isPro) {
            return res.status(403).json({ message: 'This is a Pro feature.' });
        }

        const { prompt, tone } = req.body;
        const fullPrompt = `Your tone of voice must be strictly ${tone}. Now, please respond to the following request: "${prompt}"`;

        // --- This block now calls OpenAI instead of Gemini ---
        const completion = await openai.chat.completions.create({
            model: "gpt-4o", // You can use "gpt-3.5-turbo" for a faster, cheaper option
            messages: [{ role: "user", content: fullPrompt }],
        });

        const text = completion.choices[0].message.content;
        res.json({ text });
        // --- End of updated block ---

    } catch (error) {
        console.error("OpenAI API error:", error);
        res.status(500).json({ message: 'An error occurred while communicating with the AI.' });
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});