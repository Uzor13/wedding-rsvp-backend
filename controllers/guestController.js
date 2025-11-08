const Guest = require('../models/guestModel');
const Tag = require('../models/tagModel');
const qrCode = require('qrcode');
const {SITE_LINK} = require('../config');
const {generateUniqueId, generateCode} = require('../utils/idUtils');
const termii = require("../integration/termii");
const csv = require("csv");
const Settings = require('../models/settingsModel');

// Add new guest
const addGuest = async (req, res) => {
    try {
        const {name, phoneNumber, coupleId: bodyCoupleId, tagId} = req.body;
        const coupleId = req.auth?.role === 'couple' ? req.auth.coupleId : bodyCoupleId;

        if (!coupleId) {
            return res.status(400).json({message: 'coupleId is required'});
        }

        if (!tagId) {
            return res.status(400).json({message: 'tagId is required'});
        }

        const existingGuest = await Guest.findOne({phoneNumber, couple: coupleId}, null, null);
        if (existingGuest) {
            return res.status(400).json({message: 'Guest with this phone number already exists'});
        }

        const tag = await Tag.findOne({_id: tagId, couple: coupleId});
        if (!tag) {
            return res.status(404).json({message: 'Tag not found for this couple'});
        }

        const uniqueId = generateUniqueId();
        const uniqueLink = `${SITE_LINK}/confirm-rsvp/${uniqueId}`;
        const qrcode = await qrCode.toDataURL(uniqueLink);
        let code = generateCode();

        const existingCodeForUser = await Guest.findOne({code}, null, null);
        if (existingCodeForUser) {
            code = generateCode();
        }

        const guest = new Guest({
            name,
            phoneNumber,
            uniqueId,
            qrCode: qrcode,
            code,
            couple: coupleId,
            tags: [tagId]
        });

        await guest.save();
        await Tag.findByIdAndUpdate(tag._id, {$addToSet: {users: guest._id}});
        await guest.populate('tags');
        res.status(201).json({guest, uniqueLink, code});
    } catch (e) {
        res.status(400).json({error: e.message});
    }
};

// Handle RSVP
const handleRsvp = async (req, res) => {
    try {
        const guest = await Guest.findOne({uniqueId: req.params.uniqueId}, null, null);
        if (guest) {
            guest.rsvpStatus = true;
            await guest.save();
            res.status(201).json({guest, success: true});
        } else {
            res.status(404).json({message: 'No guest found', success: false});
        }
    } catch (e) {
        res.status(500).json({message: e.message, success: false});
    }
};

// Get guest information
const getGuestInfo = async (req, res) => {
    try {
        const guest = await Guest.findOne({uniqueId: req.params.uniqueId}, null, null)
            .populate('couple')
            .populate('tags');
        if (guest) {
            const settings = await Settings.findOne({couple: guest.couple?._id}, null, null);
            res.json({
                ...guest.toObject(),
                settings
            });
        } else {
            res.status(404).json({error: 'Guest not found'});
        }
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

// Get all guests
const getAllGuests = async (req, res) => {
    try {
        const coupleId = req.auth?.role === 'couple' ? req.auth.coupleId : req.query.coupleId;
        const filter = coupleId ? {couple: coupleId} : {};
        const guests = await Guest.find(filter, null, null).select('-qrCode');
        res.json(guests);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

const deleteGuest = async (req, res) => {
    try {
        const {phoneNumber} = req.params;
        const coupleId = req.auth?.role === 'couple' ? req.auth.coupleId : req.query.coupleId;
        if (req.auth?.role === 'admin' && !coupleId) {
            return res.status(400).json({message: 'coupleId is required'});
        }
        const filter = {phoneNumber};
        if (coupleId) {
            filter.couple = coupleId;
        }
        const guest = await Guest.findOne(filter, null, null);
        if (!guest) {
            return res.status(404).json({message: 'Guest not found'});
        }

        await Tag.updateMany(
            {users: guest._id},
            {$pull: {users: guest._id}}
        );
        await Guest.deleteOne({_id: guest._id});

        return res.status(200).json({message: "Guest deleted successfully"});

    } catch (e) {
        res.status(500).json({message: 'Error deleting guest', error: e.message});
    }
}

// Verify guest
const verifyGuest = async (req, res) => {
    try {
        const {uniqueId, code} = req.body;
        const coupleId = req.auth?.role === 'couple' ? req.auth.coupleId : req.body.coupleId;
        const filter = {
            $or: [{uniqueId}, {code}]
        };
        if (coupleId) {
            filter.couple = coupleId;
        }

        const guest = await Guest.findOne(filter, null, null).populate('tags');

        if (!guest) {
            return res.status(401).json({success: false, message: 'Guest not found'});
        }

        if (guest.isUsed) {
            return res.status(400).json({success: false, message: 'This code has already been used'});
        }

        guest.isUsed = true;
        guest.rsvpStatus = true;
        await guest.save();

        res.json({success: true, message: 'Verification successful', guestName: guest.name});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

// Import guests from CSV
const importGuestsFromCsv = async (req, res) => {
    try {
        const {csvData, coupleId: bodyCoupleId} = req.body;
        const coupleId = req.auth?.role === 'couple' ? req.auth.coupleId : bodyCoupleId;

        if (!coupleId) {
            return res.status(400).json({message: 'coupleId is required'});
        }

        csv.parse(csvData, {columns: true, trim: true}, async (err, records) => {
            if (err) {
                return res.status(400).json({error: 'Invalid CSV format'});
            }

            const importedGuests = [];

            for (const record of records) {
                const uniqueId = generateUniqueId();
                const code = generateCode();
                const qrCode = await qrCode.toDataURL(uniqueId);

                const guest = new Guest({
                    name: record.name,
                    phoneNumber: record.phoneNumber,
                    uniqueId,
                    code,
                    qrCode,
                    couple: coupleId
                });

                await guest.save();
                importedGuests.push(guest);
            }

            res.json(importedGuests);
        });
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

const confirmRsvp = async (req, res) => {
    try {
        const {uniqueId} = req.params;
        const coupleId = req.auth?.role === 'couple' ? req.auth.coupleId : req.body.coupleId;
        const filter = {uniqueId};
        if (coupleId) {
            filter.couple = coupleId;
        }
        const guest = await Guest.findOne(filter, null, null);

        if (!guest) {
            return res.status(404).json({message: 'Guest not found'});
        }

        if (guest.isUsed) {
            return res.status(400).json({success: false, message: 'This QR code has already been scanned'});
        }

        guest.isUsed = true;
        guest.rsvpStatus = true;

        guest.save().then(() => {
            res.json({success: true, message: 'RSVP and verification successful', guestName: guest.name});
        });

    } catch
        (error) {
        res.status(500).json({message: error.message});
    }
}

const sendSms = async (req, res) => {
    try {
        let {name, phoneNumber, link, coupleId: bodyCoupleId} = req.body;
        const coupleId = req.auth?.role === 'couple' ? req.auth.coupleId : bodyCoupleId;
        if (!coupleId) {
            return res.status(400).json({message: 'coupleId is required'});
        }
        const settings = coupleId ? await Settings.findOne({couple: coupleId}) : null;
        const coupleNames = settings?.coupleNames || 'Chris and Amaka';
        const eventTitle = settings?.eventTitle || 'Wedding Celebration';
        const eventDate = settings?.eventDate || 'the wedding day';
        const eventTime = settings?.eventTime || 'the scheduled time';
        const venue = settings?.venueName || 'our celebration venue';
        const venueAddress = settings?.venueAddress || '';
        const colorOfDay = settings?.colorOfDay ? ` Colour of the day: ${settings.colorOfDay}.` : '';
        const addressPart = venueAddress ? ` (${venueAddress})` : '';
        const message = `Dear ${name}, you are warmly invited to ${coupleNames}'s ${eventTitle} at ${venue}${addressPart} on ${eventDate} at ${eventTime}.${colorOfDay} Confirm your RSVP here: ${link}`;
        termii.sendSMS(`${phoneNumber}`, message)
            .then(() => console.log("Sms sent successfully"))
            .catch((err) => console.log(err));
        return res.status(200).json({success: true, message: 'SMS sent successfully'});
    } catch (e) {
        console.log(e)
        return res.status(400).json({message: e.message});
    }
}

module.exports = {
    addGuest,
    handleRsvp,
    getGuestInfo,
    getAllGuests,
    verifyGuest,
    importGuestsFromCsv,
    deleteGuest,
    confirmRsvp,
    sendSms
};
