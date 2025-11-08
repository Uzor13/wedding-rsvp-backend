const Settings = require('../models/settingsModel');

async function ensureSettings() {
    let settings = await Settings.findOne();
    if (!settings) {
        settings = new Settings();
        await settings.save();
    }
    return settings;
}

const getPublicSettings = async (req, res) => {
    try {
        const settings = await ensureSettings();
        res.json(settings);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

const getSettings = async (req, res) => {
    try {
        const settings = await ensureSettings();
        res.json(settings);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

const updateSettings = async (req, res) => {
    try {
        const allowedFields = ['eventTitle', 'coupleNames', 'eventDate', 'eventTime', 'venueName', 'venueAddress', 'colorOfDay'];
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

        const settings = await Settings.findOneAndUpdate(
            {},
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

