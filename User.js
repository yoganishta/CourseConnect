// User.js
const mongoose = require('mongoose');

// Define the schema for the User
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
});

// Export the User model
module.exports = mongoose.model('User', userSchema);
