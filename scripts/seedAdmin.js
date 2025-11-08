const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const Guest = require('../models/guestModel');
const Tag = require('../models/tagModel');
const Settings = require('../models/settingsModel');

const adminSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, default: 'admin' }
}, { timestamps: true });

const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

async function seed() {
    if (!process.env.MONGO_URI) {
        console.error('MONGO_URI is not defined');
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000
    });

    await Promise.all([
        Guest.init(),
        Tag.init(),
        Admin.init(),
        Settings.init()
    ]);

    const username = 'admin';
    const plainPassword = 'admin1234';
    const hash = await bcrypt.hash(plainPassword, 10);

    await Admin.updateOne(
        { username },
        { $set: { password: hash, role: 'admin' } },
        { upsert: true }
    );

    let settings = await Settings.findOne();
    if (!settings) {
        settings = new Settings();
        await settings.save();
    }

    console.log(`Seeded admin user "${username}" and ensured default settings`);
    await mongoose.disconnect();
}

seed().catch(async (err) => {
    console.error(err);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
});

