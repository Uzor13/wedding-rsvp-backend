const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Guest'
    }]
}, { timestamps: true });

const Tag = mongoose.model('Tag', tagSchema);
module.exports = Tag;