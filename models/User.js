const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
     name: {
        type: String,
        required: true,
     },
     lastName: {
        type: String,
        required: true,
     },
     age: {
        type: String,
        required: true,
     },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    resetPasswordToken: {
        type: String,
    },
    resetPasswordExpires: {
        type: Date,
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
