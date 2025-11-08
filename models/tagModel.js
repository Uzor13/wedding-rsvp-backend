const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    couple: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Couple',
        required: true
    },
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Guest'
    }]
}, { timestamps: true });

tagSchema.index({name: 1, couple: 1}, {unique: true});

const Tag = mongoose.model('Tag', tagSchema);
module.exports = Tag;