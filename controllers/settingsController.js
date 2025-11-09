const Settings = require('../models/settingsModel');

async function ensureSettings(coupleId = null) {
    const filter = coupleId ? {couple: coupleId} : {couple: null};
    let settings = await Settings.findOne(filter);
    if (!settings) {
        settings = await Settings.create(filter);
    }
    return settings;
}

const getPublicSettings = async (req, res) => {
    try {
        const {coupleId} = req.query;
        const settings = await ensureSettings(coupleId || null);
        res.json(settings);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

const getSettings = async (req, res) => {
    try {
        const coupleId = req.auth?.role === 'couple'
            ? req.auth.coupleId
            : (req.query.coupleId || null);
        const settings = await ensureSettings(coupleId);
        res.json(settings);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

const updateSettings = async (req, res) => {
    try {
        const allowedFields = ['eventTitle', 'titleFontFamily', 'coupleNames', 'eventDate', 'eventTime', 'venueName', 'venueAddress', 'colorOfDay'];
        const themeFields = ['primaryColor', 'secondaryColor', 'accentColor', 'backgroundColor', 'textColor', 'qrBackgroundColor', 'qrTextColor', 'buttonColor', 'buttonTextColor'];

        const update = {};

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                update[field] = req.body[field];
            }
        });

        if (req.body.theme && typeof req.body.theme === 'object') {
            themeFields.forEach((field) => {
                if (req.body.theme[field] !== undefined) {
                    update[`theme.${field}`] = req.body.theme[field];
                }
            });
        }

        const coupleId = req.auth?.role === 'couple'
            ? req.auth.coupleId
            : (req.body.coupleId || null);

        const settings = await Settings.findOneAndUpdate(
            coupleId ? {couple: coupleId} : {couple: null},
            {$set: update},
            {new: true, upsert: true, setDefaultsOnInsert: true}
        );

        res.json(settings);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

module.exports = {
    getPublicSettings,
    getSettings,
    updateSettings
};

