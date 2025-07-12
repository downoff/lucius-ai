require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const { TwitterApi } = require('twitter-api-v2');
const cron = require('node-cron'); // <-- NEW: The scheduler library
const User = require('./models/User');
const ScheduledPost = require('./models/ScheduledPost');
// ... other requires like bcrypt, jwt, etc.

const app = express();
const port = 3000;

// --- All your Middleware, DB Connection, Passport, and API Routes go here ---
// --- There are NO CHANGES to your existing routes. ---
// ... (app.use(cors), webhook, express.json, session, passport, mongoose.connect, etc.)
// ... (all your app.get and app.post routes for auth, AI, scheduling, etc.)


// --- NEW: THE SCHEDULER ENGINE (CRON JOB) ---
// This section runs automatically on the server.

console.log('Scheduler engine is setting up...');

// Schedule a task to run every minute ('* * * * *')
cron.schedule('* * * * *', async () => {
    console.log(`[${new Date().toISOString()}] Running scheduler: checking for due posts...`);

    const now = new Date();
    // Find posts that are due to be posted and have not been posted yet
    const duePosts = await ScheduledPost.find({
        scheduledAt: { $lte: now },
        status: 'scheduled'
    });

    if (duePosts.length === 0) {
        console.log('No posts are due.');
        return;
    }

    console.log(`Found ${duePosts.length} posts to publish.`);

    // Loop through each due post and try to publish it
    for (const post of duePosts) {
        try {
            const user = await User.findById(post.userId);
            if (!user || !user.xAuth || !user.xAuth.token) {
                throw new Error('User or X/Twitter auth tokens not found.');
            }

            // Create a Twitter client with that specific user's credentials
            const userTwitterClient = new TwitterApi({
                appKey: process.env.X_API_KEY,
                appSecret: process.env.X_API_KEY_SECRET,
                accessToken: user.xAuth.token,
                accessSecret: user.xAuth.tokenSecret,
            });

            // Post the tweet!
            await userTwitterClient.v2.tweet(post.content);

            // If successful, update the post's status in the database
            post.status = 'posted';
            post.postedAt = new Date();
            await post.save();
            console.log(`✅ Successfully posted tweet for user ${user.email}.`);

        } catch (error) {
            console.error(`❌ Failed to post tweet for post ID ${post._id}:`, error);
            // Mark the post as 'failed' so we don't try to send it again
            post.status = 'failed';
            await post.save();
        }
    }
});


// --- Start the Server ---
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});