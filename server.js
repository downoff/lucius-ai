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
app.post('/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => { /* ...your webhook logic... */ });
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
// Auth and Conversation routes are here...
app.post('/api/users/register', async (req, res) => { /* ...your existing route... */ });
app.post('/api/users/login', async (req, res) => { /* ...your existing route... */ });
app.get('/api/users/me', authMiddleware, async (req, res) => { /* ...your existing route... */ });
app.post('/api/ai/generate', authMiddleware, async (req, res) => { /* ...your existing route... */ });
app.get('/api/conversations', authMiddleware, async (req, res) => { /* ...your existing route... */ });
app.get('/api/conversations/:id', authMiddleware, async (req, res) => { /* ...your existing route... */ });


// --- NEW: Protected Image Generation Route ---
app.post('/api/ai/generate-image', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || !user.isPro) {
            return res.status(403).json({ message: 'This is a Pro feature. Please upgrade your account.' });
        }

        const { prompt } = req.body;

        // NOTE: The exact model name and API call structure for image generation
        // via Vertex AI can vary. This is a representative example.
        // We are using a placeholder for the model name here.
        const model = genAI.getGenerativeModel({ model: "imagen-2" }); // Example model name

        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        // Image APIs often return data differently. We assume it returns an object with an image URL.
        // This line may need to be adjusted based on the actual response structure from the API.
        const imageUrl = response.candidates[0].content.parts[0].uri; 

        res.json({ imageUrl: imageUrl });

    } catch (error) {
        console.error("Image Generation API error:", error);
        res.status(500).json({ message: 'An error occurred while generating the image.' });
    }
});


// --- Start the Server ---
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});