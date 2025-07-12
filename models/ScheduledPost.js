const mongoose = require('mongoose');

const scheduledPostSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true 
    },
    content: {
        type: String,
        required: true,
        maxLength: 280 // Max length for a tweet
    },
    platform: {
        type: String,
        enum: ['X/Twitter'], // For now, we only support X
        required: true
    },
    status: {
        type: String,
        enum: ['scheduled', 'posted', 'failed'],
        default: 'scheduled'
    },
    scheduledAt: {
        type: Date,
        required: true
    },
    postedAt: {
        type: Date
    }
}, { timestamps: true }); // Automatically adds createdAt and updatedAt

const ScheduledPost = mongoose.model('ScheduledPost', scheduledPostSchema);

module.exports = ScheduledPost;