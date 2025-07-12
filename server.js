require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const { TwitterApi } = require('twitter-api-v2'); // <-- NEW: Import Twitter library
const User = require('./models/User');
const authMiddleware = require('./middleware/auth');

const app = express();
const port = 3000;

// --- Middleware Setup ---
app.use(cors({ origin: ["https://www.ailucius.com", "http://127.0.0.1:5500", "http://localhost:5500"] }));
app.use(express.json());
app.use(session({ secret: 'your_very_secret_key_for_sessions', resave: false, saveUninitialized: true }));


// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI).then(() => console.log('Successfully connected to MongoDB.')).catch((err) => console.error('MongoDB connection error:', err));


// --- NEW: X/Twitter Auth Routes ---

// This route starts the process
app.get('/twitter/auth', authMiddleware, async (req, res) => {
    const twitterClient = new TwitterApi({
        appKey: process.env.X_API_KEY,
        appSecret: process.env.X_API_KEY_SECRET,
    });
    
    // The URL on our site that Twitter will send the user back to
    const callbackURL = 'http://localhost:3000/twitter/callback';
    
    try {
        const authLink = await twitterClient.generateAuthLink(callbackURL, { authAccessType: 'write' });
        
        // Save the temporary tokens to the user's session
        req.session.oauth_token = authLink.oauth_token;
        req.session.oauth_token_secret = authLink.oauth_token_secret;

        // Redirect the user to the Twitter authorization page
        res.redirect(authLink.url);

    } catch (error) {
        console.error('Error generating Twitter auth link:', error);
        res.status(500).send('Could not connect to Twitter.');
    }
});

// Twitter sends the user here after they approve
app.get('/twitter/callback', authMiddleware, async (req, res) => {
    const { oauth_token, oauth_verifier } = req.query;
    const { oauth_token_secret } = req.session;

    if (!oauth_token || !oauth_verifier || !oauth_token_secret) {
        return res.status(400).send('Callback request is not valid.');
    }

    try {
        const client = new TwitterApi({
            appKey: process.env.X_API_KEY,
            appSecret: process.env.X_API_KEY_SECRET,
            accessToken: oauth_token,
            accessSecret: oauth_token_secret,
        });

        const { accessToken, accessSecret } = await client.login(oauth_verifier);
        
        // Save the permanent tokens to the user's record in the database
        const user = await User.findById(req.user.id);
        user.xAuth = {
            token: accessToken,
            tokenSecret: accessSecret,
            isVerified: true
        };
        await user.save();

        console.log(`✅ X/Twitter account connected for user: ${user.email}`);
        
        // Redirect to the dashboard page upon success
        res.redirect('http://127.0.0.1:5500/dashboard.html');

    } catch (error) {
        console.error('Error during Twitter callback:', error);
        res.status(500).send('Could not connect your Twitter account.');
    }
});


// --- Other API Routes & Server Start ---
// (Your existing routes for users, login, etc., and app.listen would be here)


app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});