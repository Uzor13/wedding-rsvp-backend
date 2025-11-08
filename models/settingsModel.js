const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    couple: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Couple',
        default: null
    },
    eventTitle: {
        type: String,
        default: 'Wedding Invitation'
    },
    coupleNames: {
        type: String,
        default: 'Chris & Amaka'
    },
    eventDate: {
        type: String,
        default: 'November 9, 2024'
    },
    eventTime: {
        type: String,
        default: '2:00 PM'
    },
    venueName: {
        type: String,
        default: 'Space and Function Event Center'
    },
    venueAddress: {
        type: String,
        default: 'City Park, Ahmadu Bello Way, Wuse 2, Abuja'
    },
    colorOfDay: {
        type: String,
        default: 'White, Coffee and Beige'
    },
    theme: {
        primaryColor: {
            type: String,
            default: '#6F4E37'
        },
        secondaryColor: {
            type: String,
            default: '#8B7355'
        },
        accentColor: {
            type: String,
            default: '#F5E9D3'
        },
        backgroundColor: {
            type: String,
            default: '#FFFFFF'
        },
        textColor: {
            type: String,
            default: '#3D2B1F'
        },
        qrBackgroundColor: {
            type: String,
            default: '#F9FAFB'
        },
        qrTextColor: {
            type: String,
            default: '#111827'
        },
        buttonColor: {
            type: String,
            default: '#6F4E37'
        },
        buttonTextColor: {
            type: String,
            default: '#FFFFFF'
        }
    }
}, {timestamps: true, collection: 'settings'});

settingsSchema.index({couple: 1}, {unique: true, sparse: true});

module.exports = mongoose.models.Setting || mongoose.model('Setting', settingsSchema);

