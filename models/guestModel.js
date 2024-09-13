const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema({
    name: String,
    phoneNumber: { type: String, unique: true },
    rsvpStatus: { type: Boolean, default: false },
    uniqueId: { type: String, unique: true },
    code: { type: String, unique: true },
    qrCode: String,
    isUsed: { type: Boolean, default: false },
});

const Guest = mongoose.model('Guest', guestSchema);

module.exports = Guest;