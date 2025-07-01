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

app.post('/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => { /* ...your existing webhook logic... */ });

app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Successfully connected to MongoDB.'))
    .catch((err) => console.error('MongoDB connection error:', err));


// --- DATABASE MODELS ---
const userSchema = new mongoose.Schema({ /* ... your user schema ... */ });
userSchema.pre('save', async function(next) { /* ... your password hashing ... */ });
const User = mongoose.model('User', userSchema);

const messageSchema = new mongoose.Schema({ /* ... your message schema ... */ });
const conversationSchema = new mongoose.Schema({ /* ... your conversation schema ... */ }, { timestamps: true });
const Conversation = mongoose.model('Conversation', conversationSchema);


// --- API ROUTES ---
app.post('/api/users/register', async (req, res) => { /* ...your existing register route... */ });
app.post('/api/users/login', async (req, res) => { /* ...your existing login route... */ });
app.get('/api/users/me', authMiddleware, async (req, res) => { /* ...your existing get profile route... */ });
app.post('/api/ai/generate', authMiddleware, async (req, res) => { /* ...your existing generate route that saves history... */ });


// --- NEW: ROUTES FOR CHAT HISTORY ---

// GET all conversation titles for the logged-in user
app.get('/api/conversations', authMiddleware, async (req, res) => {
    try {
        const conversations = await Conversation.find({ userId: req.user.id })
            .sort({ createdAt: -1 }) // Sort by newest first
            .select('title createdAt'); // Only select the fields we need for the list
        
        res.json(conversations);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET a single, full conversation by its ID
app.get('/api/conversations/:id', authMiddleware, async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id);

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        // Security Check: Make sure the requested conversation belongs to the logged-in user
        if (conversation.userId.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        res.json(conversation);
    } catch (error) {
        console.error('Error fetching single conversation:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


// --- Start the Server ---
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});