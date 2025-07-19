const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: false // Not required for Google OAuth users
    },
    googleId: { 
        type: String 
    },
    name: { 
        type: String 
    },
    isPro: { 
        type: Boolean, 
        default: false 
    },
    credits: {
        type: Number,
        default: 10 // Give 10 free trial credits to every new user
    },
    xAuth: {
        token: String,
        tokenSecret: String,
        isVerified: { type: Boolean, default: false }
    }
}, { timestamps: true });

// Password hashing middleware
userSchema.pre('save', async function(next) {
    if (this.password && this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;