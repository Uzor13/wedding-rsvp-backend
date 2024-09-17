const Guest = require('../models/guestModel');
const qrCode = require('qrcode');
const {SITE_LINK} = require('../config');
const {generateUniqueId, generateCode} = require('../utils/idUtils');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const twilio = require("../integration/twilio")

// Add new guest
const addGuest = async (req, res) => {
    try {
        const {name, phoneNumber} = req.body;

        const existingGuest = await Guest.findOne({phoneNumber});
        if (existingGuest) {
            return res.status(400).json({message: 'Guest with this phone number already exists'});
        }

        const uniqueId = generateUniqueId();
        const uniqueLink = `${SITE_LINK}/confirm-rsvp/${uniqueId}`;
        const qrcode = await qrCode.toDataURL(uniqueLink);
        const code = generateCode();

        const guest = new Guest({
            name,
            phoneNumber,
            uniqueId,
            qrCode: qrcode,
            code,
        });

        await guest.save();
        res.status(201).json({guest, uniqueLink, code});
    } catch (e) {
        res.status(400).json({error: e.message});
    }
};

// Handle RSVP
const handleRsvp = async (req, res) => {
    try {
        const guest = await Guest.findOne({uniqueId: req.params.uniqueId});
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
        const guest = await Guest.findOne({uniqueId: req.params.uniqueId});
        if (guest) {
            res.json(guest);
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
        const guests = await Guest.find({}).select('-qrCode');
        res.json(guests);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

const deleteGuest = async (req, res) => {
    try {
        const {phoneNumber} = req.params;
        const guest = await Guest.findOneAndDelete({phoneNumber});
        if (!guest) {
            return res.status(404).json({message: 'Guest not found'});
        }

        return res.json({code: res.status(200), message: "Guest deleted successfully"});

    } catch (e) {
        res.status(500).json({message: 'Error deleting guest', error: e.message});
    }
}

// Verify guest
const verifyGuest = async (req, res) => {
    try {
        const {uniqueId, code} = req.body;
        const guest = await Guest.findOne({$or: [{uniqueId}, {code}]});

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
        const {csvData} = req.body;

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
                    qrCode
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
        const token = req.headers['Authorization'];

        const guest = await Guest.findOne({uniqueId});
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
        let {name, phoneNumber, link} = req.body;
        let message = `Dear ${name}, you are cordially invited to the wedding ceremony of Chris and Amaka on the 9th of November in Abuja, please click the link below to confirm rsvp: ${link}`
        twilio.sendSMS(`${phoneNumber}`, message)
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
