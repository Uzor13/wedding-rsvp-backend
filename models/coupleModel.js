const mongoose = require('mongoose');

const coupleSchema = new mongoose.Schema({
    name: {type: String, required: true},
    email: {type: String},
    username: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    eventTitle: {type: String, default: 'Wedding Invitation'}
}, {timestamps: true});

module.exports = mongoose.models.Couple || mongoose.model('Couple', coupleSchema);

