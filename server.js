require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport');
const OpenAI = require('openai'); // Assuming we are using OpenAI
const authMiddleware = require('./middleware/auth');
const User = require('./models/User');
// ... other requires

const app = express();
// ... other middleware

// --- DATABASE, PASSPORT, STRIPE, ETC. SETUP ---
// (No changes to this section)

// --- ALL OTHER API ROUTES (Login, Register, etc.) ---
// (No changes to these routes)

// ===================================================================
// --- V3: UPGRADED AI GENERATION ROUTE WITH REAL-TIME STREAMING ---
// ===================================================================
app.post('/api/ai/generate', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || !user.isPro) {
            return res.status(403).json({ message: 'This is a Pro feature.' });
        }
        
        // --- Credit Check Logic ---
        if (user.credits <= 0) {
            return res.status(402).json({ message: 'You have run out of credits.' });
        }

        const { prompt, tone } = req.body;
        const fullPrompt = `Your tone of voice must be strictly ${tone}. Now, respond to: "${prompt}"`;

        // --- Set up Server-Sent Events (SSE) headers ---
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders(); // Send headers immediately

        const stream = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: fullPrompt }],
            stream: true, // This is the key to enabling streaming
        });

        let fullResponse = '';
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            fullResponse += content;
            // Send each chunk of text to the frontend as it arrives
            res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
        }

        // --- Save the full conversation after the stream is complete ---
        const chatTitle = prompt.substring(0, 30) + "...";
        // ... (We would add the logic to save the conversation here) ...

        // --- Subtract credit after successful generation ---
        user.credits -= 1;
        await user.save();
        
        console.log(`Stream completed for user ${user.email}. Credits remaining: ${user.credits}`);
        res.end(); // End the streaming connection

    } catch (error) {
        console.error("Streaming API error:", error);
        res.end(); // Ensure the connection is closed on error
    }
});


// --- Start the Server ---
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});