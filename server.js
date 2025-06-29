require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const authMiddleware = require('./middleware/auth');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Successfully connected to MongoDB.'))
    .catch((err) => console.error('MongoDB connection error:', err));

// --- DATABASE MODELS ---
const toolSchema = new mongoose.Schema({
    name: String,
    category: String,
    description: String
});
const Tool = mongoose.model('Tool', toolSchema);

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isPro: { type: Boolean, default: false },
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});
const User = mongoose.model('User', userSchema);


// --- API ROUTES ---

app.post('/api/users/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User with this email already exists.' });
        }
        user = new User({ email, password });
        await user.save();
        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// LOGIN ROUTE WITH EXTRA DEBUGGING
app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`--- LOGIN ATTEMPT for email: ${email} ---`);

        const user = await User.findOne({ email });
        if (!user) {
            console.log('DEBUG: User not found in database.');
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        console.log('DEBUG: User found. Comparing passwords...');
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('DEBUG: Password comparison failed. Passwords do not match.');
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        console.log('DEBUG: Password is correct. Generating token...');
        const payload = { user: { id: user.id } };
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});


// PROTECTED AI GENERATION ROUTE
app.post('/api/ai/generate', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        if (user.isPro) {
            const { prompt, tone } = req.body;
            const fullPrompt = `Your tone of voice must be strictly ${tone}. Now, please respond to the following request: "${prompt}"`;
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
            const result = await model.generateContent(fullPrompt);
            const response = await result.response;
            const text = response.text();
            res.json({ text });
        } else {
            return res.status(403).json({ message: 'This is a Pro feature. Please upgrade your account.' });
        }
    } catch (error) {
        console.error("Gemini API error:", error);
        res.status(500).json({ message: 'An error occurred while communicating with the AI.' });
    }
});


// --- Start the Server ---
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});