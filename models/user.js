const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    googleId: { type: String },
    name: { type: String },
    isPro: { type: Boolean, default: false },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
    if (this.password && this.isModified('password')) {
        const salt = await require('bcryptjs').genSalt(10);
        this.password = await require('bcryptjs').hash(this.password, salt);
    }
    next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;