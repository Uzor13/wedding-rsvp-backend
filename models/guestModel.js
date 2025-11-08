const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema({
    name: {type: String, required: true},
    phoneNumber: {type: String, required: true},
    rsvpStatus: {type: Boolean, default: false},
    uniqueId: {type: String, unique: true},
    code: {type: String, unique: true},
    qrCode: String,
    isUsed: {type: Boolean, default: false},
    couple: {type: mongoose.Schema.Types.ObjectId, ref: 'Couple', required: true},
    tags: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tag'
    }]
});

guestSchema.index({phoneNumber: 1, couple: 1}, {unique: true});

const Guest = mongoose.model('Guest', guestSchema);

module.exports = Guest;