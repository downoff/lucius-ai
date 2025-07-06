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
app.post('/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => { /* ...your full webhook logic... */ });
app.use(express.json());

let genAI;
if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Successfully connected to MongoDB.'))
    .catch((err) => console.error('MongoDB connection error:', err));

const userSchema = new mongoose.Schema({ /* ...your full user schema... */ });
userSchema.pre('save', async function(next) { /* ...your password hashing logic... */ });
const User = mongoose.model('User', userSchema);

// All your User and AI routes go here...
// app.post('/api/users/register', ...)
// app.post('/api/users/login', ...)
// app.get('/api/users/me', ...)
// app.post('/api/ai/generate', ...)

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});